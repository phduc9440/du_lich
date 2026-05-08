import axios from "axios";

// Khởi tạo base URL và headers mặc định nếu muốn
const axiosBase = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
export default axiosBase;