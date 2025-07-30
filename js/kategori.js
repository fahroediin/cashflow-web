// js/kategori.js (Versi Perbaikan Paginasi)

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM ---
    const kategoriTbody = document.getElementById('kategori-tbody');
    const addKategoriButton = document.getElementById('add-kategori-button');

    // Elemen Modal
    const modal = document.getElementById('kategori-modal');
    const modalTitle = document.getElementById('modal-title');
    const kategoriForm = document.getElementById('kategori-form');
    const kategoriIdInput = document.getElementById('kategori-id');
    const namaKategoriInput = document.getElementById('nama-kategori');
    const tipeKategoriSelect = document.getElementById('tipe-kategori');
    const cancelButton = document.getElementById('cancel-button');

    // --- PAGINASI ---
    const paginationControls = document.getElementById('kategori-pagination');
    const prevButton = paginationControls.querySelector('.btn-prev');
    const nextButton = paginationControls.querySelector('.btn-next');
    const pageInfo = paginationControls.querySelector('.page-info');
    let currentPage = 1;
    const rowsPerPage = 10;

    // --- FUNGSI-FUNGSI ---
    async function fetchAndRenderKategori(page = 1) {
        currentPage = page;
        kategoriTbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const { data, error, count } = await supabase
            .from('kategori')
            .select('*', { count: 'exact' })
            .order('nama_kategori', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('Error fetching categories:', error);
            kategoriTbody.innerHTML = '<tr><td colspan="3" class="error-text">Gagal memuat data kategori.</td></tr>';
            paginationControls.classList.add('hidden');
            return;
        }

        if (count === 0) {
            kategoriTbody.innerHTML = '<tr><td colspan="3">Belum ada kategori.</td></tr>';
            paginationControls.classList.add('hidden');
            return;
        }

        kategoriTbody.innerHTML = '';
        data.forEach(kategori => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Nama Kategori"><span>${kategori.nama_kategori}</span></td>
                <td data-label="Tipe"><span>${kategori.tipe}</span></td>
                <td data-label="Aksi">
                    <div class="action-buttons">
                        <button class="btn-edit" data-id="${kategori.id}" data-nama="${kategori.nama_kategori}" data-tipe="${kategori.tipe}">Edit</button>
                        <button class="btn-delete" data-id="${kategori.id}" data-nama="${kategori.nama_kategori}">Hapus</button>
                    </div>
                </td>
            `;
            kategoriTbody.appendChild(tr);
        });

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

    function openModal(mode, data = {}) {
        kategoriForm.reset();
        const saveButton = document.getElementById('save-button');
        if (mode === 'add') {
            modalTitle.textContent = 'Tambah Kategori Baru';
            saveButton.textContent = 'Simpan';
            kategoriIdInput.value = '';
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Edit Kategori';
            saveButton.textContent = 'Update';
            kategoriIdInput.value = data.id;
            namaKategoriInput.value = data.nama;
            tipeKategoriSelect.value = data.tipe;
        }
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const saveButton = document.getElementById('save-button');
        const id = kategoriIdInput.value;
        const nama_kategori = namaKategoriInput.value.trim();
        const tipe = tipeKategoriSelect.value;

        if (!nama_kategori || !tipe) {
            Swal.fire({ icon: 'warning', title: 'Data Tidak Lengkap', text: 'Nama kategori dan tipe harus diisi.' });
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = 'Menyimpan...';

        const { error } = id
            ? await supabase.from('kategori').update({ nama_kategori, tipe }).eq('id', id)
            : await supabase.from('kategori').insert([{ nama_kategori, tipe }]);

        saveButton.disabled = false;
        
        if (error) {
            Swal.fire({ icon: 'error', title: 'Gagal!', text: `Terjadi kesalahan saat menyimpan data: ${error.message}` });
            saveButton.textContent = id ? 'Update' : 'Simpan';
            console.error("Gagal menyimpan data:", error);
        } else {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Kategori berhasil disimpan.', showConfirmButton: false, timer: 1500 });
            closeModal();
            fetchAndRenderKategori(currentPage);
        }
    }

    async function handleDeleteClick(id, nama) {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: `Anda akan menghapus kategori "${nama}". Aksi ini tidak dapat dibatalkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            const { error } = await supabase.from('kategori').delete().eq('id', id);
            
            if (error) {
                Swal.fire({ icon: 'error', title: 'Gagal!', text: `Gagal menghapus kategori. Mungkin kategori ini masih digunakan dalam transaksi.` });
                console.error("Gagal menghapus data:", error);
            } else {
                Swal.fire('Dihapus!', `Kategori "${nama}" telah berhasil dihapus.`, 'success');
                fetchAndRenderKategori(1);
            }
        }
    }

    // --- EVENT LISTENERS ---
    window.initializeKategoriPage = () => {
        fetchAndRenderKategori(1);
    };

    addKategoriButton.addEventListener('click', () => openModal('add'));
    cancelButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
    kategoriForm.addEventListener('submit', handleFormSubmit);

    kategoriTbody.addEventListener('click', (event) => {
        const target = event.target;
        const button = target.closest('button'); 
        if (!button) return;

        if (button.classList.contains('btn-edit')) {
            openModal('edit', { ...button.dataset });
        } else if (button.classList.contains('btn-delete')) {
            handleDeleteClick(button.dataset.id, button.dataset.nama);
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) fetchAndRenderKategori(currentPage - 1);
    });
    nextButton.addEventListener('click', () => {
        fetchAndRenderKategori(currentPage + 1);
    });
});