// js/transaksi.js (Versi Perbaikan Filter Default)
document.addEventListener('DOMContentLoaded', () => {
    const userFilter = document.getElementById('transaksi-user-filter');
    const transaksiTbody = document.getElementById('transaksi-tbody');
    
    const paginationControls = document.getElementById('transaksi-pagination');
    const prevButton = paginationControls.querySelector('.btn-prev');
    const nextButton = paginationControls.querySelector('.btn-next');
    const pageInfo = paginationControls.querySelector('.page-info');
    let currentPage = 1;
    const rowsPerPage = 10;

    function formatCurrency(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }

    async function populateAndSetUserFilter() {
        // PERBAIKAN: Cek apakah filter sudah terisi
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

        // PERBAIKAN: Logika untuk set nilai default
        const defaultUserId = localStorage.getItem('defaultUserId') || 'semua';
        userFilter.value = defaultUserId;
    }

    async function fetchTransaksi(page = 1) {
        currentPage = page;
        transaksiTbody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
        
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const selectedUserId = userFilter.value;
        let query = supabase.from('transaksi')
            .select('*, kategori(nama_kategori, tipe)', { count: 'exact' })
            .order('tanggal', { ascending: false })
            .range(from, to);

        if (selectedUserId && selectedUserId !== 'semua') {
            query = query.eq('id_user', selectedUserId);
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

    window.initializeTransaksiPage = async () => {
        await populateAndSetUserFilter();
        fetchTransaksi(1);
    };

    userFilter.addEventListener('change', () => fetchTransaksi(1));
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) fetchTransaksi(currentPage - 1);
    });
    nextButton.addEventListener('click', () => {
        fetchTransaksi(currentPage + 1);
    });
});