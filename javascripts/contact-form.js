document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.querySelector('.contact-form');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: contactForm.querySelector('input[placeholder="Name"]').value,
            email: contactForm.querySelector('input[placeholder="Email"]').value,
            phone: contactForm.querySelector('input[placeholder="Phone"]').value,
            message: contactForm.querySelector('textarea[placeholder="Message"]').value,
        };

        try {
            const response = await axios.post('https://nyaoha/api/contact', formData);
            alert('Message sent successfully!');
            contactForm.reset();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to send message. Please try again later.');
        }
    });
});