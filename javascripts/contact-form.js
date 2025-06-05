// wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // set API URL based on environment
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/contact'
    : 'https://nyaoha.onrender.com/api/contact';

  // get the contact form
  const form = document.querySelector('.contact-form');

  // if form exists, handle submit event
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      //   get form values
      const name = document.getElementById('name')?.value;
      const email = document.getElementById('email')?.value;
      const phone = document.getElementById('phone')?.value;
      const message = document.getElementById('message')?.value;

      //   try to send message via API
      try {
        const response = await axios.post(API_URL, {
          name,
          email,
          phone,
          message
        });

        //   show success or error alert
        console.log('Message sent:', response.data);
        alert('Message sent successfully!');
        form.reset();
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    });
  }
});
