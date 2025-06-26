# DuitQ - Web Log Viewer

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Frontend_Integration-green?style=for-the-badge&logo=supabase)

DuitQ - Web Log Viewer adalah antarmuka web statis yang sederhana dan aman untuk menampilkan log aktivitas dari [DuitQ WhatsApp Bot](https://github.com/fahroediin/whatsapp-cashflow-bot). Halaman ini menampilkan data dari Supabase dalam format tabel yang mudah dibaca.

---

## ✨ Fitur

- 🔒 **Halaman Login Aman**  
  Akses dilindungi oleh sistem autentikasi Supabase.
- 📈 **Tampilan Log Real-time**  
  Memantau interaksi pengguna dengan bot secara langsung.
- 📱 **Desain Responsif**  
  Tampilan optimal untuk desktop maupun perangkat mobile.
- 🚀 **Ringan dan Cepat**  
  Dibuat dengan HTML, CSS, dan JavaScript murni (tanpa framework).
- 🌐 **Mudah Dihosting**  
  Dapat di-deploy di hosting statis atau VPS (dengan Nginx).

---

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
