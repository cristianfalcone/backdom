import createDocument from './index.js'

if (globalThis.window == null) Object.assign(globalThis, globalThis.window = createDocument().defaultView)
