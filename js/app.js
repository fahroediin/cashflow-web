// js/app.js (Versi dengan Filter Log Default)

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const logsContainer = document.getElementById('logs-container');
    const kategoriContainer = document.getElementById('kategori-container');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const logsTbody = document.getElementById('logs-tbody');
    const navDashboardButton = document.getElementById('nav-dashboard');
    const navLogsButton = document.getElementById('nav-logs');
    const navKategoriButton = document.getElementById('nav-kategori');
    const logUserFilter = document.getElementById('log-user-filter');

    // --- FUNGSI PENGATUR TAMPILAN (VIEW) ---
    async function showView(viewName) { // Jadikan async untuk await
        dashboardContainer.classList.add('hidden');
        logsContainer.classList.add('hidden');
        kategoriContainer.classList.add('hidden');
        navDashboardButton.classList.remove('active');
        navLogsButton.classList.remove('active');
        navKategoriButton.classList.remove('active');

        if (viewName === 'dashboard') {
            dashboardContainer.classList.remove('hidden');
            navDashboardButton.classList.add('active');
            window.initializeDashboard();
        } else if (viewName === 'logs') {
            logsContainer.classList.remove('hidden');
            navLogsButton.classList.add('active');
            // PERUBAHAN DI SINI: Gunakan await untuk memastikan filter siap sebelum fetch
            await populateAndSetLogUserFilter(); 
            fetchLogs();
        } else if (viewName === 'kategori') {
            kategoriContainer.classList.remove('hidden');
            navKategoriButton.classList.add('active');
            fetchAndRenderKategori();
        }
    }
    function showLoginView() { loginContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
    function showAppView() { loginContainer.classList.add('hidden'); appContainer.classList.remove('hidden'); showView('dashboard'); }

    // --- FUNGSI LOGIKA LAINNYA ---
    
    // PERUBAHAN DI SINI: Ganti nama fungsi dan tambahkan logika set default
    async function populateAndSetLogUserFilter() {
        if (logUserFilter.options.length > 1) return; // Jangan isi ulang jika sudah ada
        
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) { 
            console.error('Gagal mengambil data user untuk log:', error); 
            return; 
        }
        
        logUserFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nama;
            logUserFilter.appendChild(option);
        });

        // Set nilai default untuk filter log
        logUserFilter.value = "006d7ce0-335d-41d1-a0e8-7dc93ee58eaa";
    }

    async function fetchLogs() {
        logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const selectedUserId = logUserFilter.value; // Ini sekarang akan memiliki nilai default saat pertama kali dijalankan
        
        let query = supabase.from('log_aktivitas').select('*').order('timestamp', { ascending: false }).limit(100);
        
        // Filter berdasarkan UUID user, KECUALI jika "Semua User" yang dipilih
        if (selectedUserId && selectedUserId !== 'semua') {
            query = query.eq('id_user', selectedUserId);
        }
        
        const { data, error } = await query;
        if (error) { console.error('Error fetching logs:', error); logsTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; return; }
        logsTbody.innerHTML = data.length === 0 ? '<tr><td colspan="4">Belum ada aktivitas.</td></tr>' : data.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            const formattedWaNumber = log.user_wa_number ? log.user_wa_number.replace('@c.us', '') : '-';
            return `<tr><td data-label="Waktu"><span>${timestamp}</span></td><td data-label="Nomor WA"><span>${formattedWaNumber}</span></td><td data-label="Aktivitas"><span>${log.aktivitas}</span></td><td data-label="Detail"><span>${log.detail || '-'}</span></td></tr>`;
        }).join('');
    }

    // --- FUNGSI OTENTIKASI (PENTING) ---
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        errorMessage.textContent = '';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { errorMessage.textContent = 'Login Gagal: ' + error.message; }
    }
    async function handleLogout() {
        await supabase.auth.signOut();
    }

    // --- LISTENER OTENTIKASI (SANGAT PENTING) ---
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            showAppView();
        } else {
            showLoginView();
        }
    });

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    navDashboardButton.addEventListener('click', () => showView('dashboard'));
    navLogsButton.addEventListener('click', () => showView('logs'));
    navKategoriButton.addEventListener('click', () => showView('kategori'));
    logUserFilter.addEventListener('change', fetchLogs);
});