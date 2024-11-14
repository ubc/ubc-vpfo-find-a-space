import Glider from 'glider-js';

export default function instantiateSlider() {
  const gliderElement           = document.querySelector( '.classroom-image-gallery .glider' ) as null|HTMLElement;
  const gliderThumbnailsElement = document.querySelector( '.classroom-image-gallery .glider-thumbnails' ) as null|HTMLElement;

  // Check if the glider element exists
  if ( ! gliderElement || ! gliderThumbnailsElement ) {
    return; // Exit if the element is not found
  }

  const glider = new Glider(
    gliderElement,
    {
      slidesToShow: 1,
      slidesToScroll: 1,
      draggable: false,
      dots: document.querySelector( '.glider-dots' ),
      rewind: true,
      arrows: {
        prev: document.querySelector( '.glider-prev' ),
        next: document.querySelector( '.glider-next' )
      },
      responsive: [{
        breakpoint: 768,
        settings: {
          dots: false,
        }
      }]
    }
  );

  // Show the glider after initialization
  gliderElement.style.opacity           = '1';
  gliderElement.style.height            = 'auto';
  gliderThumbnailsElement.style.opacity = '1';
  gliderThumbnailsElement.style.height  = 'auto';

  const thumbnails = document.querySelectorAll( '.classroom-image-gallery .glider-thumbnails .glider-thumbnail img' );

  // Function to update the active class on thumbnails
  function updateActiveThumbnail(index) {
    thumbnails.forEach(
      (thumb, i) =>
      {
        thumb.parentElement.classList.toggle(
          'active',
          i === index
        );
      }
    );
  }

  // Set initial active thumbnail
  updateActiveThumbnail( 0 );

  // Update active thumbnail on slide change
  thumbnails.forEach(
    (thumb, index) =>
    {
      thumb.addEventListener(
        'click',
        () =>
        {
          glider.scrollItem( index ); // Scroll to the slide on thumbnail click
          updateActiveThumbnail( index ); // Update active class on click
        }
      );
    }
  );

  // Listen for slide changes
  glider.ele.addEventListener(
    'glider-slide-visible',
    function (event) {
      updateActiveThumbnail( event.detail.slide ); // Update active class when the slide changes
    }
  );
}