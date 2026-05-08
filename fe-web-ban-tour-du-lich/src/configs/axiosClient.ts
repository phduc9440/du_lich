import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * axiosClient:
 *  - Dùng để gọi API bình thường
 *  - Tự động gửi cookies (withCredentials)
 */
const axiosClient = axios.create({
  // Vite env variable → luôn dùng prefix VITE_
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Gửi cookie kèm mỗi request
});

/**
 * rawAxios:
 *  - Dùng để gọi refresh token hoặc logout
 *  - Tách riêng để tránh interceptor loop
 */
const rawAxios = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Cờ đánh dấu xem có đang thực hiện refresh token không
let isRefreshing = false;

// Danh sách request đang chờ refresh token hoàn thành
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}[] = [];

/**
 * Xử lý queue khi refresh thất bại → reject toàn bộ request đang chờ
 */
const processQueue = (error: unknown) => {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
};

/**
 * Logout:
 *  - Gọi API logout
 *  - Clear storage
 *  - Redirect về login
 */
const handleLogout = async () => {
  try {
    await rawAxios.post("/auth/logout");
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.location.replace("/login"); // quay lại trang login
  }
};

/**
 * Response Interceptor
 *  - Bắt lỗi 401
 *  - Tự động refresh token
 *  - Retry request sau khi refresh
 */
axiosClient.interceptors.response.use(
  (response) => response, // trả về response nếu OK
  async (error: AxiosError) => {
    // Lấy request ban đầu
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Nếu bị 401 và chưa retry trước đó
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/login")) {

      // Nếu đang refresh → push request vào hàng đợi, đợi refresh xong
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      // Đánh dấu để tránh lặp
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token
        const refreshRes = await rawAxios.post("/auth/refresh-token");

        // Lấy access token từ response (nếu có) và chỉ lưu vào localStorage
        const newAccessToken = refreshRes?.data?.data?.accessToken;
        if (newAccessToken) {
          try {
            localStorage.setItem('accessToken', newAccessToken);
          } catch {
            // ignore localStorage errors
          }
        }

        // Refresh thành công
        isRefreshing = false;

        // Gọi lại các request trong queue
        failedQueue.forEach(({ resolve }) => resolve(axiosClient(originalRequest)));
        failedQueue = [];

        // Retry request ban đầu
        return axiosClient(originalRequest);
      } catch (err) {
        // Refresh thất bại → logout
        isRefreshing = false;
        processQueue(err);
        await handleLogout();
        return Promise.reject(err);
      }
    }

    // Nếu không phải lỗi 401 → return error như bình thường
    return Promise.reject(error);
  }
);

export default axiosClient;
