// js/pengguna.js (Versi Final yang menggunakan .delete() standar)

document.addEventListener('DOMContentLoaded', () => {
    const penggunaTbody = document.getElementById('pengguna-tbody');
    // Elemen Modal Baru
    const createLoginModal = document.getElementById('create-login-modal');
    const createLoginForm = document.getElementById('create-login-form');
    const cancelCreateLoginBtn = document.getElementById('cancel-create-login-button');
    const chatbotUserIdInput = document.getElementById('chatbot-user-id');
    const chatbotUserNameEl = document.getElementById('chatbot-user-name');

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
        // Tampilkan konfirmasi SweetAlert
        const result = await Swal.fire({
            title: 'Anda yakin?',
            text: `Anda akan menghapus pengguna "${userName}" dari daftar.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            console.log(`[DEBUG] Tombol hapus dikonfirmasi. Mencoba menghapus user dengan ID: ${userId}`);

            // Bungkus panggilan RPC dalam try...catch untuk menangkap semua error
            try {
                console.log("[DEBUG] Memanggil RPC 'delete_public_user'...");

                const { data, error } = await supabase.rpc('delete_public_user', {
                    user_id_to_delete: userId
                });

                console.log("[DEBUG] Panggilan RPC selesai.");
                console.log("[DEBUG] Data yang diterima:", data);
                console.log("[DEBUG] Error yang diterima:", error);

                if (error) {
                    // Jika ada error, tampilkan di console dan alert
                    console.error('Gagal menghapus pengguna via RPC:', error);
                    Swal.fire('Gagal!', `Terjadi kesalahan: ${error.message}`, 'error');
                } else {
                    // Jika tidak ada error, tampilkan data dari fungsi
                    Swal.fire('Selesai!', data, 'success');
                    fetchAndRenderPengguna();
                }
            } catch (catchError) {
                // Ini akan menangkap error yang lebih fundamental jika panggilan RPC itu sendiri gagal
                console.error("[FATAL] Panggilan RPC gagal total:", catchError);
                Swal.fire('Error Kritis!', 'Tidak dapat menghubungi database. Periksa console untuk detail.', 'error');
            }
        }
    }

    async function checkAdminRole() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        // Memeriksa metadata peran dari sesi yang aktif
        return session.user.app_metadata.user_role === 'admin';
    }

    function openCreateLoginModal(userId, userName) {
        chatbotUserIdInput.value = userId;
        chatbotUserNameEl.textContent = userName;
        createLoginModal.classList.remove('hidden');
    }

    function closeCreateLoginModal() {
        createLoginForm.reset();
        createLoginModal.classList.add('hidden');
    }

    async function handleCreateLoginSubmit(event) {
        event.preventDefault();
        const email = document.getElementById('new-user-email').value;
        const password = document.getElementById('new-user-password').value;
        const publicUserId = chatbotUserIdInput.value;

        // 1. Buat pengguna baru di sistem Otentikasi Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            Swal.fire('Gagal!', `Gagal membuat akun login: ${authError.message}`, 'error');
            return;
        }

        if (authData.user) {
            // 2. Jika berhasil, hubungkan auth_user_id ke public.users
            const { error: updateError } = await supabase
                .from('users')
                .update({ auth_user_id: authData.user.id })
                .eq('id', publicUserId);

            if (updateError) {
                Swal.fire('Berhasil Sebagian', `Akun login berhasil dibuat, tetapi gagal menautkan ke profil chatbot: ${updateError.message}`, 'warning');
            } else {
                Swal.fire('Berhasil!', 'Akun login untuk pengguna berhasil dibuat dan ditautkan.', 'success');
                closeCreateLoginModal();
                fetchAndRenderPengguna(); // Muat ulang tabel untuk update tampilan
            }
        }
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