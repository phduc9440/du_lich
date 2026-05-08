import { Button, Input, Modal, Select, Table,} from "antd";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUpdateParams } from "../../../hooks/useUpdateParams";
import { useGuideGetOrdersForTour, useGuideGetToursAssigned } from "../../../services/adminService";

const AdminGuideViewTourPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
    const [limit] = useState<number>(Number(searchParams.get("limit") || 5));
    const [inputValue, setInputValue] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") || "");
    const [status, setStatus] = useState(searchParams.get('status') || 'valid');
    const [openModal, setOpenModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTour, setSelectedTour] = useState<any>(null);
    const { updateParams } = useUpdateParams();
    const params = useMemo(() => {
        return {
            page,
            limit,
            search: searchText || undefined,
            status: status || undefined,
        }
    }, [limit, page, searchText, status])
    // call api
    const guideGetToursAssignedApi = useGuideGetToursAssigned(params);
    const guideGetOrdersForTourApi = useGuideGetOrdersForTour(
        selectedTour?.id || 0,
        selectedTour?.start_date || "",
        selectedTour?.end_date || ""
    );
    const handleTableChange = (pagination) => {
        setPage(pagination.current)
        updateParams({
            limit,
            page: pagination.current,
        })
    };
    const tourColumns = [
        { title: 'Mã tour', dataIndex: ['tour','tour_code'], key: 'tour_code' },
        { title: 'Tên tour', dataIndex: ['tour','title'], key: 'title' },
        {
            title: 'Ngày bắt đầu', dataIndex: ['tour','start_date'], key: 'start_date',
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        },
        {
            title: 'Ngày kết thúc', dataIndex: ['tour','end_date'], key: 'end_date',
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
                        setSelectedTour(record.tour);
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
            dataIndex: "ticket_count",
            key: "ticket_count",
        },
    ];
    return (
        <>
            <div className="p-4 sm:p-5 bg-white rounded-lg shadow space-y-4">
                <div className="flex gap-4">
                    <Input.Search placeholder="Tìm kiếm theo tên hoặc mã tour..." value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onSearch={() => {
                            setSearchText(inputValue);
                            updateParams({
                                search: inputValue || undefined,
                            });
                        }}
                        enterButton />
                    <Select
                        className="w-[120px]"
                        value={status}
                        options={[
                            {value:'valid', label: 'Còn hạn'},
                            {value:'invalid', label: 'Hết hạn'},
                        ]}
                        onChange={(value) => {
                            setStatus(value);
                            updateParams({
                                status: value
                            })
                        }}
                    />
                </div>
                <Table columns={tourColumns} dataSource={guideGetToursAssignedApi.data?.data}
                    rowKey="id" scroll={{ x: 992 }}
                    pagination={{ position: ['bottomRight'], pageSize: limit, current: page, total: guideGetToursAssignedApi.data?.data?.length }}
                    onChange={handleTableChange}
                //  rowClassName={(record, index) => {
                //     return index % 2 === 0 ? "table-row-light" : "table-row-dark";
                //   }}
                />
            </div>
            <Modal
                title={`Danh sách đơn hàng - ${selectedTour?.tour_code || ""} - Tổng vé: ${guideGetOrdersForTourApi.data?.data?.reduce((sum, order) => sum + order.ticket_count, 0) || 0}`}
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
                    dataSource={guideGetOrdersForTourApi.data?.data}
                    pagination={false}
                />
            </Modal>

        </>
    )
}

export default AdminGuideViewTourPage;