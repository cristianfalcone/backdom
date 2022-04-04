import createDocument from './index.js'

if (typeof global != 'undefined' && global.document == null) {
  global.window = createDocument().defaultView
  Object.assign(global, global.window)
}
