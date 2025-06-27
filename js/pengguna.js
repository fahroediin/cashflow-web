// js/manajemen_pengguna.js
document.addEventListener('DOMContentLoaded', () => {
    const penggunaTbody = document.getElementById('pengguna-tbody');

    function updateDefaultButtons() {
        const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
        const buttons = document.querySelectorAll('.btn-default');
        buttons.forEach(button => {
            if (button.dataset.id === defaultUserId) {
                button.textContent = 'Default Saat Ini';
                button.disabled = true;
                button.classList.add('active');
            } else {
                button.textContent = 'Set Default';
                button.disabled = false;
                button.classList.remove('active');
            }
        });
    }

    async function setDefaultUser(userId, userName) {
        localStorage.setItem('defaultUserId', userId);
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: `Filter default telah diatur ke: ${userName}`, showConfirmButton: false, timer: 2000 });
        updateDefaultButtons();
    }

    // --- FUNGSI BARU UNTUK HAPUS PENGGUNA ---
    async function deleteUser(userId, userName) {
        // Konfirmasi dengan SweetAlert
        const result = await Swal.fire({
            title: 'Anda yakin?',
            text: `Anda akan menghapus pengguna "${userName}". Aksi ini tidak dapat dibatalkan!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            // Panggil RPC (Remote Procedure Call) untuk menghapus user
            // Ini adalah cara yang direkomendasikan Supabase untuk menghapus user
            const { error } = await supabase.rpc('delete_user_by_id', { user_id: userId });

            if (error) {
                console.error('Gagal menghapus pengguna:', error);
                Swal.fire(
                    'Gagal!',
                    `Terjadi kesalahan saat menghapus pengguna: ${error.message}`,
                    'error'
                );
            } else {
                Swal.fire(
                    'Dihapus!',
                    `Pengguna "${userName}" telah berhasil dihapus.`,
                    'success'
                );
                // Muat ulang daftar pengguna
                fetchAndRenderPengguna(); 
            }
        }
    }

    async function fetchAndRenderPengguna() {
        penggunaTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) { console.error('Error fetching users:', error); penggunaTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; return; }
        if (data.length === 0) { penggunaTbody.innerHTML = '<tr><td colspan="4">Belum ada pengguna.</td></tr>'; return; }
        
        penggunaTbody.innerHTML = data.map(user => {
            const tanggalDibuat = new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' });
            const nomorWa = user.nomer_whatsapp ? user.nomer_whatsapp.replace('@c.us', '') : '-';
            
            // PERUBAHAN: Menambahkan tombol delete di dalam action-buttons
            return `
                <tr>
                    <td data-label="Nama"><span>${user.nama}</span></td>
                    <td data-label="Nomor WA"><span>${nomorWa}</span></td>
                    <td data-label="Dibuat Tanggal"><span>${tanggalDibuat}</span></td>
                    <td data-label="Aksi">
                        <div class="action-buttons">
                            <button class="btn-default" data-id="${user.id}" data-nama="${user.nama}">Set Default</button>
                            <button class="btn-delete" data-id="${user.id}" data-nama="${user.nama}">Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        updateDefaultButtons();
    }

    window.initializePenggunaPage = () => {
        fetchAndRenderPengguna();
    };

    penggunaTbody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-default') && !target.disabled) {
            setDefaultUser(target.dataset.id, target.dataset.nama);
        }
        // PERUBAHAN: Menambahkan event listener untuk tombol hapus
        if (target.classList.contains('btn-delete')) {
            deleteUser(target.dataset.id, target.dataset.nama);
        }
    });
});