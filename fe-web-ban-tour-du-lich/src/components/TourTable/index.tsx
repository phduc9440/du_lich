import type React from "react";
import { Button, Popconfirm, Space, Table, Tag, Tooltip } from "antd";
import type { Tour } from "../../types/tour";
import { useNavigate } from "react-router-dom";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";

interface TourTableProps {
    tours: Tour[];
    pagination: { page: number; pageSize: number, total: number };
    onTableChange: (pagination, filters, sorter) => void;
    handleDeleteTour: (tourId: number) => void;
}

const TourTable: React.FC<TourTableProps> = ({ tours, pagination, onTableChange, handleDeleteTour }) => {
    const navigate = useNavigate();
    const columns = [
        { title: 'Mã tour', dataIndex: 'tour_code', key: 'tour_code' },
        { title: 'Tên tour', dataIndex: 'title', key: 'title' },
        { title: 'Tối đa', dataIndex: 'capacity', key: 'capacity' },
        {
            title: 'Vùng', dataIndex: 'region', key: 'region',
            render: (_, record) => (
                <>
                    {record.region === 'northern' && <Tag color="blue">Miền Bắc</Tag>}
                    {record.region === 'central' && <Tag color="orange">Miền Trung</Tag>}
                    {record.region === 'southern' && <Tag color="green">Miền Nam</Tag>}
                </>
            ),
            filters: [
                { text: 'Miền Bắc', value: 'northern' },
                { text: 'Miền Trung', value: 'central' },
                { text: 'Miền Nam', value: 'southern' },
            ],
        },
        {
            title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active',
            render: (_, record) => (
                <>
                    {record.is_active ? <Tag color="#87d068">Kích hoạt</Tag> : <Tag color="#f50">Tạm dùng</Tag>}
                </>
            ),
            filters: [
                { text: 'Kích hoạt', value: 'true' },
                { text: 'Tạm dừng', value: 'false' },
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
            title: 'Giá', dataIndex: 'price', key: 'price',
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo giá' }
        },
        {
            title: 'Hành động', dataIndex: 'action', key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title='Chi tiết'>
                        <Button color="primary" variant="text" icon={<EyeOutlined />}
                            onClick={() => navigate(`edit/${record.id}`)}></Button>
                    </Tooltip>
                    <Tooltip title='Xóa'>
                        <Popconfirm title="Xóa tour sẽ ảnh hưởng tới đơn hàng, hướng dẫn viên,...?" okText='Xác nhận' cancelText='Đóng' onConfirm={() => handleDeleteTour(record.id)}>
                            <Button color="danger" variant="text" icon={<DeleteOutlined />}></Button>
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        },
    ];
    return (
        <Table
            columns={columns} dataSource={tours}
            scroll={{ x: 992 }}
            pagination={{ position: ['bottomRight'], pageSize: pagination.pageSize,
            current: pagination.page, total: pagination.total
            , showSizeChanger: false }}
            onChange={onTableChange}
        />
    )
}

export default TourTable;