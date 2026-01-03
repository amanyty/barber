document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Navigation Toggle ---
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Animate hamburger to X (optional simple CSS class toggle or manual animation)
            navToggle.classList.toggle('open'); 
        });

        // Close menu when a link is clicked
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                navToggle.classList.remove('open');
            });
        });
    }

    // --- Dynamic Year for Footer ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Form Handling (Mock) ---
    const enquiryForm = document.getElementById('enquiryForm');
    const formMessage = document.getElementById('formMessage');

    if (enquiryForm) {
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Basic Validation Check
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            
            if (name.trim() === '' || phone.trim() === '') {
                formMessage.style.color = 'red';
                formMessage.textContent = 'Please fill in all required fields.';
                return;
            }

            // Simulate sending
            const btn = enquiryForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = 'Message Sent!';
                btn.style.backgroundColor = '#28a745';
                formMessage.style.color = '#28a745';
                formMessage.textContent = 'Thank you! We will contact you shortly.';
                enquiryForm.reset();

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = ''; // Reset to default
                    formMessage.textContent = '';
                }, 3000);
            }, 1500);
        });
    }

    // --- Smooth Scroll for older browsers (optional polyfill, but CSS scroll-behavior usually covers modern) ---
    // This is just a backup or for more control if needed. 
    // CSS scroll-behavior: smooth is already applied in styles.css

});
