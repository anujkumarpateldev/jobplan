/**
 * Returns an embeddable iframe src URL for supported video platforms,
 * or null if the URL can't be embedded.
 *
 * Supported:
 *   YouTube  — youtube.com/watch?v=ID  |  youtu.be/ID  |  youtube.com/shorts/ID
 *   Vimeo    — vimeo.com/ID
 */
export function getEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    // YouTube standard + shorts
    if (host === 'youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }

    // YouTube short link
    if (host === 'youtu.be') {
      const v = u.pathname.slice(1).split('?')[0]
      if (v) return `https://www.youtube.com/embed/${v}`
    }

    // Vimeo
    if (host === 'vimeo.com') {
      const v = u.pathname.match(/^\/(\d+)/)
      if (v) return `https://player.vimeo.com/video/${v[1]}`
    }

    return null
  } catch {
    return null
  }
}
