import { Input, message, } from "antd";
import UserTable from "../../../components/UserTable";
import { useAdminChangeStatusUser, useAdminGetAllUser } from "../../../services/adminService";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";


const AdminUserPage = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [isActive, setIsActive] = useState(searchParams.get('is_active') || undefined);
    const [sortOrderCreate, setSortOrderCreate] = useState(searchParams.get('create_at') || undefined);
    const [sortOrderUpdate, setSortOrderUpdate] = useState(searchParams.get('update_at') || undefined);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            limit,
            page,
            search: searchText || undefined,
            is_active: isActive,
            created_at: sortOrderCreate,
            updated_at: sortOrderUpdate
        };
    }, [limit, page, searchText, isActive, sortOrderCreate, sortOrderUpdate]);

    // call api
    const getAllUserApi = useAdminGetAllUser(params);
    const changeUserStatusApi = useAdminChangeStatusUser();

    // params table
    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setIsActive(filters.is_active?.[0] ?? undefined)
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
            created_at: sortField === 'createdAt' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            updated_at: sortField === 'updatedAt' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,

        })
    };

    const handleChangeStatusUser = async (userId: number, is_active: boolean) => {
        try {
            await changeUserStatusApi.mutateAsync({ userId, is_active });
            message.success('Cập nhật thành công.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi cập nhật");
        }
    };
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
                loading={getAllUserApi.isLoading}
                enterButton />
            <UserTable users={getAllUserApi.data?.data || []}
                pagination={{
                    page: page,
                    pageSize: limit,
                    total: getAllUserApi.data?.pagination?.total || 0
                }}
                handleChangeStatusUser={handleChangeStatusUser}
                onTableChange={handleTableChange}
            />
        </div>
    );
};

export default AdminUserPage;
