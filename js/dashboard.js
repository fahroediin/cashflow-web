// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
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

    function showDashboardView(view) {
        kpiViewBtn.classList.remove('active'); chartViewBtn.classList.remove('active');
        kpiViewContainer.classList.add('hidden'); chartViewContainer.classList.add('hidden');
        if (view === 'kpi') { kpiViewBtn.classList.add('active'); kpiViewContainer.classList.remove('hidden'); } 
        else if (view === 'chart') { chartViewBtn.classList.add('active'); chartViewContainer.classList.remove('hidden'); }
    }

    async function populateAndSetUserFilter() {
        if (userFilter.options.length > 1) {
            userFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
            return;
        }
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) { console.error('Gagal mengambil data user:', error); return; }
        userFilter.innerHTML = '<option value="semua">Semua User</option>';
        data.forEach(user => { const option = document.createElement('option'); option.value = user.id; option.textContent = user.nama; userFilter.appendChild(option); });
        userFilter.value = localStorage.getItem('defaultUserId') || '006d7ce0-335d-41d1-a0e8-7dc93ee58eaa';
        periodFilter.value = "hari_ini";
    }

    async function updateDashboard(isAdmin, chatbotProfile) {
        totalPemasukanEl.textContent = 'Memuat...'; totalPengeluaranEl.textContent = 'Memuat...'; saldoAkhirEl.textContent = 'Memuat...';
        const { startDate, endDate } = getPeriodDates(periodFilter.value);
        let query = supabase.from('transaksi').select('nominal, kategori(nama_kategori, tipe)').gte('tanggal', startDate.toISOString()).lte('tanggal', endDate.toISOString());
        
        if (isAdmin) {
            const selectedUserId = userFilter.value;
            if (selectedUserId && selectedUserId !== 'semua') query = query.eq('id_user', selectedUserId);
        } else {
            if (chatbotProfile) { query = query.eq('id_user', chatbotProfile.id); } 
            else { totalPemasukanEl.textContent = formatCurrency(0); totalPengeluaranEl.textContent = formatCurrency(0); saldoAkhirEl.textContent = formatCurrency(0); renderExpenseChart({}); return; }
        }

        const { data, error } = await query;
        if (error) { console.error('Gagal mengambil data transaksi:', error); totalPemasukanEl.textContent = 'Error'; return; }
        let totalIncome = 0, totalExpense = 0;
        const expenseByCategory = {};
        data.forEach(tx => {
            if (tx.kategori && tx.kategori.tipe === 'INCOME') { totalIncome += tx.nominal; } 
            else if (tx.kategori && tx.kategori.tipe === 'EXPENSE') { totalExpense += tx.nominal; const categoryName = tx.kategori.nama_kategori; expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + tx.nominal; }
        });
        totalPemasukanEl.textContent = formatCurrency(totalIncome); totalPengeluaranEl.textContent = formatCurrency(totalExpense); saldoAkhirEl.textContent = formatCurrency(totalIncome - totalExpense);
        renderExpenseChart(expenseByCategory);
    }
    
    function renderExpenseChart(data) {
        if (expenseChart) { expenseChart.destroy(); }
        const labels = Object.keys(data);
        const values = Object.values(data);
        if (labels.length === 0) { expenseChartCanvas.style.display = 'none'; chartNoDataEl.classList.remove('hidden'); return; }
        expenseChartCanvas.style.display = 'block'; chartNoDataEl.classList.add('hidden');
        const ctx = expenseChartCanvas.getContext('2d');
        expenseChart = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ label: 'Pengeluaran', data: values, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'], hoverOffset: 4 }] }, options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: '#e0e0e0' } } } } });
    }

    window.initializeDashboard = async (isAdmin, chatbotProfile) => {
        const filterContainer = document.querySelector('#dashboard-container .dashboard-filters');
        showDashboardView('kpi');
        if (isAdmin) {
            filterContainer.style.display = 'flex';
            await populateAndSetUserFilter();
        } else {
            filterContainer.style.display = 'none';
        }
        await updateDashboard(isAdmin, chatbotProfile);
    };
    
    periodFilter.addEventListener('change', () => window.dispatchEvent(new Event('update-dashboard')));
    userFilter.addEventListener('change', () => window.dispatchEvent(new Event('update-dashboard')));
    kpiViewBtn.addEventListener('click', () => showDashboardView('kpi'));
    chartViewBtn.addEventListener('click', () => showDashboardView('chart'));
    window.addEventListener('update-dashboard', () => {
        const isAdmin = document.querySelector('#nav-pengguna').style.display !== 'none';
        window.updateDashboard(isAdmin, window.currentUserChatbotProfile);
    });
});