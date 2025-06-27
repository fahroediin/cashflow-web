// js/pengguna.js (Versi dengan Fitur Buat Akun & Hapus)
document.addEventListener('DOMContentLoaded', () => {
    const penggunaTbody = document.getElementById('pengguna-tbody');
    const createLoginModal = document.getElementById('create-login-modal');
    const createLoginForm = document.getElementById('create-login-form');
    const cancelCreateLoginBtn = document.getElementById('cancel-create-login-button');
    const chatbotUserIdInput = document.getElementById('chatbot-user-id');
    const chatbotUserNameEl = document.getElementById('chatbot-user-name');
    let isAdmin = false;

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

    async function deleteUser(userId, userName) {
        const result = await Swal.fire({
            title: 'Anda yakin?', text: `Anda akan menghapus pengguna chatbot "${userName}" dan semua data terkait. Aksi ini tidak dapat dibatalkan!`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Ya, hapus!', cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) {
                let friendlyMessage = `Terjadi kesalahan: ${error.message}`;
                if (error.message.includes('violates row-level security policy')) { friendlyMessage = 'Akses ditolak. Hanya admin yang dapat menghapus pengguna.'; }
                Swal.fire('Gagal!', friendlyMessage, 'error');
            } else {
                Swal.fire('Dihapus!', `Pengguna "${userName}" telah berhasil dihapus.`, 'success');
                fetchAndRenderPengguna();
            }
        }
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
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Membuat...';

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

        if (authError) {
            Swal.fire('Gagal!', `Gagal membuat akun login: ${authError.message}`, 'error');
        } else if (authData.user) {
            const { error: updateError } = await supabase.from('users').update({ auth_user_id: authData.user.id }).eq('id', publicUserId);
            if (updateError) {
                Swal.fire('Berhasil Sebagian', `Akun login berhasil dibuat, tetapi gagal menautkan ke profil chatbot: ${updateError.message}`, 'warning');
            } else {
                Swal.fire('Berhasil!', 'Akun login untuk pengguna berhasil dibuat dan ditautkan.', 'success');
                closeCreateLoginModal();
                fetchAndRenderPengguna();
            }
        }
        submitButton.disabled = false;
        submitButton.textContent = 'Buat Akun';
    }

    async function fetchAndRenderPengguna() {
        penggunaTbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';
        const { data: sessionData } = await supabase.auth.getSession();
        isAdmin = sessionData.session?.user.app_metadata.user_role === 'admin';

        const { data, error } = await supabase.from('users').select('*, auth_user:auth_user_id (email)').order('created_at', { ascending: false });
        if (error) { console.error('Error fetching users:', error); penggunaTbody.innerHTML = '<tr><td colspan="4" class="error-text">Gagal memuat data.</td></tr>'; return; }
        if (data.length === 0) { penggunaTbody.innerHTML = '<tr><td colspan="4">Belum ada pengguna.</td></tr>'; return; }

        penggunaTbody.innerHTML = data.map(user => {
            const nomorWa = user.nomer_whatsapp ? user.nomer_whatsapp.replace('@c.us', '') : '-';
            const loginInfoHtml = user.auth_user_id ? `<span>${user.auth_user?.email || 'Terkait (Email tidak ditemukan)'}</span>` :
                (isAdmin ? `<button class="btn-create-login" data-id="${user.id}" data-nama="${user.nama}">Buat Akun</button>` : '<span>-</span>');
            const deleteButtonHtml = isAdmin ? `<button class="btn-delete" data-id="${user.id}" data-nama="${user.nama}">Hapus</button>` : '';

            return `<tr>
                <td data-label="Nama"><span>${user.nama}</span></td>
                <td data-label="Nomor WA"><span>${nomorWa}</span></td>
                <td data-label="Akun Login Web">${loginInfoHtml}</td>
                <td data-label="Aksi"><div class="action-buttons"><button class="btn-default" data-id="${user.id}" data-nama="${user.nama}">Set Default</button>${deleteButtonHtml}</div></td>
            </tr>`;
        }).join('');
        updateDefaultButtons();
    }

    window.initializePenggunaPage = () => { fetchAndRenderPengguna(); };

    penggunaTbody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-default')) { setDefaultUser(target.dataset.id, target.dataset.nama); }
        if (target.classList.contains('btn-delete')) { deleteUser(target.dataset.id, target.dataset.nama); }
        if (target.classList.contains('btn-create-login')) { openCreateLoginModal(target.dataset.id, target.dataset.nama); }
    });
    createLoginForm.addEventListener('submit', handleCreateLoginSubmit);
    cancelCreateLoginBtn.addEventListener('click', closeCreateLoginModal);
});