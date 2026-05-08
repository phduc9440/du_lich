# 🏝️ Travel Tour Booking Website

Một ứng dụng web **bán tour du lịch** được xây dựng bằng **React** giúp người dùng tìm kiếm, đặt tour, xem chi tiết tour và quản lý đơn hàng.
Dự án sử dụng **Ant Design** cho giao diện, **Redux Toolkit** để quản lý trạng thái, **React Router** cho định tuyến, cùng nhiều thư viện hỗ trợ khác.

---

## 🚀 Công nghệ sử dụng

### 🧩 Core Framework

* **React (v18.2.0)**: Thư viện chính để xây dựng giao diện người dùng dạng component.
* **React DOM (v18.2.0)**: Giúp React render component lên trình duyệt.

### 💅 UI & UX

* **Ant Design (v5.27.4)**: Bộ UI framework hiện đại, giúp xây dựng giao diện quản trị và người dùng chuyên nghiệp.
* **@ant-design/icons (v5.6.1)**: Bộ icon đi kèm với Ant Design.

### 🔁 Quản lý trạng thái

* **@reduxjs/toolkit (v2.9.0)**: Giải pháp chính để quản lý state toàn cục, giảm boilerplate so với Redux truyền thống.
* **React Redux (v9.2.0)**: Cầu nối giữa Redux và React, cho phép component truy cập state và dispatch action.
* **Redux Persist (v6.0.0)**: Lưu trữ dữ liệu Redux vào localStorage, giúp không mất dữ liệu khi reload trang (ví dụ: thông tin đăng nhập hoặc giỏ hàng).

### 🌐 Điều hướng

* **React Router DOM (v7.9.1)**: Quản lý hệ thống route (điều hướng giữa các trang như Trang chủ, Danh sách tour, Chi tiết tour, Giỏ hàng, Thanh toán...).

### 🎠 Trình bày & Hiệu ứng

* **Swiper (v12.0.2)**: Dùng để tạo **carousel** (trình chiếu tour nổi bật, hình ảnh tour hoặc đánh giá khách hàng) với hiệu ứng mượt mà, responsive.

### ✅ Xác thực & Kiểm tra dữ liệu

* **Zod (v4.1.9)**: Thư viện để **validate dữ liệu** (ví dụ: form đặt tour, đăng ký, đăng nhập), đảm bảo dữ liệu nhập vào hợp lệ trước khi gửi đến backend.

---

## 📂 Cấu trúc dự án (gợi ý)

```
src/
├── assets/             # Hình ảnh, icon, logo, v.v.
├── components/         # Các component tái sử dụng
├── features/           # Các module quản lý state 
├── pages/              # Các trang chính 
├── routes/             # Cấu hình route với react-router-dom
├── services/           # API call (axios)
├── store/              # Cấu hình Redux store
├── types/              # Các type và schema zod
├── utils/              # Các hàm trợ giúp tái sử dụng
├── App.tsx             # Component gốc
└── main.tsx            # Entry point chính
```

---

## 🧠 Chức năng chính

* 🏖️ **Xem danh sách tour**: Lọc theo địa điểm, giá, thời gian.
* 🔍 **Tìm kiếm tour**: Theo tên hoặc điểm đến.
* 📄 **Chi tiết tour**: Hiển thị thông tin, hình ảnh, đánh giá.
* 🛒 **Đặt tour / Giỏ hàng**: Thêm, xóa, thanh toán tour.
* 👤 **Đăng nhập / Đăng ký / Hồ sơ cá nhân**.
* 💾 **Lưu trạng thái phiên đăng nhập** bằng Redux Persist.
* 🎡 **Giao diện thân thiện**, hiệu ứng mượt mà với Swiper và Ant Design.

---

## ⚙️ Cài đặt và chạy dự án

### 1️⃣ Cài đặt dependencies

```bash
npm install
```

### 2️⃣ Chạy dự án trong môi trường development

```bash
npm run dev
```

### 3️⃣ Build production

```bash
npm run build
```

---
### env
VITE_GOOGLE_CLIENT_ID=701453233259-eoqpgfc81ddd2bmqba9ld3nttmfek8m1.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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
VITE_URL_SERVER=http://localhost:5000
VITE_BASE_API_URL=http://localhost:5000/api

