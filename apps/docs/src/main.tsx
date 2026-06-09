import { render } from 'preact'
import { App } from './App'
import './app.css'

const root = document.getElementById('app')
if (root) render(<App />, root)
