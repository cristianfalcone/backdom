export default () => {
  const document = new Document(), html = document.createElement('html')

  document.appendChild(document.documentElement = html)

  html.appendChild(document.head = document.createElement('head'))
  html.appendChild(document.body = document.createElement('body'))

  Object.assign(document, document.defaultView = { document, Node, Element, Attr, Text, Document })

  return document
}

const
  s = Symbol,

  TYPE = s(), NAME = s(), VALUE = s(), ATTRS = s(), PARENT = s(), CHILDREN = s(), START = s(), PREV = s(), NEXT = s(), END = s(),

  isVoid = tag => /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i.test(tag),
  
  isEmptiable = name => /^(?:allowfullscreen|allowpaymentrequest|async|autofocus|autoplay|checked|class|contenteditable|controls|default|defer|disabled|draggable|formnovalidate|hidden|id|ismap|itemscope|loop|multiple|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|selected|style|truespee)$/i.test(name),

  replacements = { '\xA0': '&nbsp;', '&': '&amp;', '<': '&lt;', '>': '&gt;' },

  getEnd = node => node[END] ?? node,

  setAdjacent = (prev, next) => {
    if (prev) prev[NEXT] = next
    if (next) next[PREV] = prev
  },

  setSiblings = (prev, node, next) => {
    setAdjacent(prev, node)
    setAdjacent(node, next)
  },

  setBoundaries = (prev, node, next) => {
    setAdjacent(prev, node)
    setAdjacent(getEnd(node), next)
  },

  getAttr = ({ [NEXT]: node }, name) => {
    while (node[TYPE] === Node.ATTRIBUTE_NODE) {
      if (node[NAME] === name) return node
      node = node[NEXT]
    }
  },

  Node = class {
    static ELEMENT_NODE = 1
    static ATTRIBUTE_NODE = 2
    static TEXT_NODE = 3
    static DOCUMENT_NODE = 9

    constructor(type, name) {
      this[TYPE] = type
      this[NAME] = name
      this[PARENT] = null
      this[PREV] = null
      this[NEXT] = null
    }

    *[CHILDREN]({ filter = () => true, map = v => v } = {}) {
      let { firstChild: child } = this

      while (child) {
        if (filter(child)) yield map(child)
        child = child.nextSibling
      }
    }

    get nodeType() {
      return this[TYPE]
    }

    get nodeName() {
      return this[NAME]
    }

    get parentNode() {
      return this[PARENT]
    }

    get nextSibling() {
      const next = getEnd(this)[NEXT]
      return next?.[TYPE] === END ? null : next
    }

    get previousSibling() {
      const { [PREV]: prev } = this
      switch (prev?.[TYPE]) {
        case END:
          return prev[START]
        case Node.TEXT_NODE:
          return prev
      }
      return null
    }

    get firstChild() {
      let { [NEXT]: next, [END]: end } = this
      while (next?.[TYPE] === Node.ATTRIBUTE_NODE) next = next[NEXT]
      return next === end ? null : next
    }

    get lastChild() {
      const prev = this[END]?.[PREV]
      switch (prev?.[TYPE]) {
        case END:
          return prev[START]
        case Node.ATTRIBUTE_NODE:
          return null
      }
      return prev === this ? null : prev
    }

    get childNodes() {
      return [...this[CHILDREN]()]
    }

    appendChild(child) {
      return this.insertBefore(child, this[END])
    }

    insertBefore(child, ref) {
      if (child === ref) return child
      if (child === this) throw new Error('The new child element contains the parent') // a node contains iteself

      ref ??= this[END]

      switch (child?.[TYPE]) {
        case Node.ELEMENT_NODE:
          child.remove()
          child[PARENT] = this
          setBoundaries(ref[PREV], child, ref)
          break
        case Node.TEXT_NODE:
          child.remove()
        default:
          child[PARENT] = this
          setSiblings(ref[PREV], child, ref)
          break
      }

      return child
    }

    removeChild(child) {
      if (child?.[PARENT] !== this) throw new Error('The node to be removed is not a child of this node.')
      child.remove()
      return child
    }

    remove() {
      setAdjacent(this[PREV], getEnd(this)[NEXT])
      this[PARENT] = this[PREV] = getEnd(this)[NEXT] = null
    }

    replaceChildren(...nodes) {
      let { firstChild: next } = this, after
      while (next !== null) {
        after = next.nextSibling
        next.remove()
        next = after
      }
      for (const node of nodes) this.appendChild(node)
    }
  },

  Element = class extends Node {
    constructor(nodeType, nodeName) {
      super(nodeType ?? Node.ELEMENT_NODE, nodeName)
      this[NEXT] = this[END] = { [TYPE]: END, [START]: this, [PREV]: this, [NEXT]: null }
    }

    *[ATTRS]({ filter = () => true, map = v => v } = {}) {
      let { [NEXT]: next } = this
      while (next[TYPE] === Node.ATTRIBUTE_NODE) {
        if (filter(next)) yield map(next)
        next = next[NEXT]
      }
    }

    get innerHTML() {
      return this.childNodes.join('')
    }

    get outerHTML() {
      return this.toString()
    }

    get attributes() {
      return [...this[ATTRS]()]
    }

    get children() {
      return [...this[CHILDREN]({ filter: node => node[TYPE] === Node.ELEMENT_NODE })]
    }

    hasAttributes() {
      return this[NEXT][TYPE] === Node.ATTRIBUTE_NODE
    }

    getAttributeNames() {
      return [...this[ATTRS]({ map: attr => attr.name })]
    }

    setAttribute(name, value) {
      const attr = getAttr(this, name)
      if (attr) attr[VALUE] = value
      else setSiblings(this, new Attr(name, value), this[NEXT])
    }

    getAttribute(name) {
      return getAttr(this, name)?.[VALUE]
    }

    removeAttribute(name) {
      const attr = getAttr(this, name)
      attr && setAdjacent(attr[PREV], attr[NEXT])
    }

    toString() {
      const tag = this.nodeName.toLowerCase()
      return `<${tag}${this.hasAttributes() ? ' ' : ''}${this.attributes.join(' ')}>${isVoid(tag) ? '' : `${this.innerHTML}</${tag}>`}`
    }
  },

  Attr = class extends Node {
    constructor(name, value) {
      super(Node.ATTRIBUTE_NODE, name)
      this[VALUE] = value
    }

    get name() {
      return this[NAME]
    }

    get value() {
      return this[VALUE]
    }

    toString() {
      const { name, value } = this
      return isEmptiable(name) && !value ? name : `${name}="${String(value).replace(/"/g, '&quot;')}"`
    }
  },

  Text = class extends Node {
    constructor(text) {
      super(Node.TEXT_NODE, '#text')
      this[VALUE] = text
    }

    set data(text) {
      this[VALUE] = text
    }

    get data() {
      return this[VALUE]
    }

    toString() {
      return String(this.data).replace(/[<>&\xA0]/g, c => replacements[c])
    }
  },

  Document = class extends Element {
    constructor() {
      super(Node.DOCUMENT_NODE, '#document')
    }

    createElement(type) {
      return new Element(null, String(type).toUpperCase())
    }

    createTextNode(text) {
      return new Text(text)
    }

    toString() {
      return `<!DOCTYPE html>${this.childNodes}`
    }
  }
