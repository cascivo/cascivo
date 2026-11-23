// Copy-to-clipboard for the static home: any [data-copy] button copies its value and flips
// data-state to "copied" for 1.5 s, mirroring @cascivo/components CopyButton.
document.addEventListener('click', (e) => {
  const b = e.target instanceof Element && e.target.closest('[data-copy]')
  if (!b) return
  navigator.clipboard?.writeText(b.getAttribute('data-copy') || '').then(() => {
    b.setAttribute('data-state', 'copied')
    setTimeout(() => b.setAttribute('data-state', 'idle'), 1500)
  })
})
