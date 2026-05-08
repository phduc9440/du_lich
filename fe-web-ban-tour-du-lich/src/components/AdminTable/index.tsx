import { Table, Tag, Button, Popconfirm, Select, Modal, Space, Form, Input, Typography } from "antd";
import { useState } from "react";
import type { Admin } from "../../types/admin";

interface AdminTableProps {
    admins: Admin[];
    pagination: { page: number; pageSize: number, total: number };
    handleChangeStatusAdmin: (adminId: number, isActive: boolean) => void;
    handleChangeRoleAdmin: (adminId: number, role: string) => void;
    handleResetPassword: (adminId: number, password: string) => void;
    handleChangeRegionAdmin: (adminId: number, region: string) => void;
    onTableChange: (pagination, filters, sorter) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
    admins,
    pagination,
    onTableChange,
    handleChangeStatusAdmin,
    handleChangeRoleAdmin,
    handleResetPassword,
    handleChangeRegionAdmin,
}) => {
    const [openRoleModal, setOpenRoleModal] = useState(false);
    const [openResetPasswordModal, setOpenResetPasswordModal] = useState(false);

    const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
    const [newRole, setNewRole] = useState<string | null>(null);

    const [openRegionModal, setOpenRegionModal] = useState(false);
    const [newRegion, setNewRegion] = useState<string | null>(null);

    const [formResetPassword] = Form.useForm();

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            render: (_, record) => (
                <Select
                    className="w-[125px]"
                    value={record.role}
                    options={[
                        { value: "super_admin", label: "Quản lý" },
                        { value: "employee", label: "Nhân viên" },
                        { value: "guide", label: "Hướng dẫn viên" },
                    ]}
                    onChange={(value) => {
                        setSelectedAdminId(record.id);
                        setNewRole(value);
                        setOpenRoleModal(true);
                    }}
                />
            ),
            filters: [
                { text: 'Quản lý', value: 'super_admin' },
                { text: 'Nhân viên', value: 'employee' },
                { text: 'Hướng dẫn viên', value: 'guide' },
            ],
        },
        {
            title: "Vùng",
            dataIndex: "region",
            key: "region",
            render: (_, record) => (
                <Select
                    className="w-[125px]"
                    value={record.region}
                    options={[
                        { value: "northern", label: "Miền Bắc" },
                        { value: "central", label: "Miền Trung" },
                        { value: "southern", label: "Miền Nam" },
                    ]}
                    onChange={(value) => {
                        setSelectedAdminId(record.id);
                        setNewRegion(value);
                        setOpenRegionModal(true);
                    }}
                />
            ),
            filters: [
                { text: "Miền Bắc", value: "northern" },
                { text: "Miền Trung", value: "central" },
                { text: "Miền Nam", value: "southern" },
            ],
        },

        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
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
            render: (date: string) =>
                date ? new Date(date).toLocaleDateString() : "Chưa cập nhật",
            sorter: true,
            showSorterTooltip: { title: 'Sắp xếp theo thời gian' }
        },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            render: (active: boolean) => (
                <Tag color={active ? "green" : "red"}>
                    {active ? "Hoạt động" : "Khoá"}
                </Tag>
            ),
            filters: [
                { text: 'Hoạt động', value: 'true' },
                { text: 'Khoá', value: 'false' },
            ],
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => {
                return (

                    <Space>
                        <Button
                            type="link"
                            onClick={() => {
                                setSelectedAdminId(record.id);
                                setOpenResetPasswordModal(true);
                            }}
                        >
                            Đặt lại mật khẩu
                        </Button>

                        <Popconfirm
                            title={record.is_active ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                            description={`Bạn có chắc muốn ${record.is_active ? "khoá" : "mở khoá"
                                } tài khoản này?`}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            onConfirm={() => handleChangeStatusAdmin(record.id, record.is_active)}
                        >
                            <Button type="link" danger>
                                {record.is_active ? "Khoá" : "Mở khoá"}
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return <>
        <Table columns={columns} dataSource={admins} rowKey="id" scroll={{ x: 992 }}
            pagination={{
                position: ['bottomRight'], pageSize: pagination.pageSize,
                current: pagination.page, total: pagination.total, showSizeChanger: false
            }}
            onChange={onTableChange}
        />
        {/* Modal thay đổi vai trò */}
        <Modal
            open={openRoleModal}
            title="Xác nhận thay đổi vai trò"
            okText="Xác nhận"
            cancelText="Hủy"
            onOk={() => {
                if (selectedAdminId && newRole) {
                    handleChangeRoleAdmin(selectedAdminId, newRole);
                }
                setOpenRoleModal(false);
                setNewRole(null);
                setSelectedAdminId(null);
            }}
            onCancel={() => {
                setOpenRoleModal(false);
                setNewRole(null);
            }}
        >
            <Typography.Text>
                Bạn có chắc muốn đổi vai trò thành: <b>{newRole === 'admin' && 'Quản lý'}
                    {newRole === 'employee' && 'Nhân viên'}
                    {newRole === 'guide' && 'Hướng dẫn viên'}
                </b>?
            </Typography.Text>
        </Modal>
        {/* Modal đặt lại mật khẩu */}
        <Modal
            open={openResetPasswordModal}
            title="Đặt lại mật khẩu"
            okText="Xác nhận"
            cancelText="Hủy"
            onOk={() => {

                if (selectedAdminId) {
                    handleResetPassword(selectedAdminId, formResetPassword.getFieldValue('password'));
                }
                formResetPassword.resetFields();
                setOpenResetPasswordModal(false);
                setSelectedAdminId(null);
            }}
            onCancel={() => {
                formResetPassword.resetFields();
                setOpenResetPasswordModal(false);
                setSelectedAdminId(null);
            }}
        >
            <Form form={formResetPassword} layout="vertical">
                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu." },
                        {
                            pattern:
                                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                            message:
                                "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt",
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                        { required: true, message: "Vui lòng xác nhận mật khẩu." },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("password") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(
                                    new Error("Mật khẩu xác nhận không khớp!")
                                );
                            },
                        }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>
            </Form>
        </Modal>
        {/* Modal thay đổi vùng */}
        <Modal
            open={openRegionModal}
            title="Xác nhận thay đổi vùng"
            okText="Xác nhận"
            cancelText="Hủy"
            onOk={() => {
                if (selectedAdminId && newRegion) {
                    handleChangeRegionAdmin(selectedAdminId, newRegion);
                }
                setOpenRegionModal(false);
                setNewRegion(null);
                setSelectedAdminId(null);
            }}
            onCancel={() => {
                setOpenRegionModal(false);
                setNewRegion(null);
            }}
        >
            <Typography.Text>
                Bạn có chắc muốn đổi vùng thành: <b>
                    {newRegion === 'northern' && 'Miền Bắc'}
                    {newRegion === 'central' && 'Miền Trung'}
                    {newRegion === 'southern' && 'Miền Nam'}
                </b>?
            </Typography.Text>
        </Modal>

    </>;
};

export default AdminTable;
