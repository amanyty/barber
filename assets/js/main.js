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

    // --- Dynamic Gallery Loading ---
    // --- Dynamic Gallery Loading ---
    // loadHomeGallery(); // Disabled to prioritize static real images until DB is populated

    // --- Form Handling (Connected to Supabase) ---
    const enquiryForm = document.getElementById('enquiryForm');
    const formMessage = document.getElementById('formMessage');

    if (enquiryForm) {
        enquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Get Values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;

            if (name.trim() === '' || phone.trim() === '') {
                formMessage.style.color = '#dc3545';
                formMessage.textContent = 'Please fill in all required fields.';
                return;
            }

            // 2. UI Loading State
            const btn = enquiryForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                // 3. Submit to Backend (Supabase or Mock)
                // Maps to 'enquiries' table columns
                const enquiryData = {
                    customer_name: name,
                    customer_phone: phone,
                    service_interested: service,
                    message: message,
                    customer_email: email
                };

                // Check if SupabaseClient is loaded
                if (typeof window.AppBackend !== 'undefined') {
                    await window.AppBackend.submitEnquiry(enquiryData);

                    // Success UI
                    btn.textContent = 'Message Sent!';
                    btn.style.backgroundColor = '#28a745';
                    formMessage.style.color = '#28a745';
                    formMessage.textContent = 'Thank you! We have received your enquiry.';
                    enquiryForm.reset();

                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                        btn.style.backgroundColor = '';
                        formMessage.textContent = '';
                    }, 3000);

                } else {
                    throw new Error('Backend client not loaded');
                }

            } catch (error) {
                console.error('Enquiry Error:', error);
                formMessage.style.color = '#dc3545';
                formMessage.textContent = 'Something went wrong. Please try again.';
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- Smooth Scroll for older browsers (optional polyfill, but CSS scroll-behavior usually covers modern) ---
    // This is just a backup or for more control if needed. 
    // CSS scroll-behavior: smooth is already applied in styles.css

    // --- Helper Functions ---

    async function loadHomeGallery() {
        const galleryGrid = document.querySelector('.gallery__grid');
        if (!galleryGrid) return;

        // If window.AppBackend is available, fetch real images
        if (typeof window.AppBackend !== 'undefined') {
            try {
                const images = await window.AppBackend.getGalleryImages();

                if (images && images.length > 0) {
                    galleryGrid.innerHTML = ''; // Clear static images

                    // Take top 6 images
                    images.slice(0, 6).forEach(img => {
                        const div = document.createElement('div');
                        div.className = 'gallery__item';
                        div.innerHTML = `<img src="${img.image_url}" alt="${img.caption || 'Gallery Image'}" loading="lazy">`;
                        galleryGrid.appendChild(div);
                    });
                }
            } catch (err) {
                console.warn('Could not load dynamic gallery, keeping static fallbacks.', err);
            }
        }
    }

});
