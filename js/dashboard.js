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

    // Format Angka ke Rupiah
    function formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

    // Mendapatkan rentang tanggal berdasarkan periode yang dipilih
    function getPeriodDates(period) {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // Akhir hari ini

        if (period === 'hari_ini') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'minggu_ini') {
            const dayOfWeek = now.getDay(); // 0 = Minggu, 1 = Senin
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

    // Mengambil daftar user untuk filter
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

    // Mengupdate semua data di dashboard
    async function updateDashboard() {
        // Tampilkan status loading
        totalPemasukanEl.textContent = 'Memuat...';
        totalPengeluaranEl.textContent = 'Memuat...';
        saldoAkhirEl.textContent = 'Memuat...';
        expenseChartCanvas.style.display = 'none';
        chartNoDataEl.classList.add('hidden');

        const selectedUserId = userFilter.value;
        const selectedPeriod = periodFilter.value;
        const { startDate, endDate } = getPeriodDates(selectedPeriod);

        // Bangun query ke Supabase
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

        // Hitung total
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

        // Update KPI Cards
        totalPemasukanEl.textContent = formatCurrency(totalIncome);
        totalPengeluaranEl.textContent = formatCurrency(totalExpense);
        saldoAkhirEl.textContent = formatCurrency(totalIncome - totalExpense);

        // Update Chart
        renderExpenseChart(expenseByCategory);
    }
    
    function renderExpenseChart(data) {
        if (expenseChart) {
            expenseChart.destroy(); // Hancurkan chart lama sebelum membuat yg baru
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
            type: 'pie', // Tipe chart: pie
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pengeluaran',
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#C9CBCF', '#E7E9ED', '#7C73C0', '#F39C12'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e0e0e0' // Warna teks legenda
                        }
                    }
                }
            }
        });
    }

    // Inisialisasi Dashboard (akan dipanggil oleh app.js)
    window.initializeDashboard = () => {
        populateUserFilter();
        updateDashboard();
    };

    // --- EVENT LISTENERS ---
    userFilter.addEventListener('change', updateDashboard);
    periodFilter.addEventListener('change', updateDashboard);
});