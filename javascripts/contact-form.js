document.addEventListener('DOMContentLoaded', () => {
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/contact'
    : 'https://nyaoha.onrender.com/api/contact';

  const form = document.querySelector('.contact-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent actual form submission

    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const message = document.getElementById('message')?.value;

    try {
      const response = await axios.post(API_URL, {
        name,
        email,
        phone,
        message
      });

      console.log('Message sent:', response.data);
      alert('Message sent successfully!');
      form.reset(); // clear the form
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  });
});
