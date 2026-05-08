import { Input, message, Skeleton } from "antd";
import CategoryTable from "../../../components/CategoryTable";
import { useAdminCreateCategory, useAdminDeleteCategory, useAdminGetCategory, useAdminUpdateCategory } from "../../../services/adminService";

const AdminCategoryPage: React.FC = () => {
  // call api
  const adminGetCategoryApi = useAdminGetCategory();
  const adminCreateCategoryApi = useAdminCreateCategory();
  const adminUpdateCategoryApi = useAdminUpdateCategory();
  const adminDeleteCategoryApi = useAdminDeleteCategory();

  const handleAddCategory = async(category: { category: string; description?: string }) => {
    try {
      await adminCreateCategoryApi.mutateAsync(category);
      message.success('Tạo mới danh mục thành công.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response.data.message || 'Lỗi tạo mới danh mục.')
    }
  };

  const handleUpdateCategory = async(id: number, updated: { category: string; description?: string }) => {
    try {
      await adminUpdateCategoryApi.mutateAsync({id, payload: updated});
      message.success('Cập nhật danh mục thành công.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response.data.message || 'Lỗi cập nhật danh mục.')
    }
  };

  const handleDeleteCategory = async(id: number) => {
    try {
      await adminDeleteCategoryApi.mutateAsync(id);
      message.success('Xóa danh mục thành công.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      message.error(error.response.data.message || 'Lỗi Xóa danh mục.')
    }
  };
  if (adminGetCategoryApi.isLoading) {
    return (<Skeleton />)
  }
  return (
  <>
    <Input.Search placeholder="Nhập tên danh mục..." enterButton/>
    <CategoryTable categories={adminGetCategoryApi.data?.data || []}
      pagination={{pageSize:5, total: adminGetCategoryApi.data?.data?.length || 0}}
      handleAddCategory={handleAddCategory}
      handleUpdateCategory={handleUpdateCategory}
      handleDeleteCategory={handleDeleteCategory} />
  </>
  );
};

export default AdminCategoryPage;
