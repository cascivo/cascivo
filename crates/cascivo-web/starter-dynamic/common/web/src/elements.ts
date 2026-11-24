// The custom elements the server-rendered markup uses, plus their glue and CSS.
import '@cascivo/elements/elements.css'
import { define as dialog } from '@cascivo/elements/dialog'
import { define as form } from '@cascivo/elements/form'
import '@cascivo/elements/htmx'
import { define as menu } from '@cascivo/elements/menu'
import { define as tabs } from '@cascivo/elements/tabs'
import { define as toaster } from '@cascivo/elements/toaster'

for (const define of [dialog, form, menu, tabs, toaster]) define()
