import { Button, Input, Modal, Table } from "antd";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";
import { useAdminGetOrdersDivideForGuideWithTour, useAdminGetToursByGuide } from "../../../services/adminService";

const AdminTourDivideForGuidePage: React.FC = () => {
    const {id} = useParams();
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [openModal, setOpenModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTour, setSelectedTour] = useState<any>(null);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
        }
    }, [limit, page, searchText])
    // call api
    const getTourAssignedForGuideApi = useAdminGetToursByGuide(Number(id), params);
    const getOrderAssignedWithTourApi = useAdminGetOrdersDivideForGuideWithTour(
        Number(id),
        selectedTour?.start_date || "",
        selectedTour?.end_date || "",
        selectedTour?.id || 0,
    );
    const handleTableChange = (pagination) => {
        setPage(pagination.current)
        updateParams({
            limit,
            page: pagination.current,
        })
    };
    const tourColumns = [
        { title: 'Mã tour', dataIndex: 'tour_code', key: 'tour_code' },
        { title: 'Tên tour', dataIndex: 'title', key: 'title' },
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
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedTour(record);
                        setOpenModal(true);
                    }}
                    disabled={record.order_quantity === 0}
                >
                    Khách hàng
                </Button>
            ),
        }

    ];
    const orderColumns = [
        {
            title: "Mã đơn",
            dataIndex: "order_code",
            key: "order_code",
        },
        {
            title: "Khách hàng",
            dataIndex: "customer_name",
            key: "customer_name",
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Số vé",
            dataIndex: "ticket_quantity",
            key: "ticket_quantity",
        },
    ];
    return (
        <>
            <div className="p-4 sm:p-5 bg-white rounded-lg shadow space-y-4">
                <Input.Search placeholder="Tìm kiếm theo tên hoặc mã tour..." value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onSearch={() => {
                        setSearchText(inputValue);
                        updateParams({
                            search: inputValue || undefined,
                        });
                    }}
                    enterButton />
                <Table columns={tourColumns} dataSource={getTourAssignedForGuideApi.data?.data}
                    rowKey="id" scroll={{ x: 992 }}
                    pagination={{ position: ['bottomRight'], pageSize: 5, current: page, total: getTourAssignedForGuideApi.data?.data?.length, showSizeChanger: false }}
                    onChange={handleTableChange}
                //  rowClassName={(record, index) => {
                //     return index % 2 === 0 ? "table-row-light" : "table-row-dark";
                //   }}
                />
            </div>
            <Modal
                title={`Danh sách đơn hàng - ${selectedTour?.tour_code || ""} - Tổng vé: ${getOrderAssignedWithTourApi.data?.data?.reduce((sum, order) => sum + order.ticket_quantity, 0) || 0}`}
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
                    columns={orderColumns}
                    dataSource={getOrderAssignedWithTourApi.data?.data || []}
                    pagination={false}
                />
            </Modal>

        </>
    )
}

export default AdminTourDivideForGuidePage;