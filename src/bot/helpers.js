const h = module.exports

h.escapeHTMLChars = text => text.replace(/[<&"]/g, escapeHTMLChar)

h.formatHTML = (text = '', entities = []) => {
  const chars = ['', ...text.split(''), ''].map(escapeHTMLChar)
  entities.forEach(entity => {
    const tag = getHTMLTag(entity)
    const openPos = entity.offset
    const secondPos = openPos + 1
    const closePos = entity.offset + entity.length + 1
    if (chars[secondPos].match(/.*(<\/.+>)/)) {
      chars[secondPos] = chars[secondPos].replace(/.*(<\/.+>)/, `$1${tag.open}`)
    } else {
      chars[openPos] += tag.open
    }
    chars[closePos] = tag.close + chars[closePos]
  })
  return chars.join('')
}

h.fullName = from =>
  h.escapeHTMLChars([from.first_name || from.firstName, from.last_name || from.lastName].filter(_ => _).join(' ')) ||
  'Незнакомец'

h.pause = delay => new Promise(resolve => setTimeout(resolve, delay))

// Private
function escapeHTMLChar (c) {
  switch (c) {
    case '&': return '&amp;' // prettier-ignore
    case '"': return '&quot;' // prettier-ignore
    case '\'': return '&#39;' // prettier-ignore
    case '<': return '&lt;' // prettier-ignore
    default: return c // prettier-ignore
  }
}

function tag (name, params) {
  return {
    open: params
      ? `<${name} ${Object.entries(params)
          .map(([key, value]) => `${key}="${value.replace(/[<&"]/g, escapeHTMLChar)}"`)
          .join(' ')}>`
      : `<${name}>`,
    close: `</${name}>`
  }
}

const HTMLTags = new Map([
  ['bold', tag('b')],
  ['italic', tag('i')],
  ['code', tag('code')],
  ['pre', tag('pre')],
  ['strikethrough', tag('s')],
  ['underline', tag('u')],
  ['text_link', ({ url }) => tag('a', { href: url })],
  ['text_mention', ({ user }) => tag('a', { href: `tg://user?id=${user.id}` })]
])

function getHTMLTag (entity) {
  const tag = HTMLTags.get(entity.type || 'unknown')
  if (!tag) return { open: '', close: '' }
  return typeof tag === 'function' ? tag(entity) : tag
}
