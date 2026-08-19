# 🚀 HƯỚNG DẪN DEPLOY HỆ THỐNG e-Office DMS LÊN SERVER

Tài liệu này hướng dẫn chi tiết các cách triển khai hệ thống **e-Office DMS (Next.js 15 + Prisma + MySQL)** lên máy chủ Linux (Ubuntu 22.04 / 24.04 LTS), Windows Server hoặc môi trường Docker.

---

## 🛠️ CÁCH 1: DEPLOY TRỰC TIẾP TRÊN LINUX VPS (PM2 + NGINX + MYSQL) — Khuyến nghị

Đây là cách triển khai chuẩn doanh nghiệp, cho hiệu năng cao nhất và dễ dàng cài đặt chứng chỉ bảo mật SSL (HTTPS miễn phí).

### Bước 1: Cài đặt môi trường trên VPS (Ubuntu)
Đăng nhập vào VPS qua SSH (`ssh root@ip_server`) và chạy các lệnh:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 3. Cài đặt PM2 để quản lý tiến trình nền
sudo npm install -g pm2

# 4. Cài đặt MySQL Server (nếu chưa có)
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

### Bước 2: Tạo Database & User trên MySQL
Vào MySQL:
```bash
sudo mysql
```

Chạy các lệnh SQL sau:
```sql
CREATE DATABASE quanlyvanban CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eoffice_user'@'localhost' IDENTIFIED BY 'MatKhauManh@2026';
GRANT ALL PRIVILEGES ON quanlyvanban.* TO 'eoffice_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Bước 3: Clone Code & Cấu hình môi trường

```bash
# Clone repository
cd /var/www
sudo git clone git@github.com:truongthehoc/quanlyvanban.git
cd quanlyvanban

# Phân quyền thư mục
sudo chown -R $USER:$USER /var/www/quanlyvanban

# Tạo file .env
nano .env
```

Nội dung file `.env`:
```env
DATABASE_URL="mysql://eoffice_user:MatKhauManh@2026@localhost:3306/quanlyvanban"
NODE_ENV="production"
PORT=3000
```
*(Bấm `Ctrl + O` -> `Enter` để lưu, `Ctrl + X` để thoát)*.

---

### Bước 4: Cài đặt Dependencies, Sync Database & Build

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo bảng và cấu trúc cơ sở dữ liệu
npx prisma generate
npx prisma db push

# 3. Nạp dữ liệu mẫu ban đầu (phân quyền, cơ quan, phòng ban, tài khoản)
node prisma/seed.js
node prisma/seed-orgs.js
node prisma/add-mock.js

# 4. Build phiên bản Production tối ưu
npm run build
```

---

### Bước 5: Khởi chạy hệ thống bằng PM2 Cluster

```bash
# Khởi chạy bằng file cấu hình ecosystem.config.js đã có sẵn trong source code:
pm2 start ecosystem.config.js

# Lưu trạng thái để tự động bật lại khi server restart/reboot:
pm2 save
pm2 startup
```

---

### Bước 6: Cấu hình Nginx Reverse Proxy & Tên miền (Domain)

Tạo file cấu hình Nginx:
```bash
sudo nano /etc/nginx/sites-available/quanlyvanban
```

Dán nội dung cấu hình sau (thay `your-domain.com` bằng tên miền hoặc IP server của bạn):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt cấu hình và khởi động lại Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/quanlyvanban /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Bước 7: Cài đặt SSL (HTTPS) miễn phí qua Let's Encrypt Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

🎉 **Hoàn tất!** Giờ bạn có thể truy cập `https://your-domain.com` bảo mật tuyệt đối.

---

## 🐳 CÁCH 2: DEPLOY BẰNG DOCKER & DOCKER COMPOSE (Nhanh nhất)

Nếu máy chủ của bạn đã có cài đặt Docker & Docker Compose:

1. **Clone mã nguồn**:
   ```bash
   git clone git@github.com:truongthehoc/quanlyvanban.git
   cd quanlyvanban
   ```

2. **Chạy toàn bộ hệ sinh thái (MySQL + App)** chỉ bằng 1 lệnh duy nhất:
   ```bash
   docker compose up -d --build
   ```

3. **Kiểm tra trạng thái container**:
   ```bash
   docker compose ps
   ```

Hệ thống sẽ tự động chạy tại cổng `http://IP_SERVER:3000` với database MySQL tự động tạo volume lưu trữ dữ liệu an toàn.

---

## 🔄 CẬP NHẬT MÃ NGUỒN MỚI (Update/Deploy Code mới sau này)

Mỗi khi bạn commit code mới lên GitHub, trên Server bạn chỉ cần chạy:

```bash
cd /var/www/quanlyvanban
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 reload e-office-dms
```
*(Hệ thống sẽ reload mượt mà không có thời gian chết - Zero-downtime deployment)*.
