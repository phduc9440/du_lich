import React, { useMemo, useState } from "react";
import { Card, Input, message } from "antd";
import CouponTable from "../../../components/CouponTable";
import type { UpsertCoupon } from "../../../types/coupon";
import { useAdminCreateCoupon, useAdminDeleteCoupon, useAdminGetCoupons, useAdminUpdateCoupon } from "../../../services/adminService";
import { useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminCouponPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
  const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
  const [inputValue, setInputValue] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const { updateParams } = useUpdateParams();
  const params = useMemo(() => {
    return {
      page,
      limit,
      search: searchText || undefined,
    }
  }, [limit, page, searchText])
  // call api
  const adminGetCouponsApi = useAdminGetCoupons(params);
  const adminCreateCouponApi = useAdminCreateCoupon();
  const adminUpdateCouponApi = useAdminUpdateCoupon();
  const adminDeleteCouponApi = useAdminDeleteCoupon();
  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    updateParams({
      limit,
      page: pagination.current,
    })
  };
  const handleCreate = async(payload: UpsertCoupon) => {
    try {
      await adminCreateCouponApi.mutateAsync(payload);
      message.success("Tạo mã giảm giá thành công.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response?.data?.message || "Lỗi tạo mới mã giảm giá.");
    }
  };
  const handleUpdate = async(id: number, payload: UpsertCoupon) => {
    try {
      await adminUpdateCouponApi.mutateAsync({id, payload});
      message.success("Cập nhật mã giảm giá thành công.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response?.data?.message || "Lỗi cập nhật mã giảm giá.");
    }
  };
  const handleDelete = async(id: number) => {
    try {
      await adminDeleteCouponApi.mutateAsync(id);
      message.success("Xóa mã giảm giá thành công.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response?.data?.message || "Lỗi xóa mã giảm giá.");
    }
  }
  return (
    <>
      <Input.Search placeholder="Tìm kiếm theo mã giảm giá..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={() => {
          setSearchText(inputValue);
          setPage(1);
          updateParams({
            search: inputValue || undefined,
            page: 1,
          });
        }}
        enterButton
        loading={adminGetCouponsApi.isLoading}
      />
      <Card className="bg-white">
        <CouponTable data={adminGetCouponsApi.data?.data} onCreate={handleCreate} onUpdate={handleUpdate} onDelete={handleDelete}
          pagination={{
            page: page,
            pageSize: limit,
            total: adminGetCouponsApi.data?.pagination?.total,
          }}
          onTableChange={handleTableChange}
        />
      </Card>
    </>
  );
};

export default AdminCouponPage;


