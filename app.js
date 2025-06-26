// app.js

// --- KONFIGURASI: Ganti dengan URL dan ANON KEY Anda ---
const SUPABASE_URL = 'https://eutgkrxqmebkxtvdburi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dGdrcnhxbWVia3h0dmRidXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDgxOTgsImV4cCI6MjA2NjIyNDE5OH0.RdeFRqV4sDSZpH5bcM_vpwGz4EMJU40nRl24TjtNzWU';
// ----------------------------------------------------

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ambil elemen dari DOM
const loginContainer = document.getElementById('login-container');
const logsContainer = document.getElementById('logs-container');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const logsTbody = document.getElementById('logs-tbody');

// Fungsi untuk mengambil dan menampilkan log
async function fetchLogs() {
    logsTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100); // Batasi 100 log terbaru

    if (error) {
        console.error('Error fetching logs:', error);
        logsTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>';
        return;
    }

    if (data.length === 0) {
        logsTbody.innerHTML = '<tr><td colspan="4">Belum ada aktivitas.</td></tr>';
        return;
    }

    // Kosongkan tabel sebelum mengisi
    logsTbody.innerHTML = '';
    data.forEach(log => {
        const tr = document.createElement('tr');
        
        const timestamp = new Date(log.timestamp).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        // Menambahkan atribut data-label untuk setiap sel agar responsif
        tr.innerHTML = `
            <td data-label="Waktu">${timestamp}</td>
            <td data-label="Nomor WA">${log.user_wa_number || '-'}</td>
            <td data-label="Aktivitas">${log.aktivitas}</td>
            <td data-label="Detail">${log.detail || '-'}</td>
        `;
        logsTbody.appendChild(tr);
    });
}

// Handler untuk form login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorMessage.textContent = '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorMessage.textContent = 'Login Gagal: ' + error.message;
    } else {
        // Jika berhasil, perbarui UI
        showLogsView();
        fetchLogs();
    }
});

// Handler untuk logout
logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoginView();
});

// Fungsi untuk menampilkan tampilan login
function showLoginView() {
    loginContainer.classList.remove('hidden');
    logsContainer.classList.add('hidden');
    logoutButton.classList.add('hidden');
}

// Fungsi untuk menampilkan tampilan log
function showLogsView() {
    loginContainer.classList.add('hidden');
    logsContainer.classList.remove('hidden');
    logoutButton.classList.remove('hidden');
}

// Cek sesi saat halaman dimuat
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showLogsView();
        fetchLogs();
    } else {
        showLoginView();
    }
}

// Jalankan pengecekan sesi
checkSession();