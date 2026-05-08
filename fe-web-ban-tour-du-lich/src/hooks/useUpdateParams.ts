/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSearchParams } from "react-router-dom";

export function useUpdateParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Cập nhật một vài params (giữ param cũ)
   */
  const updateParams = (newParams: Record<string, any>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key); // Xóa param rỗng
        } else {
          params.set(key, value); // Thêm mới hoặc ghi đè
        }
      });

      return params;
    });
  };

  /**
   * Set lại toàn bộ query string bằng 1 chuỗi mới
   * (override hoàn toàn, không giữ param cũ)
   *
   * @example setParamsString("page=1&sort=price")
   * @example setParamsString("") → xóa sạch params
   */
  const setParams = (newParams: Record<string, any>) => {
    const params = new URLSearchParams();

    Object.entries(newParams).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return;
      }

      params.set(key, String(value));
    });

    setSearchParams(params);
  };

  return { searchParams, updateParams, setParams };
}
