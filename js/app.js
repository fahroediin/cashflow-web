// js/app.js (Versi Perbaikan)

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
                return `
                    <tr>
                        <td data-label="Waktu"><span>${timestamp}</span></td>
                        <td data-label="Nomor WA"><span>${log.user_wa_number || '-'}</span></td>
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
        
        // Panggil signInWithPassword, tapi jangan lakukan apa-apa di 'else'
        // Biarkan onAuthStateChange yang menangani UI
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            errorMessage.textContent = 'Login Gagal: ' + error.message;
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        // UI akan otomatis diperbarui oleh onAuthStateChange
    }

    // --- PERUBAHAN UTAMA: GUNAKAN onAuthStateChange ---
    // Listener ini akan menangani semua perubahan status login/logout secara otomatis
    // dan juga menggantikan fungsi checkSession()
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, 'Session:', session); // Baris ini bagus untuk debugging
        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
            // Jika user login atau sudah punya sesi saat halaman dimuat
            showAppView();
        } else if (event === 'SIGNED_OUT') {
            // Jika user logout
            showLoginView();
        }
    });

    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    navLogsButton.addEventListener('click', () => showView('logs'));
    navKategoriButton.addEventListener('click', () => showView('kategori'));

    // --- INISIALISASI APLIKASI ---
    // checkSession(); // <<< FUNGSI INI TIDAK DIPERLUKAN LAGI, sudah digantikan onAuthStateChange
});