// js/app.js (Versi Perbaikan Filter Default)
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

    const logsPagination = document.getElementById('logs-pagination');
    const logsPrevButton = logsPagination.querySelector('.btn-prev');
    const logsNextButton = logsPagination.querySelector('.btn-next');
    const logsPageInfo = logsPagination.querySelector('.page-info');
    let logsCurrentPage = 1;
    const rowsPerPage = 10;

    async function showView(viewName) {
        [dashboardContainer, transaksiContainer, logsContainer, kategoriContainer, penggunaContainer].forEach(c => c.classList.add('hidden'));
        [navDashboardButton, navTransaksiButton, navLogsButton, navKategoriButton, navPenggunaButton].forEach(b => b.classList.remove('active'));

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
            fetchLogs(1);
        } else if (viewName === 'kategori') {
            kategoriContainer.classList.remove('hidden');
            navKategoriButton.classList.add('active');
            window.initializeKategoriPage(); 
        } else if (viewName === 'pengguna') {
            penggunaContainer.classList.remove('hidden');
            navPenggunaButton.classList.add('active');
            window.initializePenggunaPage();
        }
    }

    function showLoginView() { loginContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
    function showAppView() { loginContainer.classList.add('hidden'); appContainer.classList.remove('hidden'); showView('dashboard'); }
    
    async function populateAndSetLogUserFilter() {
        // PERBAIKAN: Cek apakah filter sudah terisi
        if (logUserFilter.options.length <= 1) {
            const { data, error } = await supabase.from('users').select('id, nama').order('nama');
            if (error) { console.error('Gagal mengambil data user untuk log:', error); return; }
            logUserFilter.innerHTML = '<option value="semua">Semua User</option>';
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.nama;
                logUserFilter.appendChild(option);
            });
        }
        // PERBAIKAN: Logika untuk set nilai default
        const defaultUserId = localStorage.getItem('defaultUserId') || 'semua';
        logUserFilter.value = defaultUserId;
    }

    async function fetchLogs(page = 1) {
        logsCurrentPage = page;
        logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const selectedUserId = logUserFilter.value;
        let query = supabase.from('log_aktivitas')
            .select('*', { count: 'exact' })
            .order('timestamp', { ascending: false })
            .range(from, to);

        if (selectedUserId && selectedUserId !== 'semua') {
            query = query.eq('id_user', selectedUserId);
        }

        const { data, error, count } = await query;

        if (error) { 
            console.error('Error fetching logs:', error); 
            logsTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; 
            logsPagination.classList.add('hidden');
            return; 
        }

        logsTbody.innerHTML = data.length === 0 ? '<tr><td colspan="4">Belum ada aktivitas.</td></tr>' : data.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            const formattedWaNumber = log.user_wa_number ? log.user_wa_number.replace('@c.us', '') : '-';
            return `<tr><td data-label="Waktu"><span>${timestamp}</span></td><td data-label="Nomor WA"><span>${formattedWaNumber}</span></td><td data-label="Aktivitas"><span>${log.aktivitas}</span></td><td data-label="Detail"><span>${log.detail || '-'}</span></td></tr>`;
        }).join('');

        updateLogsPagination(count);
    }

    function updateLogsPagination(totalRows) {
        if (!totalRows || totalRows <= rowsPerPage) {
            logsPagination.classList.add('hidden');
            return;
        }
        logsPagination.classList.remove('hidden');
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        logsPageInfo.textContent = `Halaman ${logsCurrentPage} dari ${totalPages}`;
        logsPrevButton.disabled = logsCurrentPage === 1;
        logsNextButton.disabled = logsCurrentPage >= totalPages;
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
    
    logUserFilter.addEventListener('change', () => fetchLogs(1));
    logsPrevButton.addEventListener('click', () => {
        if (logsCurrentPage > 1) fetchLogs(logsCurrentPage - 1);
    });
    logsNextButton.addEventListener('click', () => {
        fetchLogs(logsCurrentPage + 1);
    });
});