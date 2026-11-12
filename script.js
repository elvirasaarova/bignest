const menuButton = document.querySelector('#menuButton');
const mobileNav = document.querySelector('#mobileNav');
menuButton.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}));
document.querySelector('#year').textContent = String(new Date().getFullYear());


const thumbnailStripSelector = '.thumbs, .ruler-thumbs';
const galleryImageSelector = '.product-photo:has(+ .thumbs), .ruler-hero, .img-modal img';
let modalGallery = null;
let photoGesture = null;
let suppressPhotoClick = false;

function galleryFor(surface) {
  if (surface.closest('.img-modal')) return modalGallery;

  const strip = surface.matches('.ruler-hero')
    ? surface.closest('.ruler-model')?.querySelector('.ruler-thumbs')
    : surface.nextElementSibling;
  const image = surface.querySelector('img');
  return strip?.matches(thumbnailStripSelector) && image ? { strip, image } : null;
}

document.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  suppressPhotoClick = false;
  photoGesture = null;

  const strip = event.target.closest(thumbnailStripSelector);
  const surface = event.target.closest(galleryImageSelector);
  const scrollStrip = event.pointerType === 'mouse' && strip?.scrollWidth > strip?.clientWidth;
  const gallery = surface && galleryFor(surface);
  if (!scrollStrip && !gallery) return;

  photoGesture = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    gallery,
    strip: scrollStrip ? strip : null,
    scrollLeft: scrollStrip ? strip.scrollLeft : 0,
    dragged: false,
    modalImage: surface?.closest('.img-modal') ? surface : null,
  };
});

document.addEventListener('pointermove', event => {
  const gesture = photoGesture;
  if (gesture?.pointerId !== event.pointerId || !gesture.strip) return;

  const distance = event.clientX - gesture.x;
  if (Math.abs(distance) < 8 && !gesture.dragged) return;

  gesture.dragged = true;
  gesture.strip.scrollLeft = gesture.scrollLeft - distance;
});

document.addEventListener('pointercancel', event => {
  if (photoGesture?.pointerId === event.pointerId) photoGesture = null;
});

document.addEventListener('dragstart', event => {
  if (photoGesture) event.preventDefault();
});

document.addEventListener('pointerup', event => {
  const gesture = photoGesture;
  if (gesture?.pointerId !== event.pointerId) return;
  photoGesture = null;

  if (gesture.strip) {
    suppressPhotoClick = gesture.dragged;
    return;
  }

  const horizontal = event.clientX - gesture.x;
  const vertical = event.clientY - gesture.y;
  if (Math.abs(horizontal) < 40 || Math.abs(horizontal) <= Math.abs(vertical)) return;

  suppressPhotoClick = true;
  const { strip, image } = gesture.gallery;
  const buttons = Array.from(strip.querySelectorAll('button[aria-pressed]'))
    .filter(button => !button.hidden && !button.disabled);
  if (buttons.length < 2) return;

  const active = buttons.findIndex(button => button.getAttribute('aria-pressed') === 'true');
  const direction = horizontal < 0 ? 1 : -1;
  const next = active < 0 ? 0 : (active + direction + buttons.length) % buttons.length;
  buttons[next].click();
  buttons[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });

  if (gesture.modalImage) {
    gesture.modalImage.src = image.src;
    gesture.modalImage.alt = image.alt;
  }
});

document.addEventListener('click', event => {
  if (suppressPhotoClick && event.detail > 0) {
    suppressPhotoClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  const surface = event.target.closest('.product-photo');
  if (surface) modalGallery = galleryFor(surface);
}, true);
