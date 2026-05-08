import { Button, Checkbox, Flex, Form, Input, message, Typography } from "antd";
import bgLogin from "../../../assets/imgs/bgLogin.png";
import { useRegisterMutation } from "../../../services/authService";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
    const [form] = Form.useForm();
    const naviagate = useNavigate();
    //call api
    const registerApi = useRegisterMutation();
    const handleRegister = async (value) => {
        try {
            const dataRegister = await registerApi.mutateAsync(value);
            console.log(dataRegister);
            message.success('Đăng ký thành công.');
            naviagate('/login')
        } catch (error) {
            message.error('Đã có lỗi xảy ra vui lòng thử lại sau.')
            console.log('Lỗi call api register', error)
        }
    }

    return (
        <div
            className="h-screen bg-center bg-cover bg-no-repeat flex justify-center items-center"
            style={{ backgroundImage: `url(${bgLogin})` }}
        >
            <div className="relative lg:w-1/3 lg:mx-0 w-full mx-4">


                {/* FORM ĐĂNG KÝ */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-200 ease-in-out`}
                >
                    <div className="bg-white/80 backdrop-blur-sm py-8 px-12 rounded-lg shadow-lg flex flex-col items-center w-full">
                        <Typography.Title level={3} className="text-center">
                            Đăng ký
                        </Typography.Title>
                        <Form form={form} layout="vertical" className="w-full" onFinish={handleRegister}>
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
                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[
                                    { required: true, message: "Vui lòng nhập mật khẩu." },
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
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "Vui lòng xác nhận mật khẩu." },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("password") === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Xác nhận mật khẩu" />
                            </Form.Item>
                            <Form.Item name="phone" label="Số điện thoại" rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại." },
                                { pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: "Số điện thoại không hợp lệ!" }
                            ]}>
                                <Input placeholder="0123456789" />
                            </Form.Item>
                            <Form.Item name="agree" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Bạn phải đồng ý với điều khoản sử dụng!')) }]}>
                                <Checkbox>
                                    Tôi đồng ý với <a href="#">điều khoản sử dụng</a>
                                </Checkbox>
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block loading={registerApi.isPending}>
                                    Đăng ký
                                </Button>
                            </Form.Item>
                        </Form>
                        <Flex justify="center" align="center" gap={4}>
                            <Typography.Text>Bạn đã có tài khoản? </Typography.Text>
                            <Button
                                color="default"
                                variant="link"
                                className="p-0"
                                onClick={() => naviagate('/login')}
                            >
                                Đăng nhập
                            </Button>
                        </Flex>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
