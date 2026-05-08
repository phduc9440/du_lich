import { Button, Form, Input, message, Skeleton } from "antd";
import { useAdminGetProfile, useAdminUpdateProfile } from "../../../services/adminService";
import { useDispatch } from "react-redux";
import { setAdmin } from "../../../features/admin/adminSlice";
import type { AppDispatch } from "../../../store";

const AdminUpdateProfilePage = () => {
    const [form] = Form.useForm();
    const dispatch = useDispatch<AppDispatch>();
    const adminGetProfileApi = useAdminGetProfile();
    const adminUpdateProfileApi = useAdminUpdateProfile();
    const handleUpdateProfile = async (value: { username: string; email: string; phone: string }) => {
        try {
            const data = await adminUpdateProfileApi.mutateAsync(value);
            dispatch(setAdmin(data.data));
            message.success('Cập nhật thông tin thành công');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.log('lỗi update profile', error);
            message.error(error.response.data.message)
        }
    }
    if (adminGetProfileApi.isLoading) {
        return (<Skeleton active />)
    }
    return (
        <div className="flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm py-8 px-12 rounded-lg shadow-lg flex flex-col items-center lg:w-1/2 lg:mx-0 w-full">
                <Form form={form} initialValues={adminGetProfileApi.data?.data?.admin} layout="vertical" className="w-full" onFinish={handleUpdateProfile}>
                    <Form.Item
                        label="Họ và tên"
                        name="username"
                        rules={[{ required: true, message: "Vui lòng nhập họ và tên." }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email." },
                            { type: "email", message: "Email không hợp lệ!" },
                        ]}
                    >
                        <Input placeholder="example@gmail.com" />
                    </Form.Item>
                    <Form.Item label="Số điện thoại" name="phone"
                        rules={[
                                      { required: true, message: "Vui lòng nhập số điện thoại." },
                                      { pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: "Số điện thoại không hợp lệ!" }
                                    ]}>
                        <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block >
                            Cập nhật
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
export default AdminUpdateProfilePage;