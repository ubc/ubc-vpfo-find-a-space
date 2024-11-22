import '@koga73/overlay/js/overlay.js';

export default function instantiateLightbox() {
  if ( window.Overlay ) {
    window.Overlay.init();
  }
}
