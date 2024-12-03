import ClipboardJS from 'clipboard';

export default function instantiateClipboard() {
  new ClipboardJS('.clippy');
}
