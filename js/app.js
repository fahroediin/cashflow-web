// js/app.js (Versi Final yang Bersih dan Terpusat)
document.addEventListener('DOMContentLoaded', () => {
    // Variabel global state aplikasi
    let state = {
        isAdmin: false,
        chatbotProfile: null,
    };

    // --- ELEMEN DOM ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const navKategoriButton = document.getElementById('nav-kategori');
    const navPenggunaButton = document.getElementById('nav-pengguna');
    const allPageContainers = document.querySelectorAll('main > div[id$="-container"]');
    const allNavButtons = document.querySelectorAll('header nav button');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const logUserFilter = document.getElementById('log-user-filter');

    // --- FUNGSI UTAMA ---
    async function setupUIForUserRole() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        state.isAdmin = session.user.app_metadata.user_role === 'admin';
        if (state.isAdmin) {
            navKategoriButton.style.display = 'inline-flex';
            navPenggunaButton.style.display = 'inline-flex';
        } else {
            navKategoriButton.style.display = 'none';
            navPenggunaButton.style.display = 'none';
            const { data: profile } = await supabase.from('users').select('*').eq('auth_user_id', session.user.id).single();
            state.chatbotProfile = profile;
        }
    }

    async function showView(viewName) {
        allPageContainers.forEach(c => c.classList.add('hidden'));
        allNavButtons.forEach(b => b.classList.remove('active'));
        const container = document.getElementById(`${viewName}-container`);
        const button = document.getElementById(`nav-${viewName}`);
        if (container) container.classList.remove('hidden');
        if (button) button.classList.add('active');

        // Panggil fungsi inisialisasi halaman yang sesuai dengan membawa informasi state
        if (viewName === 'dashboard') window.initializeDashboard(state.isAdmin, state.chatbotProfile);
        else if (viewName === 'transaksi') window.initializeTransaksiPage(state.isAdmin, state.chatbotProfile);
        else if (viewName === 'logs') initializeLogsPage(state.isAdmin, state.chatbotProfile);
        else if (viewName === 'kategori' && state.isAdmin) fetchAndRenderKategori();
        else if (viewName === 'pengguna' && state.isAdmin) window.initializePenggunaPage();
    }

    async function showAppView() {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        await setupUIForUserRole();
        showView('dashboard'); 
    }
    
    // --- Logika Halaman Log (Dikelola di App.js) ---
    async function initializeLogsPage(isAdmin, chatbotProfile) {
        const logUserFilterContainer = document.querySelector('#logs-container .dashboard-filters');
        if (isAdmin) {
            logUserFilterContainer.style.display = 'flex';
            await populateLogUserFilter();
        } else {
            logUserFilterContainer.style.display = 'none';
        }
        fetchLogs(isAdmin, chatbotProfile);
    }
    async function populateLogUserFilter() {
        if (logUserFilter.options.length > 1) {
            logUserFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
            return;
        }
        const { data } = await supabase.from('users').select('id, nama').order('nama');
        logUserFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nama;
            logUserFilter.appendChild(option);
        });
        logUserFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
    }
    async function fetchLogs(isAdmin, chatbotProfile) {
        const logsTbody = document.getElementById('logs-tbody');
        logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        let query = supabase.from('log_aktivitas').select('*').order('timestamp', { ascending: false }).limit(100);

        if (isAdmin) {
            const selectedUserId = logUserFilter.value;
            if (selectedUserId && selectedUserId !== 'semua') query = query.eq('id_user', selectedUserId);
        } else {
            if (chatbotProfile) { query = query.eq('id_user', chatbotProfile.id); } 
            else { logsTbody.innerHTML = '<tr><td colspan="4">Tidak ada data untuk ditampilkan.</td></tr>'; return; }
        }
        
        const { data, error } = await query;
        if (error) { console.error('Error fetching logs:', error); logsTbody.innerHTML = '<tr><td colspan="4">Gagal memuat data.</td></tr>'; return; }
        
        logsTbody.innerHTML = data.length === 0 ? '<tr><td colspan="4">Belum ada aktivitas.</td></tr>' : data.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            const formattedWaNumber = log.user_wa_number ? log.user_wa_number.replace('@c.us', '') : '-';
            return `<tr><td data-label="Waktu"><span>${timestamp}</span></td><td data-label="Nomor WA"><span>${formattedWaNumber}</span></td><td data-label="Aktivitas"><span>${log.aktivitas}</span></td><td data-label="Detail"><span>${log.detail || '-'}</span></td></tr>`;
        }).join('');
    }
    logUserFilter.addEventListener('change', () => fetchLogs(state.isAdmin, state.chatbotProfile));

    // --- OTENTIKASI ---
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        errorMessage.textContent = '';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { errorMessage.textContent = 'Login Gagal: ' + error.message; }
    }
    async function handleLogout() {
        state.isAdmin = false;
        state.chatbotProfile = null;
        await supabase.auth.signOut();
    }
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) { showAppView(); } 
        else { loginContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
    });

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    allNavButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = e.target.id.replace('nav-', '');
            showView(viewName);
        });
    });
});