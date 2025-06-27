// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM DASHBOARD ---
    const userFilter = document.getElementById('user-filter');
    const periodFilter = document.getElementById('period-filter');
    const totalPemasukanEl = document.getElementById('total-pemasukan');
    const totalPengeluaranEl = document.getElementById('total-pengeluaran');
    const saldoAkhirEl = document.getElementById('saldo-akhir');
    const expenseChartCanvas = document.getElementById('expense-chart');
    const chartNoDataEl = document.getElementById('chart-no-data');
    const kpiViewBtn = document.getElementById('kpi-view-btn');
    const chartViewBtn = document.getElementById('chart-view-btn');
    const kpiViewContainer = document.getElementById('kpi-view-container');
    const chartViewContainer = document.getElementById('chart-view-container');

    let expenseChart; 

    // --- FUNGSI HELPER ---
    function formatCurrency(value) { /* ... (Tidak ada perubahan) ... */ }
    function getPeriodDates(period) { /* ... (Tidak ada perubahan) ... */ }

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

    async function populateUserFilter() {
        if (userFilter.options.length > 1) return;
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

    async function updateDashboard() {
        totalPemasukanEl.textContent = 'Memuat...';
        totalPengeluaranEl.textContent = 'Memuat...';
        saldoAkhirEl.textContent = 'Memuat...';
        expenseChartCanvas.style.display = 'none';
        chartNoDataEl.classList.add('hidden');

        const selectedUserId = userFilter.value;
        const selectedPeriod = periodFilter.value;
        const { startDate, endDate } = getPeriodDates(selectedPeriod);

        let query = supabase.from('transaksi').select('nominal, kategori(nama_kategori, tipe)').gte('tanggal', startDate.toISOString()).lte('tanggal', endDate.toISOString());
        if (selectedUserId !== 'semua') { query = query.eq('id_user', selectedUserId); }
        const { data, error } = await query;

        if (error) { console.error('Gagal mengambil data transaksi:', error); totalPemasukanEl.textContent = 'Error'; return; }

        let totalIncome = 0, totalExpense = 0;
        const expenseByCategory = {};
        data.forEach(tx => {
            if (tx.kategori.tipe === 'INCOME') { totalIncome += tx.nominal; } 
            else if (tx.kategori.tipe === 'EXPENSE') { totalExpense += tx.nominal; const categoryName = tx.kategori.nama_kategori; expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + tx.nominal; }
        });

        totalPemasukanEl.textContent = formatCurrency(totalIncome);
        totalPengeluaranEl.textContent = formatCurrency(totalExpense);
        saldoAkhirEl.textContent = formatCurrency(totalIncome - totalExpense);
        renderExpenseChart(expenseByCategory);
    }
    
    function renderExpenseChart(data) { /* ... (Tidak ada perubahan) ... */ }

    window.initializeDashboard = () => {
        populateUserFilter();
        updateDashboard();
        showDashboardView('kpi'); // Default ke tampilan KPI
    };

    userFilter.addEventListener('change', updateDashboard);
    periodFilter.addEventListener('change', updateDashboard);
    kpiViewBtn.addEventListener('click', () => showDashboardView('kpi'));
    chartViewBtn.addEventListener('click', () => showDashboardView('chart'));
});