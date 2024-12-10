import ClipboardJS from 'clipboard';
import tippy from 'tippy.js';

export default function instantiateClipboard() {
  if ( ClipboardJS.isSupported() ) {
    new ClipboardJS('.clippy');
  
    tippy('.clippy', {
      content: 'Copied to clipboard',
      trigger: 'click',
      theme: 'light',
    });
  }
}
