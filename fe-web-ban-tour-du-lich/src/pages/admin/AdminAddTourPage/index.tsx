import { message, Typography } from "antd";
import FormTour from "../../../components/FormTour"
import { useAdminCreateTour, useAdminGetCategory } from "../../../services/adminService";
import { useNavigate } from "react-router-dom";
import { queryClient } from "../../../configs/queryClient";

const AdminAddTourPage: React.FC = () => {
    const navigate = useNavigate();
    // call api
    const adminCreateTourApi = useAdminCreateTour();
    const adminGetCategoryApi = useAdminGetCategory();

    const handleCreateTour = async(payload) => {
        try {
            await adminCreateTourApi.mutateAsync(payload);
            message.success("Tạo mới tour thành công.");
            queryClient.invalidateQueries({ queryKey: ["adminTours"], exact: false });
            navigate("/admin/tours", { replace: true });    
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
             message.error(error?.response?.data?.message || "Lỗi tạo mới tour.")
        }
    }
    return (
        <div className="p-4 bg-white rounded-lg shadow-sm space-y-4">
            <Typography.Title level={4}>Thêm mới tour</Typography.Title>
            <FormTour type="add" categories={adminGetCategoryApi.data?.data} onSubmit={handleCreateTour} loading={adminCreateTourApi.isPending}/>
        </div>
    )
}
export default AdminAddTourPage;