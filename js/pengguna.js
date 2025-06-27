// js/pengguna.js (Versi Final yang menggunakan .delete() standar)

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

    // FUNGSI DELETE YANG DIPERBARUI
    async function deleteUser(userId, userName) {
        const result = await Swal.fire({
            title: 'Anda yakin?',
            text: `Anda akan menghapus pengguna "${userName}" dari daftar. Aksi ini tidak akan menghapus akun login mereka.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            // TIDAK LAGI MENGGUNAKAN RPC. Gunakan .delete() standar.
            const { error } = await supabase
                .from('users') // Menargetkan tabel public.users
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Gagal menghapus pengguna:', error);
                // Menampilkan pesan error yang lebih ramah dari RLS
                let friendlyMessage = `Terjadi kesalahan: ${error.message}`;
                if (error.message.includes('violates row-level security policy')) {
                    friendlyMessage = 'Akses ditolak. Hanya admin yang dapat menghapus pengguna.';
                }
                Swal.fire('Gagal!', friendlyMessage, 'error');
            } else {
                Swal.fire('Dihapus!', `Pengguna "${userName}" telah berhasil dihapus.`, 'success');
                fetchAndRenderPengguna(); 
            }
        }
    }

    async function checkAdminRole() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        // Memeriksa metadata peran dari sesi yang aktif
        return session.user.app_metadata.user_role === 'admin';
    }

    async function fetchAndRenderPengguna() {
        penggunaTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const isAdmin = await checkAdminRole();

        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) { console.error('Error fetching users:', error); penggunaTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; return; }
        if (data.length === 0) { penggunaTbody.innerHTML = '<tr><td colspan="4">Belum ada pengguna.</td></tr>'; return; }
        
        penggunaTbody.innerHTML = data.map(user => {
            const tanggalDibuat = new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' });
            const nomorWa = user.nomer_whatsapp ? user.nomer_whatsapp.replace('@c.us', '') : '-';
            
            // Logika untuk menampilkan tombol Hapus hanya untuk admin
            const deleteButtonHtml = isAdmin ? `<button class="btn-delete" data-id="${user.id}" data-nama="${user.nama}">Hapus</button>` : '';

            return `
                <tr>
                    <td data-label="Nama"><span>${user.nama}</span></td>
                    <td data-label="Nomor WA"><span>${nomorWa}</span></td>
                    <td data-label="Dibuat Tanggal"><span>${tanggalDibuat}</span></td>
                    <td data-label="Aksi">
                        <div class="action-buttons">
                            <button class="btn-default" data-id="${user.id}" data-nama="${user.nama}">Set Default</button>
                            ${deleteButtonHtml}
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
        if (target.classList.contains('btn-delete')) {
            deleteUser(target.dataset.id, target.dataset.nama);
        }
    });
});