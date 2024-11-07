import Accordion from 'accordion-js';

export default function instantiateAccordions() {
  const accordions = Array.from( document.querySelectorAll( '.accordion' ) );
  if ( accordions.length ) {
    new Accordion(
      accordions,
      {
        duration: 250,
        openOnInit: [0],
      }
    );
  }
}
