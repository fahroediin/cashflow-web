// js/transaksi.js (Versi dengan Filter Kategori)
document.addEventListener('DOMContentLoaded', () => {
    const userFilter = document.getElementById('transaksi-user-filter');
    // --- PERUBAHAN: Tambahkan elemen filter kategori ---
    const kategoriFilter = document.getElementById('transaksi-kategori-filter');
    const transaksiTbody = document.getElementById('transaksi-tbody');
    
    const paginationControls = document.getElementById('transaksi-pagination');
    const prevButton = paginationControls.querySelector('.btn-prev');
    const nextButton = paginationControls.querySelector('.btn-next');
    const pageInfo = paginationControls.querySelector('.page-info');
    let currentPage = 1;
    const rowsPerPage = 10;

    function formatCurrency(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }

    async function populateAndSetUserFilter() {
        if (userFilter.options.length <= 1) {
            const { data, error } = await supabase.from('users').select('id, nama').order('nama');
            if (error) { console.error('Gagal mengambil data user:', error); return; }
            userFilter.innerHTML = '<option value="semua">Semua User</option>';
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.nama;
                userFilter.appendChild(option);
            });
        }
        const defaultUserId = localStorage.getItem('defaultUserId') || 'semua';
        userFilter.value = defaultUserId;
    }

    // --- FUNGSI BARU: Untuk mengisi filter kategori ---
    async function populateKategoriFilter() {
        if (kategoriFilter.options.length <= 1) {
            const { data, error } = await supabase.from('kategori').select('id, nama_kategori').order('nama_kategori');
            if (error) { console.error('Gagal mengambil data kategori:', error); return; }
            kategoriFilter.innerHTML = '<option value="semua">Semua Kategori</option>';
            data.forEach(kategori => {
                const option = document.createElement('option');
                option.value = kategori.id;
                option.textContent = kategori.nama_kategori;
                kategoriFilter.appendChild(option);
            });
        }
        kategoriFilter.value = 'semua'; // Set default ke "Semua Kategori"
    }

    async function fetchTransaksi(page = 1) {
        currentPage = page;
        transaksiTbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
        
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const selectedUserId = userFilter.value;
        // --- PERUBAHAN: Ambil nilai dari filter kategori ---
        const selectedKategoriId = kategoriFilter.value;

        let query = supabase.from('transaksi')
            .select('*, kategori(nama_kategori, tipe)', { count: 'exact' })
            .order('tanggal', { ascending: false })
            .range(from, to);

        // Terapkan filter user
        if (selectedUserId && selectedUserId !== 'semua') {
            query = query.eq('id_user', selectedUserId);
        }
        // --- PERUBAHAN: Terapkan filter kategori ---
        if (selectedKategoriId && selectedKategoriId !== 'semua') {
            query = query.eq('id_kategori', selectedKategoriId);
        }

        const { data, error, count } = await query;

        if (error) { 
            console.error('Gagal mengambil data transaksi:', error); 
            transaksiTbody.innerHTML = '<tr><td colspan="5" class="error-text">Gagal memuat data.</td></tr>'; 
            paginationControls.classList.add('hidden');
            return; 
        }
        
        transaksiTbody.innerHTML = data.length === 0 ? '<tr><td colspan="5">Tidak ada transaksi.</td></tr>' : data.map(tx => {
            const tanggal = new Date(tx.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            // Pastikan tx.kategori tidak null sebelum diakses
            const kategoriNama = tx.kategori ? tx.kategori.nama_kategori : 'Tanpa Kategori';
            const kategoriTipe = tx.kategori ? tx.kategori.tipe : '-';
            return `
                <tr>
                    <td data-label="Tanggal"><span>${tanggal}</span></td>
                    <td data-label="Kategori"><span>${kategoriNama}</span></td>
                    <td data-label="Tipe"><span>${kategoriTipe}</span></td>
                    <td data-label="Nominal"><span>${formatCurrency(tx.nominal)}</span></td>
                    <td data-label="Catatan"><span>${tx.catatan || '-'}</span></td>
                </tr>
            `;
        }).join('');

        updatePagination(count);
    }

    function updatePagination(totalRows) {
        if (!totalRows || totalRows <= rowsPerPage) {
            paginationControls.classList.add('hidden');
            return;
        }
        paginationControls.classList.remove('hidden');
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage >= totalPages;
    }

    // --- PERUBAHAN: Panggil fungsi populateKategoriFilter ---
    window.initializeTransaksiPage = async () => {
        await populateAndSetUserFilter();
        await populateKategoriFilter(); // Panggil fungsi baru di sini
        fetchTransaksi(1);
    };

    userFilter.addEventListener('change', () => fetchTransaksi(1));
    // --- EVENT LISTENER BARU: Untuk filter kategori ---
    kategoriFilter.addEventListener('change', () => fetchTransaksi(1));

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) fetchTransaksi(currentPage - 1);
    });
    nextButton.addEventListener('click', () => {
        fetchTransaksi(currentPage + 1);
    });
});