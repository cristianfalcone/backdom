import './register.js'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

let it

// ----------------------------------------------------------------------------

it = suite('createElement')

it('should create empty div element', () => {
  assert.snapshot(document.createElement('div').outerHTML, '<div></div>')
})

it('should create div element with attribute', () => {
  const el = document.createElement('div')
  el.setAttribute('id', 'foo')
  assert.snapshot(el.outerHTML, '<div id="foo"></div>')
})

it('should create div element with text child', () => {
  const el = document.createElement('div')
  el.appendChild(document.createTextNode('foo'))
  assert.snapshot(el.outerHTML, '<div>foo</div>')
})

it('should create div element with text children', () => {
  const el = document.createElement('div')
  el.appendChild(document.createTextNode('foo'))
  el.appendChild(document.createTextNode('bar'))
  assert.snapshot(el.outerHTML, '<div>foobar</div>')
})

it('should create div element with element child', () => {
  const el = document.createElement('div')
  el.appendChild(document.createElement('span'))
  assert.snapshot(el.outerHTML, '<div><span></span></div>')
})

it('should create div element with children', () => {
  const el = document.createElement('div')
  const child = document.createElement('span')
  child.setAttribute('id', 'foo')
  el.appendChild(child)
  el.appendChild(document.createTextNode('bar'))
  assert.snapshot(el.outerHTML, '<div><span id="foo"></span>bar</div>')
})

it.run()
