document.addEventListener('DOMContentLoaded', () => {
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/contact'
    : 'https://nyaoha.onrender.com/api/contact';

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const message = document.getElementById('message').value;

  axios.post(API_URL, {
    name,
    email,
    phone,
    message
  })
  .then(response => {
    console.log('Message sent:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
});
