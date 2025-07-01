// js/kategori.js (Versi dengan SweetAlert2)

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

// --- FUNGSI-FUNGSI ---

async function fetchAndRenderKategori() {
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
                    <button class="btn-delete" data-id="${kategori.id}" data-nama="${kategori.nama_kategori}">Hapus</button>
                </div>
            </td>
        `;
        kategoriTbody.appendChild(tr);
    });
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
        // --- GANTI alert() dengan Swal.fire() untuk validasi ---
        Swal.fire({
            icon: 'warning',
            title: 'Data Tidak Lengkap',
            text: 'Nama kategori dan tipe harus diisi.',
        });
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan...';

    const { error } = id
        ? await supabase.from('kategori').update({ nama_kategori, tipe }).eq('id', id) // Edit
        : await supabase.from('kategori').insert([{ nama_kategori, tipe }]); // Tambah

    saveButton.disabled = false;
    
    if (error) {
        // --- GANTI alert() dengan Swal.fire() untuk error ---
        Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: `Terjadi kesalahan saat menyimpan data: ${error.message}`,
        });
        saveButton.textContent = id ? 'Update' : 'Simpan';
        console.error("Gagal menyimpan data:", error);
    } else {
        // --- TAMBAHKAN notifikasi sukses ---
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Kategori berhasil disimpan.',
            showConfirmButton: false,
            timer: 1500
        });
        closeModal();
        fetchAndRenderKategori();
    }
}

async function handleDeleteClick(id, nama) {
    // --- GANTI confirm() dengan Swal.fire() ---
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
            // --- GANTI alert() dengan Swal.fire() untuk error ---
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: `Gagal menghapus kategori. Mungkin kategori ini masih digunakan dalam transaksi.`,
            });
            console.error("Gagal menghapus data:", error);
        } else {
            // --- TAMBAHKAN notifikasi sukses ---
            Swal.fire(
                'Dihapus!',
                `Kategori "${nama}" telah berhasil dihapus.`,
                'success'
            );
            fetchAndRenderKategori();
        }
    }
}

// --- EVENT LISTENERS ---
addKategoriButton.addEventListener('click', () => openModal('add'));
cancelButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});
kategoriForm.addEventListener('submit', handleFormSubmit);

kategoriTbody.addEventListener('click', (event) => {
    const target = event.target;
    // Pastikan target adalah button, bukan elemen di dalamnya
    const button = target.closest('button'); 
    if (!button) return;

    if (button.classList.contains('btn-edit')) {
        openModal('edit', { ...button.dataset });
    } else if (button.classList.contains('btn-delete')) {
        handleDeleteClick(button.dataset.id, button.dataset.nama);
    }
});