// A hash router that redirects `/` to `#/` on load, plus an in-page anchor: four URLs for two
// pages. Each page has one image without alt text, so a scan that counts a page twice shows up.
const IMAGE = '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="1" height="1">'

const app = document.getElementById('app')
if (app === null) throw new Error('#app is missing')

function render(): void {
  if (app === null) return
  app.innerHTML =
    location.hash === '#/about'
      ? `<h1>About us</h1>${IMAGE}<p><a href="#/">Home</a></p>`
      : `<h1>Hello eval</h1>${IMAGE}<p><a href="#details">Details</a> <a href="#/about">About</a></p>` +
        '<h2 id="details">Details</h2>'
}

if (location.hash === '') history.replaceState(null, '', '#/')
addEventListener('hashchange', render)
render()
