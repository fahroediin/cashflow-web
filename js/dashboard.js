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

    let expenseChart; // Variabel untuk menyimpan instance chart

    // --- FUNGSI HELPER ---

    function formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

    function getPeriodDates(period) {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (period === 'hari_ini') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'minggu_ini') {
            const dayOfWeek = now.getDay();
            startDate = new Date(now.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)));
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'bulan_ini') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'tahun_ini') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        return { startDate, endDate };
    }


    // --- FUNGSI UTAMA ---

    async function populateUserFilter() {
        const { data, error } = await supabase.from('users').select('id, nama').order('nama');
        if (error) {
            console.error('Gagal mengambil data user:', error);
            return;
        }
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

        let query = supabase
            .from('transaksi')
            .select('nominal, kategori(nama_kategori, tipe)')
            .gte('tanggal', startDate.toISOString())
            .lte('tanggal', endDate.toISOString());
        
        if (selectedUserId !== 'semua') {
            query = query.eq('id_user', selectedUserId);
        }
        const { data, error } = await query;

        if (error) {
            console.error('Gagal mengambil data transaksi:', error);
            totalPemasukanEl.textContent = 'Error';
            return;
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategory = {};

        data.forEach(tx => {
            if (tx.kategori.tipe === 'INCOME') {
                totalIncome += tx.nominal;
            } else if (tx.kategori.tipe === 'EXPENSE') {
                totalExpense += tx.nominal;
                const categoryName = tx.kategori.nama_kategori;
                expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + tx.nominal;
            }
        });

        totalPemasukanEl.textContent = formatCurrency(totalIncome);
        totalPengeluaranEl.textContent = formatCurrency(totalExpense);
        saldoAkhirEl.textContent = formatCurrency(totalIncome - totalExpense);

        renderExpenseChart(expenseByCategory);
    }
    
    function renderExpenseChart(data) {
        if (expenseChart) {
            expenseChart.destroy();
        }
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
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pengeluaran',
                    data: values,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#e0e0e0' }
                    }
                }
            }
        });
    }

    window.initializeDashboard = () => {
        populateUserFilter();
        updateDashboard();
    };

    userFilter.addEventListener('change', updateDashboard);
    periodFilter.addEventListener('change', updateDashboard);
});