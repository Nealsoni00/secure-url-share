/**
 * Detect the type of content from a URL
 */
export function detectUrlType(url: string): {
  type: string
  icon: string
  color: string
} {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()

    // Video platforms
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { type: 'YouTube', icon: '▶️', color: 'bg-red-100 text-red-700' }
    }
    if (hostname.includes('loom.com')) {
      return { type: 'Loom', icon: '🎥', color: 'bg-purple-100 text-purple-700' }
    }
    if (hostname.includes('vimeo.com')) {
      return { type: 'Vimeo', icon: '▶️', color: 'bg-blue-100 text-blue-700' }
    }

    // Document types by extension
    if (pathname.endsWith('.pdf')) {
      return { type: 'PDF', icon: '📄', color: 'bg-orange-100 text-orange-700' }
    }
    if (pathname.match(/\.(doc|docx)$/)) {
      return { type: 'Word', icon: '📝', color: 'bg-blue-100 text-blue-700' }
    }
    if (pathname.match(/\.(xls|xlsx)$/)) {
      return { type: 'Excel', icon: '📊', color: 'bg-green-100 text-green-700' }
    }
    if (pathname.match(/\.(ppt|pptx)$/)) {
      return { type: 'PowerPoint', icon: '📊', color: 'bg-red-100 text-red-700' }
    }

    // Cloud storage
    if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
      return { type: 'Google Drive', icon: '☁️', color: 'bg-yellow-100 text-yellow-700' }
    }
    if (hostname.includes('dropbox.com')) {
      return { type: 'Dropbox', icon: '📦', color: 'bg-blue-100 text-blue-700' }
    }
    if (hostname.includes('onedrive.live.com') || hostname.includes('sharepoint.com')) {
      return { type: 'OneDrive', icon: '☁️', color: 'bg-blue-100 text-blue-700' }
    }

    // Design/Creative
    if (hostname.includes('figma.com')) {
      return { type: 'Figma', icon: '🎨', color: 'bg-purple-100 text-purple-700' }
    }
    if (hostname.includes('miro.com')) {
      return { type: 'Miro', icon: '🖼️', color: 'bg-yellow-100 text-yellow-700' }
    }
    if (hostname.includes('canva.com')) {
      return { type: 'Canva', icon: '🎨', color: 'bg-teal-100 text-teal-700' }
    }

    // Communication
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      return { type: 'Notion', icon: '📓', color: 'bg-gray-100 text-gray-700' }
    }
    if (hostname.includes('slack.com')) {
      return { type: 'Slack', icon: '💬', color: 'bg-purple-100 text-purple-700' }
    }
    if (hostname.includes('zoom.us')) {
      return { type: 'Zoom', icon: '🎥', color: 'bg-blue-100 text-blue-700' }
    }

    // Code/Dev
    if (hostname.includes('github.com')) {
      return { type: 'GitHub', icon: '💻', color: 'bg-gray-100 text-gray-700' }
    }
    if (hostname.includes('gitlab.com')) {
      return { type: 'GitLab', icon: '💻', color: 'bg-orange-100 text-orange-700' }
    }

    // Images
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return { type: 'Image', icon: '🖼️', color: 'bg-pink-100 text-pink-700' }
    }

    // Generic web link
    return { type: 'Link', icon: '🔗', color: 'bg-indigo-100 text-indigo-700' }
  } catch {
    return { type: 'Link', icon: '🔗', color: 'bg-indigo-100 text-indigo-700' }
  }
}
