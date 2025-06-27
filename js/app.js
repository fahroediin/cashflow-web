// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM UTAMA & NAVIGASI ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const logsContainer = document.getElementById('logs-container');
    const kategoriContainer = document.getElementById('kategori-container');

    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');
    const logsTbody = document.getElementById('logs-tbody');

    const navLogsButton = document.getElementById('nav-logs');
    const navKategoriButton = document.getElementById('nav-kategori');

    // --- FUNGSI PENGATUR TAMPILAN (VIEW) ---

    function showView(viewName) {
        logsContainer.classList.add('hidden');
        kategoriContainer.classList.add('hidden');
        navLogsButton.classList.remove('active');
        navKategoriButton.classList.remove('active');

        if (viewName === 'logs') {
            logsContainer.classList.remove('hidden');
            navLogsButton.classList.add('active');
            fetchLogs();
        } else if (viewName === 'kategori') {
            kategoriContainer.classList.remove('hidden');
            navKategoriButton.classList.add('active');
            fetchAndRenderKategori(); // Panggil fungsi dari kategori.js
        }
    }

    function showLoginView() {
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }

    function showAppView() {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        showView('logs'); // Halaman default setelah login
    }

    // --- FUNGSI LOGIKA (AUTH & LOGS) ---

    async function fetchLogs() {
        logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const { data, error } = await supabase
            .from('log_aktivitas')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching logs:', error);
            logsTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>';
            return;
        }

        logsTbody.innerHTML = data.length === 0
            ? '<tr><td colspan="4">Belum ada aktivitas.</td></tr>'
            : data.map(log => {
                const timestamp = new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            // Format nomor WA sebelum ditampilkan
            const formattedWaNumber = log.user_wa_number 
                ? log.user_wa_number.replace('@c.us', '') 
                : '-';
                return `
                    <tr>
                        <td data-label="Waktu"><span>${timestamp}</span></td>
                        <td data-label="Nomor WA"><span>${formattedWaNumber}</span></td>
                        <td data-label="Aktivitas"><span>${log.aktivitas}</span></td>
                        <td data-label="Detail"><span>${log.detail || '-'}</span></td>
                    </tr>
                `;
            }).join('');
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        errorMessage.textContent = '';
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            errorMessage.textContent = 'Login Gagal: ' + error.message;
        } else {
            showAppView();
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        showLoginView();
    }

    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            showAppView();
        } else {
            showLoginView();
        }
    }

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    navLogsButton.addEventListener('click', () => showView('logs'));
    navKategoriButton.addEventListener('click', () => showView('kategori'));

    // --- INISIALISASI APLIKASI ---
    checkSession();
});