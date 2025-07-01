# DuitQ - Admin Dashboard

![alt text](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)![alt text](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)![alt text](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)![alt text](https://img.shields.io/badge/Supabase-Full_Backend-3ECF8E?style=for-the-badge&logo=supabase)![alt text](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

DuitQ Admin Dashboard adalah antarmuka web administratif yang komprehensif untuk mengelola dan memvisualisasikan data dari DuitQ WhatsApp Cashflow Bot. Dashboard ini menyediakan alat untuk memantau keuangan, mengelola data master, dan melihat log aktivitas secara terpusat, ditenagai oleh Supabase sebagai backend.

---

## ✨ Fitur

✨ Fitur Unggulan
- 🔒 Sistem Autentikasi Aman
Akses dashboard dilindungi oleh sistem autentikasi email dan password dari Supabase.
- 📊 Dashboard Analitik Interaktif
Lihat ringkasan keuangan (Pemasukan, Pengeluaran, Saldo) dalam bentuk Kartu KPI dan visualisasikan rincian pengeluaran per kategori dengan diagram lingkaran (pie chart).
- 🔄 Manajemen Transaksi
Lihat dan filter seluruh riwayat transaksi yang tercatat oleh pengguna bot.
- 🗂️ Manajemen Kategori (CRUD)
Tambah, lihat, edit, dan hapus kategori pemasukan (INCOME) dan pengeluaran (EXPENSE) langsung dari dashboard.
- 👥 Manajemen Pengguna
Lihat daftar pengguna bot, atur pengguna default untuk filter, dan hapus pengguna beserta data terkaitnya (khusus admin).
- 📜 Log Aktivitas
Pantau interaksi pengguna dengan bot secara real-time untuk keperluan debugging atau monitoring.
- 🔍 Filter Data Dinamis
Filter data pada dashboard, transaksi, dan log berdasarkan pengguna dan periode waktu (hari ini, minggu ini, bulan ini, tahun ini).
- 📱 Desain Responsif
Tampilan yang dioptimalkan untuk kenyamanan penggunaan di desktop maupun perangkat mobile.
- 🚀 Ringan dan Cepat
Dibuat dengan HTML, CSS, dan JavaScript murni untuk performa maksimal tanpa framework yang berat.
- 🌐 **Mudah Dihosting**  
  Dapat di-deploy di hosting statis atau VPS (dengan Nginx).

---

## 🏗️ Struktur Proyek
Proyek ini memiliki struktur file yang modular untuk kemudahan pengelolaan:
```
/
├── index.html
├── style.css
├── js/
│   ├── app.js         # Logika utama, routing, dan otentikasi
│   ├── config.js      # Konfigurasi koneksi Supabase
│   ├── dashboard.js   # Logika untuk halaman dashboard (KPI & Chart)
│   ├── transaksi.js   # Logika untuk halaman manajemen transaksi
│   ├── kategori.js    # Logika CRUD untuk manajemen kategori
│   └── pengguna.js    # Logika untuk halaman manajemen pengguna

```

## 🚀 Panduan Instalasi & Deployment (AlmaLinux + Nginx)

### 🔧 Prasyarat

1. **Bot DuitQ aktif**, dengan tabel `log_aktivitas` yang sudah berisi data.
2. **Akun admin Supabase** (via Dashboard > Authentication).
3. **VPS dengan AlmaLinux** dan akses root/sudo.
4. (Opsional) **Domain** yang diarahkan ke IP VPS untuk HTTPS.

---

### 🔹 Langkah 1: Persiapan Nginx

```bash
# Update sistem & instal Nginx
sudo dnf update -y
sudo dnf install nginx -y

# Jalankan & aktifkan Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Buka akses HTTP & HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

### 🔹 Langkah 2: Kloning atau Upload Proyek

```bash
# Masuk ke direktori Nginx
cd /usr/share/nginx/html

# Kloning repositori (ganti dengan milik Anda)
sudo git clone https://github.com/your-username/cashflow-web.git

# Jika tidak pakai git, upload folder 'cashflow-web' via SCP ke direktori ini
```

---

### 🔹 Langkah 3: Konfigurasi `app.js`

```bash
# Edit file app.js
sudo nano /usr/share/nginx/html/cashflow-web/app.js
```

Ganti baris berikut:

```javascript
// GANTI DENGAN KREDENSIAL ANDA
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'your-public-anon-key-here'; // Gunakan Public ANON Key, bukan Service Role
```

---

### 🔹 Langkah 4: Set Izin & SELinux

```bash
# Install utilitas SELinux (jika belum)
sudo dnf install policycoreutils-python-utils -y

# Atur konteks keamanan
sudo semanage fcontext -a -t httpd_sys_content_t "/usr/share/nginx/html/cashflow-web(/.*)?"
sudo restorecon -Rv /usr/share/nginx/html/cashflow-web

# Set permission agar dapat dibaca oleh Nginx
sudo chmod -R 755 /usr/share/nginx/html/cashflow-web
```

---

### 🔹 Langkah 5: Akses Log Viewer

Akses melalui:

```
http://<IP_VPS_ANDA>/cashflow-web
```

Login menggunakan akun Supabase Anda.

---

### 🔐 (Opsional) Setup Domain + HTTPS

**Langkah 1: Konfigurasi Nginx**

```bash
sudo nano /etc/nginx/conf.d/log.domainanda.com.conf
```

Isi:

```nginx
server {
    listen 80;
    server_name log.domainanda.com;

    root /usr/share/nginx/html/cashflow-web;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Langkah 2: Install & Jalankan Certbot**

```bash
sudo dnf install certbot python3-certbot-nginx -y
sudo certbot --nginx -d log.domainanda.com
```

Pilih opsi redirect (HTTPS otomatis), lalu:

```bash
sudo systemctl restart nginx
```

---

## 📬 Kontak

Untuk pertanyaan atau kontribusi, silakan buat *issue* atau *pull request* di [GitHub Repo](https://github.com/fahroediin/whatsapp-cashflow-bot).
