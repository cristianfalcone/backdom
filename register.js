import createDocument from './index.js'

if (globalThis.window == null) {
  globalThis.window = createDocument().defaultView
  Object.assign(globalThis, globalThis.window)
}
