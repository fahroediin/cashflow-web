// js/kategori.js (Versi dengan SweetAlert dan Pengecekan)

// --- ELEMEN DOM ---
const kategoriTbody = document.getElementById('kategori-tbody');
const addKategoriButton = document.getElementById('add-kategori-button');
const modal = document.getElementById('kategori-modal');
const modalTitle = document.getElementById('modal-title');
const kategoriForm = document.getElementById('kategori-form');
const kategoriIdInput = document.getElementById('kategori-id');
const namaKategoriInput = document.getElementById('nama-kategori');
const tipeKategoriSelect = document.getElementById('tipe-kategori');
const cancelButton = document.getElementById('cancel-button');

// --- FUNGSI-FUNGSI ---

async function fetchAndRenderKategori() {
    // ... (Fungsi ini tidak perlu diubah)
    kategoriTbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';
    const { data, error } = await supabase
        .from('kategori')
        .select('*')
        .order('nama_kategori', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        kategoriTbody.innerHTML = '<tr><td colspan="3" class="error-text">Gagal memuat data kategori.</td></tr>';
        return;
    }
    if (data.length === 0) {
        kategoriTbody.innerHTML = '<tr><td colspan="3">Belum ada kategori.</td></tr>';
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
                    <button class="btn-delete" data-id="${kategori.id}">Hapus</button>
                </div>
            </td>
        `;
        kategoriTbody.appendChild(tr);
    });
}

function openModal(mode, data = {}) {
    // ... (Fungsi ini tidak perlu diubah)
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
    // ... (Fungsi ini tidak perlu diubah)
    modal.classList.add('hidden');
}

// --- FUNGSI CRUD YANG DIPERBARUI ---

async function handleFormSubmit(event) {
    event.preventDefault();
    const saveButton = document.getElementById('save-button');
    const id = kategoriIdInput.value;
    const nama_kategori = namaKategoriInput.value.trim();
    const tipe = tipeKategoriSelect.value;

    if (!nama_kategori || !tipe) {
        Swal.fire('Validasi Gagal', 'Semua field harus diisi.', 'warning');
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan...';

    const { error } = id
        ? await supabase.from('kategori').update({ nama_kategori, tipe }).eq('id', id)
        : await supabase.from('kategori').insert([{ nama_kategori, tipe }]);

    saveButton.disabled = false;
    saveButton.textContent = id ? 'Update' : 'Simpan';
    
    if (error) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menyimpan data: ' + error.message, 'error');
    } else {
        closeModal();
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Data kategori berhasil disimpan.',
            showConfirmButton: false,
            timer: 1500
        });
        fetchAndRenderKategori();
    }
}

async function handleDeleteClick(id) {
    // 1. Tampilkan konfirmasi dengan SweetAlert
    Swal.fire({
        title: 'Anda yakin?',
        text: "Anda tidak akan dapat mengembalikan data ini!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            // 2. Jika dikonfirmasi, cek dulu apakah kategori sedang digunakan
            const { count, error: checkError } = await supabase
                .from('transaksi')
                .select('*', { count: 'exact', head: true }) // hanya hitung, tidak ambil data
                .eq('id_kategori', id);

            if (checkError) {
                Swal.fire('Gagal!', 'Gagal memeriksa penggunaan kategori: ' + checkError.message, 'error');
                return;
            }

            // 3. Jika sedang digunakan (count > 0), tampilkan error dan stop
            if (count > 0) {
                Swal.fire('Gagal Dihapus!', 'Kategori ini sedang digunakan oleh ' + count + ' transaksi dan tidak dapat dihapus.', 'error');
                return;
            }

            // 4. Jika tidak digunakan, lanjutkan proses hapus
            const { error: deleteError } = await supabase
                .from('kategori')
                .delete()
                .eq('id', id);

            if (deleteError) {
                Swal.fire('Gagal!', 'Gagal menghapus data: ' + deleteError.message, 'error');
            } else {
                Swal.fire(
                    'Dihapus!',
                    'Kategori telah berhasil dihapus.',
                    'success'
                );
                fetchAndRenderKategori();
            }
        }
    });
}

// --- EVENT LISTENERS --- (Tidak ada perubahan di sini)
addKategoriButton.addEventListener('click', () => openModal('add'));
cancelButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});
kategoriForm.addEventListener('submit', handleFormSubmit);
kategoriTbody.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('btn-edit')) {
        openModal('edit', { ...target.dataset });
    } else if (target.classList.contains('btn-delete')) {
        handleDeleteClick(target.dataset.id);
    }
});