import tippy from 'tippy.js';

export default function instantiateGlossaryTooltips() {
  const glossaryData = {};

  if (!window.vpfo_glossary_terms) {
    return;
  }

  // Create a dictionary of glossary terms and definitions
  for (const airtable_row of window.vpfo_glossary_terms.records) {
    glossaryData[airtable_row.fields.Term] = airtable_row.fields.Definition;
  }

  const infoIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"></path></svg>`;

  // Function to process text nodes recursively
  function processTextNodes(element) {
    const childNodes = Array.from(element.childNodes);

    childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent;

        // Check for glossary terms in the text content
        Object.keys(glossaryData).forEach((term) => {
          if (textContent.includes(term)) {
            // Split the text node around the term
            const termIndex = textContent.indexOf(term);
            const beforeText = textContent.slice(0, termIndex);
            
            // Create a new span element for the term
            const termSpan = document.createElement('span');
            termSpan.textContent = term;
            termSpan.classList.add('glossary-term');
            
            // Create an info indicator with SVG
            const infoIndicator = document.createElement('span');
            infoIndicator.innerHTML = infoIconHtml;
            infoIndicator.classList.add('glossary-info');
            
            // Add accessibility attributes for screen readers
            infoIndicator.setAttribute('role', 'button'); // Treat as an interactive element
            infoIndicator.setAttribute('aria-label', `Definition of ${term}`); // Announces intent
            infoIndicator.setAttribute('tabindex', '0'); // Makes it focusable
            infoIndicator.setAttribute('aria-expanded', 'false'); // State of tooltip
            
            // Add a tooltip to the info indicator with Tippy.js
            tippy(infoIndicator, {
              content: glossaryData[term],
              theme: 'light',
              interactive: true, // Tooltip remains interactive
              trigger: 'mouseenter focus', // Triggers on hover and focus
              onShow(instance) {
                infoIndicator.setAttribute('aria-expanded', 'true'); // Update state for screen readers
              },
              onHide(instance) {
                infoIndicator.setAttribute('aria-expanded', 'false'); // Revert state
              },
            });
            
            // Replace the text node with a new structure
            const fragment = document.createDocumentFragment();
            if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
            fragment.appendChild(termSpan);
            fragment.appendChild(infoIndicator);
            
            node.parentNode.replaceChild(fragment, node);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recursively process child elements
        processTextNodes(node);
      }
    });
  }

  // Select all `.classroom-details` elements and process their text content
  const classroomDetails = document.querySelectorAll('.classroom-details');
  classroomDetails.forEach((element) => processTextNodes(element));
}
