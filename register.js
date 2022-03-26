if (typeof global != 'undefined' && global.document == null) {
  global.window = await import('./index.js').then(mod => mod.default().defaultView)
  Object.assign(global, global.window)
}
