const h = module.exports

h.escapeHTMLChars = text => text.replace(/[<&"]/g, escapeHTMLChar)

function escapeHTMLChar (c) {
  switch (c) {
    case '&': return '&amp;' // prettier-ignore
    case '"': return '&quot;' // prettier-ignore
    case '\'': return '&#39;' // prettier-ignore
    case '<': return '&lt;' // prettier-ignore
    default: return c // prettier-ignore
  }
}

h.fullName = from =>
  h.escapeHTMLChars([from.first_name || from.firstName, from.last_name || from.lastName].filter(_ => _).join(' ')) ||
  'Незнакомец'

h.pause = delay => new Promise(resolve => setTimeout(resolve, delay))
