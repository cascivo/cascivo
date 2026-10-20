// Each view has one image without alt text on purpose: axe reports exactly one critical
// violation per page, so the test can tell that both visited URLs were scanned and summed.
const IMAGE = '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="1" height="1">'

const app = document.getElementById('app')
if (app === null) throw new Error('#app is missing')

function render(): void {
  if (app === null) return
  app.innerHTML =
    location.hash === '#/about'
      ? `<h1>About us</h1>${IMAGE}<p><a href="#/">Home</a></p>`
      : `<h1>Hello eval</h1>${IMAGE}<p><a href="#/about">About</a></p>`
}

addEventListener('hashchange', render)
render()
