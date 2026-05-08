import { Table, Tag, Button, Popconfirm } from "antd";
import type { User } from "../../types/user";

interface UserTableProps {
    users: User[];
    pagination: {page:number; pageSize: number, total: number};
    handleChangeStatusUser: (userId: number, is_active: boolean) => void;
    onTableChange: (pagination, filters, sorter) => void;
}
const UserTable: React.FC<UserTableProps> = ({ users,pagination, handleChangeStatusUser, onTableChange }) => {
    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Tên đăng nhập", dataIndex: "username", key: "username",},
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            render: (active: boolean) => (
                <Tag color={active ? "green" : "red"}>{active ? "Hoạt động" : "Khoá"}</Tag>
            ),
            filters: [
                { text: 'Hoạt động', value: 'true' },
                { text: 'Khoá', value: 'false' },
            ],
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => new Date(date).toLocaleDateString(),
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        },
        {
            title: "Cập nhật lần cuối",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Chưa cập nhật',
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        }
        ,
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Popconfirm title={record.is_active ? "Khoá người dùng này?" : "Mở khóa người dùng này?"} okText="Có" cancelText="Không" onConfirm={() => handleChangeStatusUser(record.id, !record.is_active)}>
                    <Button danger type="link">{record.is_active ? 'Khoá' : 'Mở khóa'}</Button>
                </Popconfirm>
            ),
       },
    ];

    return <Table columns={columns} dataSource={users}
                rowKey="id" scroll={{ x: 992 }}
                pagination={{ position: ['bottomRight'], pageSize:pagination.pageSize,
                current: pagination.page, total: pagination.total
                , showSizeChanger: false }}
                onChange={onTableChange}
            />;
};

export default UserTable;
