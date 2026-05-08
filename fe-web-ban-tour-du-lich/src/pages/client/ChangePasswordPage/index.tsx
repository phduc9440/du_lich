import { Button, Card, Flex, Form, Input, message, Typography } from "antd";
import { useForm } from "antd/es/form/Form";
import { useChangePasswordMutation } from "../../../services/authService";
interface InfoChangePass {
    current_password: string;
    new_password: string;
    confirm_password: string;
}
const ChangePasswordPage = () => {
    const [form] = useForm();
    const changePasswordApi = useChangePasswordMutation();
    const handleChangepassWord = async (value: InfoChangePass) => {
        try {
            await changePasswordApi.mutateAsync({current_password: value.current_password, new_password: value.new_password})
            form.resetFields();
            message.success("Đổi mật khẩu thành công");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Đổi mật khẩu thất bại:', error);
            message.error(error.response.data.message);
        }
    }
    return (
        <div className="flex justify-center items-center">
            <div className="lg:w-1/3 lg:mx-0 w-full mx-4 mt-4">
                <Card>
                    <Typography.Title level={3}>Đổi mật khẩu</Typography.Title>
                    <Form layout="vertical" form={form} name="Đổi mật khẩu" autoComplete="off" onFinish={handleChangepassWord} >
                        <Form.Item
                            label="Mật khẩu cũ"
                            name="current_password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu cũ' },
                                {
                                    pattern:
                                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                    message:
                                            "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!",
                                },
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu" />
                        </Form.Item>
                        <Form.Item
                            label="Mật khẩu mới"
                            name="new_password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                {
                                    pattern:
                                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                    message:
                                        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!",
                                },
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu" />
                        </Form.Item>
    
                        <Form.Item
                            label="Xác nhận mật khẩu"
                            name="confirm_password"
                            dependencies={['new_password']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không khớp'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Xác nhận mật khẩu" />
                        </Form.Item>
                        <Flex justify="center">
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={changePasswordApi.isPending}>Xác nhận</Button>
                            </Form.Item>
                        </Flex>
                    </Form>
                </Card>
            </div>
        </div>
    )
}
export default ChangePasswordPage;