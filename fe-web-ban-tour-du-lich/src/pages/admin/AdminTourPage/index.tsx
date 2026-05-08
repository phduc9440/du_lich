import { PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, Input, message, Skeleton, Space, Typography } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import TourTable from "../../../components/TourTable";
import { useMemo, useState } from "react";
import { useAdminGetCategory, useAdminGetTours, useAdminHardDeleteTour } from "../../../services/adminService";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminTourPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [isActive, setIsActive] = useState(searchParams.get('is_active') || undefined);
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [tourTypes, setTourTypes] = useState<string[]>(
        searchParams.get("category_ids")?.split(",").filter(Boolean) || []
    );
    const [regions, setRegions] = useState(searchParams.get('regions')?.split(",").filter(Boolean) || []);
    const [sortOrderPrice, setSortOrderPrice] = useState(searchParams.get('price') || undefined);
    const [sortOrderStartDate, setSortOrderStartDate] = useState(searchParams.get('start_date') || undefined);
    const [sortOrderEndDate, setSortOrderEndDate] = useState(searchParams.get('end_date') || undefined);
    const { updateParams } = useUpdateParams()
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
            is_active: isActive,
            category_ids: tourTypes.length > 0 ? tourTypes.join(",") : undefined,
            regions: regions.length > 0 ? regions.join(",") : undefined,
            start_date: sortOrderStartDate,
            end_date: sortOrderEndDate,
            price: sortOrderPrice
        }
    }, [isActive, limit, page, regions, searchText, sortOrderPrice, sortOrderStartDate, sortOrderEndDate, tourTypes])
    // call api
    const adminGetToursApi = useAdminGetTours(params);
    const adminGetCategoryApi = useAdminGetCategory();
    const adminHardDeleteTourApi = useAdminHardDeleteTour();

    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setIsActive(filters.is_active?.[0] ?? undefined)
        setRegions(filters.region as string[] || []);
        const sortField = sorter?.field;
        if (sortField === 'price') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderPrice(sortOrder);
            setSortOrderStartDate(undefined);
            setSortOrderEndDate(undefined);
        } else if (sortField === 'start_date') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderStartDate(sortOrder);
            setSortOrderPrice(undefined);
            setSortOrderEndDate(undefined);
        } else if (sortField === 'end_date') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderEndDate(sortOrder);
            setSortOrderPrice(undefined);
            setSortOrderStartDate(undefined);
        } else {
            setSortOrderPrice(undefined);
            setSortOrderStartDate(undefined);
            setSortOrderEndDate(undefined);
        }
        updateParams({
            limit,
            page: pagination.current,
            is_active: filters.is_active?.[0] ?? undefined,
            regions:  filters.region?.length > 0 ? filters.region.join(",") : undefined,
            price: sortField === 'price' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            start_date: sortField === 'start_date' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            end_date: sortField === 'end_date' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
        })
    };
    const handleDeleteTour = async (tourId) => {
        try {
            await adminHardDeleteTourApi.mutateAsync(tourId);
            message.success("Xóa tour thành công.")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            message.error(error?.response?.data?.message);
        }

    }

    return (
        <>
            <div className="p-4 sm:p-5 bg-white space-y-4 rounded-lg shadow-sm">
                <Flex justify="space-between" align="center" wrap gap={12}>
                    <Space size={"middle"} align="center" wrap>
                        <Typography.Title level={3} className="!m-0">Tổng số</Typography.Title>
                        <Button variant="solid" color="primary" icon={<PlusOutlined />} onClick={() => navigate('add')} className="rounded-2xl">Thêm tour mới</Button>
                    </Space>
                </Flex>
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
                    loading={adminGetToursApi.isLoading}
                 />
                {
                    adminGetCategoryApi.isLoading ? (<Skeleton/>) : (
                        <Checkbox.Group
                            value={tourTypes}
                            onChange={(checked) => {
                                const newTourTypes = checked as string[];
                                setTourTypes(newTourTypes);
                                updateParams({
                                    category_ids: newTourTypes.length > 0 ? newTourTypes.join(",") : undefined,
                                });
                            }}
                        >
                            {adminGetCategoryApi.data?.data.map((category) => (
                                <Checkbox key={category.id} value={category.id}>
                                    {category.category}
                                </Checkbox>
                            ))}
                        </Checkbox.Group>

                    )
                }
                <TourTable tours={adminGetToursApi.data?.data} pagination={{
                    page: page,
                    pageSize: limit,
                    total: adminGetToursApi.data?.pagination?.total,
                }}
                    onTableChange={handleTableChange}
                    handleDeleteTour={handleDeleteTour}
                />
            </div>
        </>
    );
}

export default AdminTourPage;