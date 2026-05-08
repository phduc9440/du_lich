import { Button, Input, Modal, Table, Tag, Tooltip } from "antd";
import { useAdminGetGuideForTourUpcoming, useAdminGetTourUpcoming } from "../../../services/adminService";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useUpdateParams } from "../../../hooks/useUpdateParams";

const AdminViewAssignedGuidePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [regions, setRegions] = useState(searchParams.get('regions')?.split(",").filter(Boolean) || []);
    const [sortOrderStartDate, setSortOrderStartDate] = useState(searchParams.get('start_date') || undefined);
    const [sortOrderEndDate, setSortOrderEndDate] = useState(searchParams.get('end_date') || undefined);
    const [openModal, setOpenModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState<{
        id: number;
        start_date: string;
        end_date: string;
    } | null>(null);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
            regions: regions.length > 0 ? regions.join(",") : undefined,
            start_date: sortOrderStartDate,
            end_date: sortOrderEndDate
        }
    }, [limit, page, regions, searchText, sortOrderEndDate, sortOrderStartDate])
    // call api
    const listTourUpcomingApi = useAdminGetTourUpcoming(params);
    const getGuideForTourUpcomingApi = useAdminGetGuideForTourUpcoming(
        selectedTour?.id || 0,
        selectedTour?.start_date || "",
        selectedTour?.end_date || ""
    );

    const columnsTour = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Tên tour', dataIndex: 'title', key: 'title' },
        { title: 'Mã tour', dataIndex: 'tour_code', key: 'tour_code' },
        {
            title: 'Vùng', dataIndex: 'region', key: 'region',
            render: (_, record) => (
                <>
                    {record.region === 'northern' && <Tooltip title="Miền Bắc"><Tag color="blue">Miền Bắc</Tag></Tooltip>}
                    {record.region === 'central' && <Tooltip title="Miền Trung"><Tag color="orange">Miền Trung</Tag></Tooltip>}
                    {record.region === 'southern' && <Tooltip title="Miền Nam"><Tag color="green">Miền Nam</Tag></Tooltip>}
                </>
            ),
            filters: [
                { text: 'Miền Bắc', value: 'northern' },
                { text: 'Miền Trung', value: 'central' },
                { text: 'Miền Nam', value: 'southern' },
            ],
        },
        {
            title: 'Ngày bắt đầu', dataIndex: 'start_date', key: 'start_date',
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        },
        {
            title: 'Ngày kết thúc', dataIndex: 'end_date', key: 'end_date',
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Tooltip title="Xem hướng dẫn viên">
                    <Button
                        type="link"
                        onClick={() => {
                            setSelectedTour({
                                id: record.id,
                                start_date: record.start_date,
                                end_date: record.end_date,
                            });
                            setOpenModal(true);
                        }}
                    >
                        Hướng dẫn viên
                    </Button>
                </Tooltip>
            ),
        }

    ];
    const columnsGuider = [
        {
            title: "ID",
            dataIndex: ["guide", "id"],
            key: "id",
        },
        {
            title: "Email",
            dataIndex: ["guide", "email"],
            key: "email",
        },
        {
            title: "Vùng",
            dataIndex: ["guide", "region"],
            key: "region",
            render: (region: string) => (
                <>
                    {region === "northern" && (
                        <Tooltip title="Miền Bắc">
                            <Tag color="blue">Miền Bắc</Tag>
                        </Tooltip>
                    )}
                    {region === "central" && (
                        <Tooltip title="Miền Trung">
                            <Tag color="orange">Miền Trung</Tag>
                        </Tooltip>
                    )}
                    {region === "southern" && (
                        <Tooltip title="Miền Nam">
                            <Tag color="green">Miền Nam</Tag>
                        </Tooltip>
                    )}
                </>
            ),
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setRegions(filters.region as string[] || []);
        const sortField = sorter?.field;
        if (sortField === 'start_date') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderStartDate(sortOrder);
            setSortOrderEndDate(undefined);
        } else if (sortField === 'end_date') {
            const sortOrder = sorter?.order === "ascend"
                ? "asc"
                : sorter?.order === "descend"
                    ? "desc"
                    : undefined;
            setSortOrderEndDate(sortOrder);
            setSortOrderStartDate(undefined);
        } else {
            setSortOrderStartDate(undefined);
            setSortOrderEndDate(undefined);
        }
        updateParams({
            limit,
            page: pagination.current,
            regions: filters.region?.length > 0 ? filters.region.join(",") : undefined,
            start_date: sortField === 'start_date' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
            end_date: sortField === 'end_date' ? (sorter?.order === "ascend" ? "asc" : sorter?.order === "descend" ? "desc" : undefined) : undefined,
        })
    };
    return (
        <div className="p-4 sm:p-5 bg-white rounded-lg shadow">
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
                loading={listTourUpcomingApi.isLoading}
            />
            <Table columns={columnsTour} scroll={{ x: 900 }}
                dataSource={listTourUpcomingApi.data?.data}
                pagination={{
                    pageSize: limit,
                    current: page,
                    total: listTourUpcomingApi.data?.pagination?.total
                }}
                onChange={handleTableChange}
            />
            <Modal
                title="Hướng dẫn viên được phân"
                open={openModal}
                onCancel={() => setOpenModal(false)}
                width={800}
                styles={{
                    body: {
                        maxHeight: 400,
                        overflowY: "auto",
                    },
                }}
                okText="Xác nhận"
                cancelText="Đóng"
            >
                <Table
                    rowKey="id"
                    columns={columnsGuider}
                    dataSource={getGuideForTourUpcomingApi.data?.data}
                    pagination={false}
                />
            </Modal>
        </div>
    )
}

export default AdminViewAssignedGuidePage;