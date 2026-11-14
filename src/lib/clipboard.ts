/**
 * Copy rich HTML so it pastes into Outlook with formatting intact.
 *
 * Preferred path: the async Clipboard API with both text/html and text/plain.
 * Fallback (insecure contexts, older browsers, denied permission): select an
 * off-screen element holding the HTML and run `document.execCommand('copy')`.
 */

export type CopyMethod = 'clipboard-item' | 'exec-command';

export async function copyRichHtml(html: string, text: string): Promise<CopyMethod> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window !== 'undefined' &&
    typeof window.ClipboardItem === 'function'
  ) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return 'clipboard-item';
    } catch {
      // Fall through to the selection-based copy.
    }
  }

  if (copyWithExecCommand(html)) return 'exec-command';
  throw new Error('Copy to clipboard is not available in this browser.');
}

function copyWithExecCommand(html: string): boolean {
  if (typeof document === 'undefined') return false;

  const container = document.createElement('div');
  container.setAttribute('contenteditable', 'true');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
  container.innerHTML = html;
  document.body.appendChild(container);

  const selection = window.getSelection();
  const previousRanges: Range[] = [];
  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      previousRanges.push(selection.getRangeAt(index));
    }
  }

  let isCopied = false;
  try {
    const range = document.createRange();
    range.selectNodeContents(container);
    selection?.removeAllRanges();
    selection?.addRange(range);
    isCopied = document.execCommand('copy');
  } catch {
    isCopied = false;
  } finally {
    selection?.removeAllRanges();
    for (const range of previousRanges) selection?.addRange(range);
    document.body.removeChild(container);
  }
  return isCopied;
}
