// js/dashboard.js (Versi Final dengan 3 Card & Saldo Total)

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM DASHBOARD ---
    const userFilter = document.getElementById('user-filter');
    const periodFilter = document.getElementById('period-filter');
    const totalPemasukanEl = document.getElementById('total-pemasukan');
    const totalPengeluaranEl = document.getElementById('total-pengeluaran');
    const saldoAkhirEl = document.getElementById('saldo-akhir'); // Elemen ini sekarang untuk SALDO TOTAL
    const expenseChartCanvas = document.getElementById('expense-chart');
    const chartNoDataEl = document.getElementById('chart-no-data');

    const kpiViewBtn = document.getElementById('kpi-view-btn');
    const chartViewBtn = document.getElementById('chart-view-btn');
    const kpiViewContainer = document.getElementById('kpi-view-container');
    const chartViewContainer = document.getElementById('chart-view-container');

    let expenseChart; 

    // --- FUNGSI HELPER ---
    function formatCurrency(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }
    function getPeriodDates(period) {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (period === 'hari_ini') { startDate.setHours(0, 0, 0, 0); } 
        else if (period === 'minggu_ini') { const dayOfWeek = now.getDay(); startDate = new Date(now.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))); startDate.setHours(0, 0, 0, 0); } 
        else if (period === 'bulan_ini') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); } 
        else if (period === 'tahun_ini') { startDate = new Date(now.getFullYear(), 0, 1); }
        return { startDate, endDate };
    }

    // --- FUNGSI UTAMA ---
    function showDashboardView(view) {
        kpiViewBtn.classList.remove('active');
        chartViewBtn.classList.remove('active');
        kpiViewContainer.classList.add('hidden');
        chartViewContainer.classList.add('hidden');

        if (view === 'kpi') {
            kpiViewBtn.classList.add('active');
            kpiViewContainer.classList.remove('hidden');
        } else if (view === 'chart') {
            chartViewBtn.classList.add('active');
            chartViewContainer.classList.remove('hidden');
        }
    }

    async function populateAndSetUserFilter() {
        if (userFilter.options.length > 1) {
            const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
            userFilter.value = defaultUserId;
            return;
        }
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) { console.error('Gagal mengambil data user:', error); return; }
        userFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nama;
            userFilter.appendChild(option);
        });
        
        const defaultUserId = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
        userFilter.value = defaultUserId;
        periodFilter.value = "bulan_ini";
    }

    async function updateDashboard() {
        // 1. Atur UI ke status "Memuat..."
        totalPemasukanEl.textContent = 'Memuat...';
        totalPengeluaranEl.textContent = 'Memuat...';
        saldoAkhirEl.textContent = 'Memuat...';
        
        const selectedUserId = userFilter.value;
        const selectedPeriod = periodFilter.value;
        const { startDate, endDate } = getPeriodDates(selectedPeriod);

        // 2. Siapkan promise query
        let transactionQuery = supabase.from('transaksi')
            .select('nominal, kategori(nama_kategori, tipe)')
            .gte('tanggal', startDate.toISOString())
            .lte('tanggal', endDate.toISOString());

        if (selectedUserId && selectedUserId !== 'semua') {
            transactionQuery = transactionQuery.eq('id_user', selectedUserId);
        }

        // Siapkan query saldo, bahkan untuk "semua user" (akan dihandle nanti)
        let userSaldoQuery = supabase.from('users').select('saldo');
        if (selectedUserId && selectedUserId !== 'semua') {
            userSaldoQuery = userSaldoQuery.eq('id', selectedUserId).single();
        }
        
        // 3. Jalankan query secara paralel
        const [transactionResult, userSaldoResult] = await Promise.all([
            transactionQuery,
            userSaldoQuery
        ]);

        // 4. Proses hasil query transaksi (untuk 2 card pertama)
        if (transactionResult.error) {
            console.error('Gagal mengambil data transaksi:', transactionResult.error);
            totalPemasukanEl.textContent = 'Error';
            totalPengeluaranEl.textContent = 'Error';
        } else {
            let totalIncome = 0, totalExpense = 0;
            const expenseByCategory = {};
            
            transactionResult.data.forEach(tx => {
                if (!tx.kategori) return;
                if (tx.kategori.tipe === 'INCOME') totalIncome += tx.nominal; 
                else if (tx.kategori.tipe === 'EXPENSE') {
                    totalExpense += tx.nominal;
                    expenseByCategory[tx.kategori.nama_kategori] = (expenseByCategory[tx.kategori.nama_kategori] || 0) + tx.nominal;
                }
            });

            totalPemasukanEl.textContent = formatCurrency(totalIncome);
            totalPengeluaranEl.textContent = formatCurrency(totalExpense);
            renderExpenseChart(expenseByCategory);
        }

        // 5. Proses hasil query saldo (untuk card "Saldo Total")
        if (userSaldoResult.error) {
            console.error('Gagal mengambil saldo pengguna:', userSaldoResult.error);
            saldoAkhirEl.textContent = 'Error';
        } else if (selectedUserId && selectedUserId !== 'semua') {
            // Jika satu user dipilih, tampilkan saldonya
            saldoAkhirEl.textContent = formatCurrency(userSaldoResult.data?.saldo || 0);
        } else {
            // Jika "Semua User" dipilih, tampilkan strip atau pesan
            saldoAkhirEl.textContent = '-';
        }
    }
    
    function renderExpenseChart(data) {
        if (expenseChart) { expenseChart.destroy(); }
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        if (labels.length === 0) {
            expenseChartCanvas.style.display = 'none';
            chartNoDataEl.classList.remove('hidden');
            return;
        }
        expenseChartCanvas.style.display = 'block';
        chartNoDataEl.classList.add('hidden');

        const ctx = expenseChartCanvas.getContext('2d');
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: { labels, datasets: [{ label: 'Pengeluaran', data: values, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'], hoverOffset: 4 }] },
            options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } } } }
        });
    }

    window.initializeDashboard = async () => {
        showDashboardView('kpi');
        await populateAndSetUserFilter();
        await updateDashboard();
    };

    userFilter.addEventListener('change', updateDashboard);
    periodFilter.addEventListener('change', updateDashboard);
    kpiViewBtn.addEventListener('click', () => showDashboardView('kpi'));
    chartViewBtn.addEventListener('click', () => showDashboardView('chart'));
});