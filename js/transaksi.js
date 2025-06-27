// js/transaksi.js
document.addEventListener('DOMContentLoaded', () => {
    const userFilter = document.getElementById('transaksi-user-filter');
    const transaksiTbody = document.getElementById('transaksi-tbody');

    function formatCurrency(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }

    async function populateAndSetUserFilter() {
        if (userFilter.options.length > 1) {
            userFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
            return;
        }
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) { console.error('Gagal mengambil data user:', error); return; }
        userFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => { const option = document.createElement('option'); option.value = user.id; option.textContent = user.nama; userFilter.appendChild(option); });
        userFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
    }

    async function fetchTransaksi(isAdmin, chatbotProfile) {
        transaksiTbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
        let query = supabase.from('transaksi').select('*, kategori(nama_kategori, tipe)').order('tanggal', { ascending: false });

        if (isAdmin) {
            const selectedUserId = userFilter.value;
            if (selectedUserId && selectedUserId !== 'semua') query = query.eq('id_user', selectedUserId);
        } else {
            if (chatbotProfile) { query = query.eq('id_user', chatbotProfile.id); } 
            else { transaksiTbody.innerHTML = '<tr><td colspan="5">Tidak ada data transaksi.</td></tr>'; return; }
        }
        
        const { data, error } = await query;
        if (error) { console.error('Gagal mengambil data transaksi:', error); transaksiTbody.innerHTML = '<tr><td colspan="5" class="error-text">Gagal memuat data.</td></tr>'; return; }
        
        transaksiTbody.innerHTML = data.length === 0 ? '<tr><td colspan="5">Tidak ada transaksi.</td></tr>' : data.map(tx => {
            const tanggal = new Date(tx.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            return `<tr><td data-label="Tanggal"><span>${tanggal}</span></td><td data-label="Kategori"><span>${tx.kategori.nama_kategori}</span></td><td data-label="Tipe"><span>${tx.kategori.tipe}</span></td><td data-label="Nominal"><span>${formatCurrency(tx.nominal)}</span></td><td data-label="Catatan"><span>${tx.catatan || '-'}</span></td></tr>`;
        }).join('');
    }

    window.initializeTransaksiPage = async (isAdmin, chatbotProfile) => {
        const filterContainer = document.querySelector('#transaksi-container .dashboard-filters');
        if (isAdmin) {
            filterContainer.style.display = 'flex';
            await populateAndSetUserFilter();
        } else {
            filterContainer.style.display = 'none';
        }
        fetchTransaksi(isAdmin, chatbotProfile);
    };

    userFilter.addEventListener('change', () => {
        const isAdmin = document.querySelector('#nav-pengguna').style.display !== 'none';
        window.dispatchEvent(new CustomEvent('update-transaksi', { detail: { isAdmin, chatbotProfile: window.currentUserChatbotProfile } }));
    });
    window.addEventListener('update-transaksi', (e) => fetchTransaksi(e.detail.isAdmin, e.detail.chatbotProfile));
});