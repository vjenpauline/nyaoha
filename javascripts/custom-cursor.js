const cursor = document.querySelector('.custom-cursor');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  const speed = 0.2;
  cursorX += (mouseX - cursorX) * speed;
  cursorY += (mouseY - cursorY) * speed;

  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

  requestAnimationFrame(animateCursor);
}
animateCursor();

const interactiveElements = 'a, button, input, textarea, select, [contenteditable]';

document.querySelectorAll(interactiveElements).forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '20px';
    cursor.style.height = '20px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '10px';
    cursor.style.height = '10px';
  });
});
