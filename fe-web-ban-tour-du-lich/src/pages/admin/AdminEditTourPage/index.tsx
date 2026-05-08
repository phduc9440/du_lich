import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormTour from "../../../components/FormTour";
import { message, Skeleton, Typography } from "antd";
import dayjs from "dayjs";
import { useAdminGetCategory, useAdminGetDetailTour, useAdminUpdateTour } from "../../../services/adminService";

const AdminEditTourPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // call api
    const adminGetDetailTourApi = useAdminGetDetailTour(Number(id));
    const adminGetCategoryApi = useAdminGetCategory();
    const adminUpdateTourApi = useAdminUpdateTour();

    const formInitialValues = adminGetDetailTourApi.data?.data
        ? {
            ...adminGetDetailTourApi.data?.data,
            price: Number(adminGetDetailTourApi.data?.data?.price),
            categories: adminGetDetailTourApi.data?.data?.categories
                ? adminGetDetailTourApi.data?.data?.categories?.map(cat => cat.id)
                : [],
            gallery:adminGetDetailTourApi.data?.data?.gallery
                ? adminGetDetailTourApi.data?.data?.gallery?.map(img => {return {image_url: img?.image_url}})
                : [],
            start_date: adminGetDetailTourApi.data?.data.start_date ? dayjs(adminGetDetailTourApi.data?.data.start_date) : undefined,
            end_date: adminGetDetailTourApi.data?.data.end_date ? dayjs(adminGetDetailTourApi.data?.data.end_date) : undefined,
        }
        : {};
    const handleUpdateTour = async (payload) => {  
        try {
            await adminUpdateTourApi.mutateAsync({ id: Number(id), payload});
            message.success('Cập nhật tour thành công.');
            navigate("/admin/tours")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
            message.error(error?.response?.data?.message || "Lỗi cập nhật tour.")
        }
    }
    return (
        <div className="p-4 bg-white rounded-lg shadow-sm space-y-4">
            <Typography.Title level={4}>Mã tour: {adminGetDetailTourApi.data?.data?.tour_code}</Typography.Title>
            {adminGetDetailTourApi.isLoading ? <Skeleton /> : (
                <FormTour
                    type="edit"
                    initialValues={formInitialValues}
                    categories={adminGetCategoryApi.data?.data}
                    onSubmit={handleUpdateTour}
                    loading={adminUpdateTourApi.isPending}
                />
            )}
        </div>
    );
}

export default AdminEditTourPage;