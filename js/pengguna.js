// js/pengguna.js (Versi dengan Paginasi)

document.addEventListener('DOMContentLoaded', () => {
    const penggunaTbody = document.getElementById('pengguna-tbody');
    
    // --- PERUBAHAN PAGINASI ---
    const paginationControls = document.getElementById('pengguna-pagination');
    const prevButton = paginationControls.querySelector('.btn-prev');
    const nextButton = paginationControls.querySelector('.btn-next');
    const pageInfo = paginationControls.querySelector('.page-info');
    let currentPage = 1;
    const rowsPerPage = 10;
    // --- AKHIR PERUBAHAN ---

    function updateDefaultButtons() {
        const defaultUserId = localStorage.getItem('defaultUserId') || 'semua';
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

    async function deleteUser(userId, userName) {
        const result = await Swal.fire({
            title: 'Anda yakin?',
            text: `Anda akan menghapus pengguna "${userName}" dan semua datanya.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const { data, error } = await supabase.rpc('delete_public_user', { user_id_to_delete: userId });
                if (error) {
                    console.error('Gagal menghapus pengguna via RPC:', error);
                    Swal.fire('Gagal!', `Terjadi kesalahan: ${error.message}`, 'error');
                } else {
                    Swal.fire('Selesai!', data, 'success');
                    fetchAndRenderPengguna(1); // Kembali ke halaman 1 setelah hapus
                }
            } catch (catchError) {
                console.error("[FATAL] Panggilan RPC gagal total:", catchError);
                Swal.fire('Error Kritis!', 'Tidak dapat menghubungi database. Periksa console.', 'error');
            }
        }
    }

    async function checkAdminRole() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        return session.user.app_metadata.user_role === 'admin';
    }

    // --- FUNGSI FETCH DIPERBARUI UNTUK PAGINASI ---
    async function fetchAndRenderPengguna(page = 1) {
        currentPage = page;
        penggunaTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const isAdmin = await checkAdminRole();

        const { data, error, count } = await supabase.from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) { 
            console.error('Error fetching users:', error); 
            penggunaTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; 
            paginationControls.classList.add('hidden');
            return; 
        }
        if (count === 0) { 
            penggunaTbody.innerHTML = '<tr><td colspan="4">Belum ada pengguna.</td></tr>'; 
            paginationControls.classList.add('hidden');
            return; 
        }
        
        penggunaTbody.innerHTML = data.map(user => {
            const tanggalDibuat = new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' });
            const nomorWa = user.nomer_whatsapp ? user.nomer_whatsapp.replace('@c.us', '') : '-';
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
        updatePagination(count);
    }

    function updatePagination(totalRows) {
        if (totalRows <= rowsPerPage) {
            paginationControls.classList.add('hidden');
            return;
        }
        paginationControls.classList.remove('hidden');
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage >= totalPages;
    }
    // --- AKHIR PERUBAHAN PAGINASI ---

    window.initializePenggunaPage = () => {
        fetchAndRenderPengguna(1); // Mulai dari halaman 1
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

    // --- EVENT LISTENER PAGINASI ---
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) fetchAndRenderPengguna(currentPage - 1);
    });
    nextButton.addEventListener('click', () => {
        fetchAndRenderPengguna(currentPage + 1);
    });
});