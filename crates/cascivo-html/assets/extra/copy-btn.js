document.addEventListener("click", (e) => {
  const b = e.target instanceof Element && e.target.closest("[data-copy-btn]");
  if (!b) return;
  const root = b.parentElement;
  const code = root && root.querySelector("code");
  if (!code || !navigator.clipboard) return;
  navigator.clipboard.writeText(code.textContent || "").then(() => {
    b.setAttribute("data-state", "copied");
    setTimeout(() => b.setAttribute("data-state", "idle"), 1500);
  });
});
