export interface ShareResult {
  shared: boolean;
  copied: boolean;
}

/**
 * Shares a note's title and content using the native Web Share API (Android/iOS/PC),
 * with a fallback to copying to clipboard if Web Share is not supported.
 */
export const shareNote = async (title: string, content: string): Promise<ShareResult> => {
  const cleanTitle = (title || '').trim();
  const cleanContent = (content || '').trim();

  if (!cleanTitle && !cleanContent) {
    return { shared: false, copied: false };
  }

  const shareTitle = cleanTitle || 'Заметка';
  const shareText = cleanTitle && cleanContent
    ? `${cleanTitle}\n\n${cleanContent}`
    : cleanTitle || cleanContent;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      // AbortError indicates user dismissed/cancelled the share sheet
      if (err?.name === 'AbortError') {
        return { shared: false, copied: false };
      }
      console.warn('Web Share failed, falling back to clipboard:', err);
    }
  }

  // Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareText);
      return { shared: false, copied: true };
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  }

  return { shared: false, copied: false };
};
