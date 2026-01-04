// assets/js/supabase-client.js
// VORTEXDB ARCHITECTURE CLIENT

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

// 3. DEFINE APP BACKEND (Globally Accessible)
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
        // Removed .select() to avoid RLS "Policy violates row security" for anon inserts
        const { error } = await supabase.from('enquiries').insert([enquiryData]);
        if (error) throw error;
        return { success: true };
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

console.log('VortexDB: AppBackend assigned globally.');
