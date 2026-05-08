/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, } from "react";
import SupportTable from "../../../components/SupportTable";
import { Input, message, Modal, Typography } from "antd";
import { useCancellFeedback, useGetFeedbacks } from "../../../services/supportService";
import { useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminSupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const { updateParams } = useUpdateParams();
  const params = useMemo(() => ({
    page: 1,
    limit: 20,
    search: searchText
  }), [searchText]);
  // call api
  const adminGetFeedbacksApi = useGetFeedbacks(params);
  const adminCancelFeedbackApi = useCancellFeedback();

  const handleChangeStatus = async (id: number,) => {
    try {
      await adminCancelFeedbackApi.mutateAsync(id);
      message.success("Đã đóng yêu cầu hỗ trợ thành công!");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleViewDetail = (support) => {
    Modal.info({
      title: support.title || "Chi tiết yêu cầu hỗ trợ",
      content: (
        <>
          <p><strong>Người dùng:</strong> #{support.user_id}</p>
          <p><strong>Tiêu đề:</strong> {support.title}</p>
          <p><strong>Nội dung:</strong></p>
          <p>{support.message || "(Không có nội dung)"}</p>
        </>
      ),
      width: 600,
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <Typography.Title level={4}>Phản hồi từ người dùng</Typography.Title>
      <Input.Search placeholder="Tìm kiếm theo tên hoặc mã tour..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={() => {
          setSearchText(inputValue);
          updateParams({
            search: inputValue || undefined,
          });
        }}
        enterButton
        loading={adminGetFeedbacksApi.isLoading}
      />
      <SupportTable
        supports={adminGetFeedbacksApi.data?.data || []}
        handleChangeStatus={handleChangeStatus}
        handleViewDetail={handleViewDetail}
      />
    </div>
  );
};

export default AdminSupportPage;
