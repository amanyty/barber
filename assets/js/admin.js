
// VORTEXDB ARCHITECTURE CLIENT (EMBEDDED)
// 1. CONFIGURATION
const SUPABASE_URL = 'https://fmijufsnwuyqshhaissz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tN3wDs4SPin8EjQ7XeF4HQ_jYNRIf9D';

let supabase = null;
let isMockMode = false;

// 2. INITIALIZATION
try {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('VortexDB: Supabase Client Initialized');
    } else {
        console.warn('VortexDB: Supabase SDK not found (window.supabase is undefined). Logic will run in Fallback Mode.');
        isMockMode = true;
    }
} catch (error) {
    console.error('VortexDB: Critical Error initializing Supabase:', error);
    isMockMode = true;
}

// 3. DEFINE APP BACKEND
window.AppBackend = {
    // --- Authentication ---
    async login(email, password) {
        if (!supabase) return { error: { message: 'Backend unavailable (Mock Mode)' } };
        return await supabase.auth.signInWithPassword({ email, password });
    },

    async logout() {
        if (supabase) await supabase.auth.signOut();
        return { error: null };
    },

    async getSession() {
        if (!supabase) return null;
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    // --- Enquiries ---
    async getEnquiries() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data;
    },

    async submitEnquiry(enquiryData) {
        if (!supabase) throw new Error('Backend disconnected');
        const { data, error } = await supabase.from('enquiries').insert([enquiryData]).select();
        if (error) throw error;
        return data;
    },

    // --- Gallery ---
    async getGalleryImages() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('customer_images')
            .select('*')
            .eq('public_visible', true)
            .order('uploaded_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data;
    },

    async uploadImage(file) {
        if (!supabase) throw new Error('Backend disconnected');

        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

        // 1. Upload
        const { error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(fileName, file);
        if (uploadError) throw uploadError;

        // 2. Get URL
        const { data: { publicUrl } } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(fileName);

        // 3. Save to DB
        const { data, error: dbError } = await supabase
            .from('customer_images')
            .insert([{
                image_url: publicUrl,
                caption: file.name,
                image_type: 'portfolio',
                public_visible: true
            }])
            .select();

        if (dbError) throw dbError;
        return data;
    }
};

// --- ADMIN UI LOGIC ---

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- State Management ---
    let currentUser = null;

    // --- Initialization ---
    // DIRECTLY CHECK SESSION (No waiting needed as AppBackend is defined above)
    // Add small delay just to ensure Supabase SDK background init (if any)
    checkSession();

    // --- Event Listeners ---

    // Tab Switching
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all btns
            navBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            // Hide all tabs
            tabContents.forEach(tab => tab.classList.add('hidden'));
            // Show target tab
            const targetId = `tab-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Logging in...';
            btn.disabled = true;

            try {
                const { data, error } = await window.AppBackend.login(email, password);
                if (error) throw error;

                currentUser = data.user;
                showDashboard();
            } catch (err) {
                document.getElementById('login-msg').textContent = 'Login Failed: ' + (err.message || 'Unknown error');
                // For DEMO: Allow bypass if totally broken or specific email
                if (email === 'demo@canvas.com') {
                    showDashboard();
                }
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.AppBackend.logout();
            showLogin();
        });
    }

    // --- Functions ---

    async function checkSession() {
        try {
            const session = await window.AppBackend.getSession();
            if (session) {
                currentUser = session.user;
                showDashboard();
            } else {
                showLogin();
            }
        } catch (e) {
            console.error("Session Check Error", e);
            showLogin();
        }
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadEnquiries(); // Load initial data
        loadGallery();
    }

    function showLogin() {
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    }

    // --- Data Loading ---

    window.refreshEnquiries = loadEnquiries;

    async function loadEnquiries() {
        const tbody = document.getElementById('enquiry-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading...</td></tr>';

        const enquiries = await window.AppBackend.getEnquiries();

        if (!enquiries || enquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No enquiries found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        enquiries.forEach(enq => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(enq.created_at).toLocaleDateString()}</td>
                <td>${enq.customer_name || enq.name || '-'}</td>
                <td>${enq.customer_phone || enq.phone || '-'}</td>
                <td>${enq.service_interested || enq.service || '-'}</td>
                <td>${enq.message || '-'}</td>
                <td><span class="status-badge status-${enq.status}">${enq.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function loadGallery() {
        const grid = document.getElementById('admin-gallery-grid');
        if (!grid) return;

        const images = await window.AppBackend.getGalleryImages();
        grid.innerHTML = '';

        images.forEach(img => {
            const card = document.createElement('div');
            card.className = 'admin-img-card';
            card.innerHTML = `
               <img src="${img.image_url}" alt="${img.caption}">
               <button class="btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
           `;
            grid.appendChild(card);
        });
    }

    // --- Upload Handling ---
    const dropzone = document.getElementById('gallery-upload-dropzone');
    const fileInput = document.getElementById('gallery-file-input');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });

        async function handleFiles(files) {
            if (files.length === 0) return;

            // Show simple loading state
            dropzone.style.opacity = '0.5';
            dropzone.style.pointerEvents = 'none';

            try {
                for (const file of files) {
                    await window.AppBackend.uploadImage(file, 'portfolio');
                }
                loadGallery(); // Refresh grid
            } catch (error) {
                alert('Upload Failed: ' + error.message);
            } finally {
                dropzone.style.opacity = '1';
                dropzone.style.pointerEvents = 'all';
                fileInput.value = ''; // Clear the input
            }
        }
    }

});
