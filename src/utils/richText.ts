/**
 * Utilities for Rich Text handling in Announcements
 */

/**
 * Strips HTML tags from text for short snippet/preview rendering in cards
 */
export function stripHtml(htmlOrText: string = ''): string {
  if (!htmlOrText) return '';
  // Replace br and block ends with spaces
  const textWithSpaces = htmlOrText
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  return textWithSpaces
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a string contains HTML formatting tags
 */
export function isHtmlContent(content: string = ''): boolean {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Converts legacy plain text with newlines to clean HTML paragraphs
 */
export function formatLegacyTextToHtml(text: string = ''): string {
  if (!text) return '';
  if (isHtmlContent(text)) return text;

  // Convert plain text newlines to paragraphs / br
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}
