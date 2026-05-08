import { Input, message } from "antd";
import AdminTable from "../../../components/AdminTable";
import { useAdminChangeRegionEmployee, useAdminChangeRoleEmployee, useAdminChangeStatusEmployee, useAdminGetAllEmployee, useAdminResetPasswordEmployee, } from "../../../services/adminService";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminEmployeePage = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [isActive, setIsActive] = useState(searchParams.get('is_active') || undefined);
    const [roles, setRoles] = useState<string[]>(searchParams.get('roles')?.split(",").filter(Boolean) || []);
    const [regions, setRegions] = useState(searchParams.get('regions')?.split(",").filter(Boolean) || []);
    const [sortOrderCreate, setSortOrderCreate] = useState(searchParams.get('create_at') || undefined);
    const [sortOrderUpdate, setSortOrderUpdate] = useState(searchParams.get('update_at') || undefined);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            limit,
            page,
            search: searchText || undefined,
            is_active: isActive,
            roles: roles.length > 0 ? roles.join(",") : undefined,
            regions: regions.length > 0 ? regions.join(",") : undefined,
            created_at: sortOrderCreate,
            updated_at: sortOrderUpdate
        };
    }, [limit, page, searchText, isActive, roles, sortOrderCreate, sortOrderUpdate, regions]);

    // call api
    const getAllEmployeeApi = useAdminGetAllEmployee(params);
    const changeStatusEmployeeApi = useAdminChangeStatusEmployee();
    const changeRoleEmployeeApi = useAdminChangeRoleEmployee();
    const resetPasswordEmployeeApi = useAdminResetPasswordEmployee();
    const changeRegionEmployeeApi = useAdminChangeRegionEmployee();

    // params table
    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setIsActive(filters.is_active?.[0] ?? undefined)
        setRoles(filters.role as string[] || []);
        setRegions(filters.region as string[] || []);
        const sortField = sorter?.field;
        if (sortField === 'createdAt') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderCreate(sortOrder);
            setSortOrderUpdate(undefined);
        } else if (sortField === 'updatedAt') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderUpdate(sortOrder);
            setSortOrderCreate(undefined);
        } else {
            setSortOrderCreate(undefined);
            setSortOrderUpdate(undefined);
        }
        updateParams({
            limit,
            page: pagination.current,
            is_active: filters.is_active?.[0] ?? undefined,
            roles:  filters.role?.length > 0 ? filters.role.join(",") : undefined,
            regions: filters.region?.length > 0 ? filters.region.join(",") : undefined,
            created_at: sortField === 'createdAt' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            updated_at: sortField === 'updatedAt' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
        })
    };

    const handleChangeStatusAdmin = async (adminId: number, isActive: boolean) => {
        try {
            await changeStatusEmployeeApi.mutateAsync({ id:adminId, is_active: !isActive });
            message.success('Cập nhật thành công.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    }
    const handleChangeRoleAdmin = async (adminId: number, role: string) => {
        try {
            await changeRoleEmployeeApi.mutateAsync({ id: adminId, role });
            message.success('Cập nhật thành công.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi cập nhật");
        }

    }
    const handleResetAdminPassword = async (adminId: number, newPassword: string) => {
        try {
            await resetPasswordEmployeeApi.mutateAsync({ id: adminId, password: newPassword });
            message.success('Cập nhật thành công.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    }
    const handleChangeRegionAdmin = async (adminId: number, region: string) => {
        try {
            await changeRegionEmployeeApi.mutateAsync({ admin_id: adminId, region: region });
            message.success('Cập nhật thành công.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi cập nhật");
        }

    }

    return (
        <div className="p-4 sm:p-5 bg-white rounded-lg shadow space-y-4">
            <Input.Search placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onSearch={() => {
                    setSearchText(inputValue);
                    updateParams({
                        search: inputValue || undefined,
                    });
                }}
                loading={getAllEmployeeApi.isLoading}
                enterButton />
            <AdminTable admins={getAllEmployeeApi.data?.data || []}
                handleChangeStatusAdmin={handleChangeStatusAdmin}
                handleChangeRoleAdmin={handleChangeRoleAdmin}
                handleResetPassword={handleResetAdminPassword}
                handleChangeRegionAdmin={handleChangeRegionAdmin}
                pagination={{
                    page: page,
                    pageSize: limit,
                    total: getAllEmployeeApi.data?.pagination?.total || 0
                }}
                onTableChange={handleTableChange}
            />
        </div>
    );
};

export default AdminEmployeePage;
