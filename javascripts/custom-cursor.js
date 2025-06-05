// custom cursor element
const cursor = document.querySelector('.custom-cursor');

// track mouse and cursor positions
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

// update mouse position on mousemove
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// animate cursor to follow mouse
function animateCursor() {
  const speed = 0.2;
  cursorX += (mouseX - cursorX) * speed;
  cursorY += (mouseY - cursorY) * speed;

  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

  requestAnimationFrame(animateCursor);
}
animateCursor();

// select interactive elements
const interactiveElements = 'a, button, input, textarea, select, [contenteditable]';

// shrink cursor on hover, reset on leave
document.querySelectorAll(interactiveElements).forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '8px';
    cursor.style.height = '8px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '20px';
    cursor.style.height = '20px';
  });
});
