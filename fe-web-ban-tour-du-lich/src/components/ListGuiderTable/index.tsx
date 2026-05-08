import { Button, Space, Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";

interface ListGuiderTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    pagination: { page: number; pageSize: number, total: number };
    onTableChange: (pagination, filters, sorter) => void;
}

const ListGuiderTable: React.FC<ListGuiderTableProps> = ({ data, pagination, onTableChange }) => {
    const navigate = useNavigate();

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Họ và tên", dataIndex: "username", key: "username", },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Vùng", dataIndex: "region", key: "region",
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
            title: "Số tour hướng dẫn", dataIndex: "toursNumber", key: "toursNumber",
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo số tour' },
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => navigate(`tours/${record.id}`)}>Xem tour</Button>
                </Space>
            ),
        },
    ];
    return (
        <Table columns={columns} dataSource={data}
            rowKey="id" scroll={{ x: 992 }}
            pagination={{
                position: ['bottomRight'], pageSize: pagination.pageSize,
                current: pagination.page, total: pagination.total
                , showSizeChanger: false
            }}
            onChange={onTableChange}
        />
    )
}

export default ListGuiderTable;