//! A small single-threaded signal layer: [`Signal`], [`computed`], [`effect`], [`batch`].
//!
//! Signals track which effects read them. Setting a signal re-runs those effects, once per
//! [`batch`]. Nothing here knows about the DOM; [`crate::App`] binds effects to nodes.

use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

thread_local! {
    static OBSERVER: RefCell<Option<Rc<EffectInner>>> = const { RefCell::new(None) };
    static DEPTH: Cell<usize> = const { Cell::new(0) };
    static PENDING: RefCell<Vec<Rc<EffectInner>>> = const { RefCell::new(Vec::new()) };
    static NEXT_ID: Cell<usize> = const { Cell::new(1) };
}

// Restore thread-local state on unwind too, so a panicking handler cannot leave effects stuck
// in a batch or reading under the wrong observer.
struct ObserverGuard(Option<Rc<EffectInner>>);

impl ObserverGuard {
    fn set(next: Option<Rc<EffectInner>>) -> Self {
        ObserverGuard(OBSERVER.with(|o| o.replace(next)))
    }
}

impl Drop for ObserverGuard {
    fn drop(&mut self) {
        OBSERVER.with(|o| *o.borrow_mut() = self.0.take());
    }
}

struct DepthGuard;

impl DepthGuard {
    fn enter() -> Self {
        DEPTH.with(|d| d.set(d.get() + 1));
        DepthGuard
    }
}

impl Drop for DepthGuard {
    fn drop(&mut self) {
        DEPTH.with(|d| d.set(d.get() - 1));
    }
}

trait Source {
    fn unsubscribe(&self, id: usize);
}

struct EffectInner {
    id: usize,
    run: RefCell<Option<Box<dyn FnMut()>>>,
    sources: RefCell<Vec<Rc<dyn Source>>>,
    queued: Cell<bool>,
    running: Cell<bool>,
    alive: Cell<bool>,
}

impl EffectInner {
    fn clear_sources(&self) {
        for s in self.sources.take() {
            s.unsubscribe(self.id);
        }
    }

    fn execute(self: &Rc<Self>) {
        if !self.alive.get() || self.running.get() {
            return;
        }
        let Some(mut f) = self.run.borrow_mut().take() else {
            return;
        };
        self.clear_sources();
        self.running.set(true);
        {
            let _observer = ObserverGuard::set(Some(self.clone()));
            f();
        }
        self.running.set(false);
        if self.alive.get() {
            *self.run.borrow_mut() = Some(f);
        }
    }
}

fn schedule(eff: Rc<EffectInner>) {
    if DEPTH.with(Cell::get) > 0 {
        if !eff.queued.replace(true) {
            PENDING.with(|p| p.borrow_mut().push(eff));
        }
    } else {
        eff.execute();
    }
}

struct Core<T> {
    value: RefCell<T>,
    subs: RefCell<Vec<(usize, Weak<EffectInner>)>>,
}

impl<T> Source for Core<T> {
    fn unsubscribe(&self, id: usize) {
        self.subs.borrow_mut().retain(|(i, _)| *i != id);
    }
}

/// A reactive value. Cloning shares the same value.
pub struct Signal<T: 'static>(Rc<Core<T>>);

impl<T> Clone for Signal<T> {
    fn clone(&self) -> Self {
        Signal(self.0.clone())
    }
}

impl<T: Default> Default for Signal<T> {
    fn default() -> Self {
        Signal::new(T::default())
    }
}

impl<T: 'static> Signal<T> {
    pub fn new(value: T) -> Self {
        Signal(Rc::new(Core {
            value: RefCell::new(value),
            subs: RefCell::new(Vec::new()),
        }))
    }

    fn track(&self) {
        OBSERVER.with(|o| {
            let o = o.borrow();
            let Some(eff) = o.as_ref() else { return };
            let mut subs = self.0.subs.borrow_mut();
            if subs.iter().all(|(i, _)| *i != eff.id) {
                subs.push((eff.id, Rc::downgrade(eff)));
                eff.sources.borrow_mut().push(self.0.clone());
            }
        });
    }

    fn notify(&self) {
        let subs: Vec<_> = self
            .0
            .subs
            .borrow()
            .iter()
            .filter_map(|(_, w)| w.upgrade())
            .collect();
        batch(|| subs.into_iter().for_each(schedule));
    }

    /// Read without subscribing the running effect.
    pub fn with_untracked<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        f(&self.0.value.borrow())
    }

    /// Read and subscribe the running effect.
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.track();
        self.with_untracked(f)
    }

    pub fn set(&self, value: T) {
        *self.0.value.borrow_mut() = value;
        self.notify();
    }

    pub fn update(&self, f: impl FnOnce(&mut T)) {
        f(&mut self.0.value.borrow_mut());
        self.notify();
    }
}

impl<T: Clone + 'static> Signal<T> {
    pub fn get(&self) -> T {
        self.with(T::clone)
    }

    pub fn get_untracked(&self) -> T {
        self.with_untracked(T::clone)
    }
}

impl<T: PartialEq + 'static> Signal<T> {
    /// Set, notifying only when the value differs.
    pub fn set_if_changed(&self, value: T) {
        if *self.0.value.borrow() != value {
            self.set(value);
        }
    }
}

/// A running effect. Dropping it stops the effect.
#[must_use = "dropping an Effect stops it"]
pub struct Effect(Rc<EffectInner>);

impl Effect {
    /// Stop the effect now.
    pub fn dispose(&self) {
        self.0.alive.set(false);
        self.0.clear_sources();
    }
}

impl Drop for Effect {
    fn drop(&mut self) {
        self.dispose();
    }
}

/// Run `f` now and again whenever a signal it read changes.
pub fn effect(f: impl FnMut() + 'static) -> Effect {
    let id = NEXT_ID.with(|n| n.replace(n.get() + 1));
    let inner = Rc::new(EffectInner {
        id,
        run: RefCell::new(Some(Box::new(f))),
        sources: RefCell::new(Vec::new()),
        queued: Cell::new(false),
        running: Cell::new(false),
        alive: Cell::new(true),
    });
    inner.execute();
    Effect(inner)
}

/// A derived value. Recomputes when its inputs change and notifies only if the result differs.
pub struct Computed<T: 'static> {
    sig: Signal<T>,
    _effect: Rc<Effect>,
}

impl<T> Clone for Computed<T> {
    fn clone(&self) -> Self {
        Computed {
            sig: self.sig.clone(),
            _effect: self._effect.clone(),
        }
    }
}

impl<T: Clone + 'static> Computed<T> {
    pub fn get(&self) -> T {
        self.sig.get()
    }
    pub fn get_untracked(&self) -> T {
        self.sig.get_untracked()
    }
}

impl<T: 'static> Computed<T> {
    pub fn with<R>(&self, f: impl FnOnce(&T) -> R) -> R {
        self.sig.with(f)
    }
}

/// Build a [`Computed`] from `f`.
pub fn computed<T: PartialEq + 'static>(mut f: impl FnMut() -> T + 'static) -> Computed<T> {
    let slot: Rc<RefCell<Option<Signal<T>>>> = Rc::default();
    let s = slot.clone();
    let eff = effect(move || {
        let v = f();
        let existing = s.borrow().clone();
        match existing {
            Some(sig) => sig.set_if_changed(v),
            None => *s.borrow_mut() = Some(Signal::new(v)),
        }
    });
    let sig = slot.borrow().clone().expect("effect runs once on creation");
    Computed {
        sig,
        _effect: Rc::new(eff),
    }
}

/// Group writes: effects run once, after `f` returns.
pub fn batch<R>(f: impl FnOnce() -> R) -> R {
    let out = {
        let _depth = DepthGuard::enter();
        f()
    };
    if DEPTH.with(Cell::get) == 0 {
        loop {
            let next = PENDING.with(|p| {
                let mut p = p.borrow_mut();
                (!p.is_empty()).then(|| p.remove(0))
            });
            let Some(eff) = next else { break };
            eff.queued.set(false);
            // Effects that write signals run their dependents in a nested batch.
            let _depth = DepthGuard::enter();
            eff.execute();
        }
    }
    out
}

/// Read signals inside `f` without subscribing the running effect.
pub fn untracked<R>(f: impl FnOnce() -> R) -> R {
    let _observer = ObserverGuard::set(None);
    f()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn effect_reruns_on_change() {
        let s = Signal::new(1);
        let log = Rc::new(RefCell::new(Vec::new()));
        let l = log.clone();
        let s2 = s.clone();
        let _e = effect(move || l.borrow_mut().push(s2.get()));
        s.set(2);
        s.update(|v| *v += 1);
        assert_eq!(*log.borrow(), [1, 2, 3]);
    }

    #[test]
    fn batch_runs_once() {
        let (a, b) = (Signal::new(1), Signal::new(1));
        let n = Rc::new(Cell::new(0));
        let (n2, a2, b2) = (n.clone(), a.clone(), b.clone());
        let _e = effect(move || {
            let _ = a2.get() + b2.get();
            n2.set(n2.get() + 1);
        });
        batch(|| {
            a.set(5);
            b.set(6);
        });
        assert_eq!(n.get(), 2);
    }

    #[test]
    fn computed_notifies_only_on_change() {
        let s = Signal::new(3);
        let s2 = s.clone();
        let even = computed(move || s2.get() % 2 == 0);
        let n = Rc::new(Cell::new(0));
        let (n2, e2) = (n.clone(), even.clone());
        let _e = effect(move || {
            let _ = e2.get();
            n2.set(n2.get() + 1);
        });
        s.set(5);
        assert_eq!(n.get(), 1);
        s.set(4);
        assert_eq!(n.get(), 2);
        assert!(even.get());
    }

    #[test]
    fn dropped_effect_stops() {
        let s = Signal::new(0);
        let n = Rc::new(Cell::new(0));
        let (n2, s2) = (n.clone(), s.clone());
        let e = effect(move || {
            let _ = s2.get();
            n2.set(n2.get() + 1);
        });
        drop(e);
        s.set(1);
        assert_eq!(n.get(), 1);
    }

    #[test]
    fn dynamic_dependencies_follow_branches() {
        let (flag, a, b) = (Signal::new(true), Signal::new(0), Signal::new(0));
        let n = Rc::new(Cell::new(0));
        let (n2, f2, a2, b2) = (n.clone(), flag.clone(), a.clone(), b.clone());
        let _e = effect(move || {
            let _ = if f2.get() { a2.get() } else { b2.get() };
            n2.set(n2.get() + 1);
        });
        b.set(1);
        assert_eq!(n.get(), 1);
        flag.set(false);
        b.set(2);
        a.set(9);
        assert_eq!(n.get(), 3);
    }

    #[test]
    fn panic_in_batch_does_not_stick_the_batch() {
        let s = Signal::new(0);
        let seen = Rc::new(Cell::new(0));
        let (s2, seen2) = (s.clone(), seen.clone());
        let _e = effect(move || seen2.set(s2.get()));
        let r = std::panic::catch_unwind(|| batch(|| panic!("boom")));
        assert!(r.is_err());
        s.set(5);
        assert_eq!(seen.get(), 5);
    }
}
