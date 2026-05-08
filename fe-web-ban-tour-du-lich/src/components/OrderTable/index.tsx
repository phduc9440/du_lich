import type React from "react";
import type { Order } from "../../types/order";
import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";

interface OrderTableProps {
    orders: Order[],
    pagination: { page: number; pageSize: number, total: number };
    onTableChange: (pagination, filters, sorter) => void;
    handleCancelOrder?: (orderId: number) => void;
    handleShowTicket?: (orderId: number) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, pagination, onTableChange, handleCancelOrder, handleShowTicket }) => {
    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: "order_code",
            key: "order_code",
        },
        {
            title: 'Mã tour',
            dataIndex: "tour",
            key: "tour",
            render: (tour) => (
                <Typography.Text>{tour?.tour_code}</Typography.Text>
            )
        },
        {
            title: 'Số lượng vé',
            dataIndex: "quantity",
            key: "quantity",
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo vé' }
        },
        {
            title: 'Tổng tiền',
            dataIndex: "total_price",
            key: "total_price",
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo tổng tiền' },
            render: (total_price) => (
                <Typography.Text>{total_price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</Typography.Text>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: "status",
            key: "status",
            render: (_, record) => (
                <>
                    {record.status === 'confirmed' && <Tag color="#87d068">Xác nhận</Tag>}
                    {record.status === 'pending' && <Tag color="#108ee9">Chờ xử lý</Tag>}
                    {record.status === 'cancelled' && <Tag color="#f50">Đã hủy</Tag>}
                    {record.status === 'completed' && <Tag color="#2db7f5">Hoàn thành</Tag>}
                </>
            ),
            filters: [
                { text: 'Xác nhận', value: 'confirmed' },
                { text: 'Chờ xử lý', value: 'pending' },
                { text: 'Hoàn thành', value: 'completed' },
                { text: 'Đã hủy', value: 'cancelled' },
            ],
        },
        {
            title: 'Thanh toán',
            dataIndex: "is_paid",
            key: "is_paid",
            render: (is_paid) => (
                <Typography.Text>{is_paid === true ? 'Đã thanh toán' : 'Chưa thanh toán'}</Typography.Text>
            )
        },
        {
            title: 'Hành động', dataIndex: 'action', key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title='Xem vé'>
                        <Button color="primary" variant="text" icon={<EyeOutlined />}
                            onClick={() => {
                                if (handleShowTicket) {
                                    handleShowTicket(record.id);
                                }
                            }}
                            disabled={record.status === 'cancelled' || record.status === 'pending'}
                        ></Button>
                    </Tooltip>
                    <Tooltip title='Hủy đơn'>
                        <Popconfirm title="Hủy đơn hàng?" okText='Xác nhận' cancelText='Đóng' onConfirm={() => {
                            if (handleCancelOrder) {
                                handleCancelOrder(record.id);
                            }
                        }}>
                            <Button color="danger" variant="text" icon={<DeleteOutlined />}
                                disabled={record.status != 'confirmed'}
                            ></Button>
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        },
    ]
    return (
        <Table
            columns={columns} dataSource={orders}
            scroll={{ x: 992 }}
            pagination={{ position: ['bottomRight'], pageSize: pagination.pageSize, current: pagination.page, total: pagination.total, showSizeChanger: false, }}
            onChange={onTableChange}
        />
    )
}

export default OrderTable;