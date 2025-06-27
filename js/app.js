// js/app.js (Versi dengan Semua Halaman Terintegrasi)
document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const transaksiContainer = document.getElementById('transaksi-container');
    const logsContainer = document.getElementById('logs-container');
    const kategoriContainer = document.getElementById('kategori-container');
    const penggunaContainer = document.getElementById('pengguna-container');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const logsTbody = document.getElementById('logs-tbody');
    const navDashboardButton = document.getElementById('nav-dashboard');
    const navTransaksiButton = document.getElementById('nav-transaksi');
    const navLogsButton = document.getElementById('nav-logs');
    const navKategoriButton = document.getElementById('nav-kategori');
    const navPenggunaButton = document.getElementById('nav-pengguna');
    const logUserFilter = document.getElementById('log-user-filter');

    async function showView(viewName) {
        dashboardContainer.classList.add('hidden');
        transaksiContainer.classList.add('hidden');
        logsContainer.classList.add('hidden');
        kategoriContainer.classList.add('hidden');
        penggunaContainer.classList.add('hidden');
        navDashboardButton.classList.remove('active');
        navTransaksiButton.classList.remove('active');
        navLogsButton.classList.remove('active');
        navKategoriButton.classList.remove('active');
        navPenggunaButton.classList.remove('active');

        if (viewName === 'dashboard') {
            dashboardContainer.classList.remove('hidden');
            navDashboardButton.classList.add('active');
            window.initializeDashboard();
        } else if (viewName === 'transaksi') {
            transaksiContainer.classList.remove('hidden');
            navTransaksiButton.classList.add('active');
            window.initializeTransaksiPage();
        } else if (viewName === 'logs') {
            logsContainer.classList.remove('hidden');
            navLogsButton.classList.add('active');
            await populateAndSetLogUserFilter();
            fetchLogs();
        } else if (viewName === 'kategori') {
            kategoriContainer.classList.remove('hidden');
            navKategoriButton.classList.add('active');
            fetchAndRenderKategori(); 
        } else if (viewName === 'pengguna') {
            penggunaContainer.classList.remove('hidden');
            navPenggunaButton.classList.add('active');
            window.initializePenggunaPage();
        }
    }

    function showLoginView() { loginContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
    function showAppView() { loginContainer.classList.add('hidden'); appContainer.classList.remove('hidden'); showView('dashboard'); }
    
    async function populateAndSetLogUserFilter() {
        if (logUserFilter.options.length > 1) {
            const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
            logUserFilter.value = defaultUserId;
            return;
        }
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) { console.error('Gagal mengambil data user untuk log:', error); return; }
        logUserFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nama;
            logUserFilter.appendChild(option);
        });
        const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
        logUserFilter.value = defaultUserId;
    }

    async function fetchLogs() {
        logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const selectedUserId = logUserFilter.value;
        let query = supabase.from('log_aktivitas').select('*').order('timestamp', { ascending: false }).limit(100);
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

    supabase.auth.onAuthStateChange((event, session) => {
        if (session) { showAppView(); } else { showLoginView(); }
    });

    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    navDashboardButton.addEventListener('click', () => showView('dashboard'));
    navTransaksiButton.addEventListener('click', () => showView('transaksi'));
    navLogsButton.addEventListener('click', () => showView('logs'));
    navKategoriButton.addEventListener('click', () => showView('kategori'));
    navPenggunaButton.addEventListener('click', () => showView('pengguna'));
    logUserFilter.addEventListener('change', fetchLogs);
});