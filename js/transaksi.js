// js/transaksi.js
document.addEventListener('DOMContentLoaded', () => {
const userFilter = document.getElementById('transaksi-user-filter');
const transaksiTbody = document.getElementById('transaksi-tbody');
function formatCurrency(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }

async function populateAndSetUserFilter() {
    if (userFilter.options.length > 1) {
        // Jika filter sudah ada, cukup set nilainya dari localStorage
        const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
        userFilter.value = defaultUserId;
        return;
    }

    const { data, error } = await supabase.from('users').select('id, nama').order('nama');
    if (error) { console.error('Gagal mengambil data user:', error); return; }
    userFilter.innerHTML = '<option value="semua">Semua User</option>';
    data.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.nama;
        userFilter.appendChild(option);
    });

    const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
    userFilter.value = defaultUserId;
}

async function fetchTransaksi() {
    transaksiTbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
    const selectedUserId = userFilter.value;
    let query = supabase.from('transaksi').select('*, kategori(nama_kategori, tipe)').order('tanggal', { ascending: false });

    if (selectedUserId && selectedUserId !== 'semua') {
        query = query.eq('id_user', selectedUserId);
    }
    const { data, error } = await query;

    if (error) { console.error('Gagal mengambil data transaksi:', error); transaksiTbody.innerHTML = '<tr><td colspan="5" class="error-text">Gagal memuat data.</td></tr>'; return; }
    
    transaksiTbody.innerHTML = data.length === 0 ? '<tr><td colspan="5">Tidak ada transaksi.</td></tr>' : data.map(tx => {
        const tanggal = new Date(tx.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        return `
            <tr>
                <td data-label="Tanggal"><span>${tanggal}</span></td>
                <td data-label="Kategori"><span>${tx.kategori.nama_kategori}</span></td>
                <td data-label="Tipe"><span>${tx.kategori.tipe}</span></td>
                <td data-label="Nominal"><span>${formatCurrency(tx.nominal)}</span></td>
                <td data-label="Catatan"><span>${tx.catatan || '-'}</span></td>
            </tr>
        `;
    }).join('');
}

window.initializeTransaksiPage = async () => {
    await populateAndSetUserFilter();
    fetchTransaksi();
};

userFilter.addEventListener('change', fetchTransaksi);
});