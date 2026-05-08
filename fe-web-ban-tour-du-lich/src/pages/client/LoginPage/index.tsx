/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Divider, Flex, Form, Input, message, Modal, Typography } from "antd";
import bgLogin from "../../../assets/imgs/bgLogin.png";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation, useGoogleLoginMutation } from "../../../services/authService";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../store";
import { setUser } from "../../../features/user/userSlice";
import { useState } from "react";
import { logout } from "../../../features/admin/adminSlice";
import { socket } from "../../../configs/socket";


const LoginPage: React.FC = () => {
    const [form] = Form.useForm();
    const [formForgot] = Form.useForm();
    const [openModal, setOpenModal] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);    // 1 = nhập email, 2 = nhập OTP + password
    const [emailForgot, setEmailForgot] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    // call api
    const loginApi = useLoginMutation();
    const googleLoginApi = useGoogleLoginMutation();
    const forgotPasswordApi = useForgotPasswordMutation();
    const resetPasswordApi = useResetPasswordMutation();
    const handleLogin = async (value) => {
        try {
            const dataLogin = await loginApi.mutateAsync(value);
            dispatch(setUser(dataLogin.data.user));
            dispatch(logout());
            localStorage.setItem("accessToken", dataLogin.data?.accessToken);
            socket.connect();
            socket.emit("register", { role: "user", userId: dataLogin.data.user.id });
            message.success('Đăng nhập thành công.');
            navigate('/')
        } catch (error: any) {
            console.log("Lỗi call api login", error);
            message.error(error.response?.data?.message);
        }
    }
    const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
        const token = credentialResponse.credential;
        try {
            const dataLogin = await googleLoginApi.mutateAsync({ google_token: token });
            dispatch(setUser(dataLogin.data.user));
            dispatch(logout());
            localStorage.setItem("accessToken", dataLogin.data?.accessToken);
            message.success('Đăng nhập Google thành công.');
            navigate('/');
        } catch (error: any) {
            message.error(error.response?.data?.message || "Đăng nhập Google thất bại");
        }
    }
    const handleSendOtp = async (values: { email: string }) => {
        try {
            const res = await forgotPasswordApi.mutateAsync({ email: values.email });

            message.success(res.data.message || "Gửi OTP thành công!");
            setEmailForgot(values.email);
            setStep(2);   // chuyển sang bước nhập OTP + password
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi gửi OTP");
        }
    };
    const handleResetPassword = async (values: { otp: string; newPassword: string }) => {
        try {
            await resetPasswordApi.mutateAsync({
                email: emailForgot,
                otp: values.otp,
                new_password: values.newPassword
            });

            message.success("Đổi mật khẩu thành công!");
            setOpenModal(false);
            setStep(1);
            formForgot.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Lỗi đặt mật khẩu");
        }
    };

    return (
        <div
            className="h-screen bg-center bg-cover bg-no-repeat flex justify-center items-center"
            style={{ backgroundImage: `url(${bgLogin})` }}
        >
            <div className="lg:w-1/3 lg:mx-0 w-full mx-4">

                {/* FORM ĐĂNG NHẬP */}
                <div
                    className={`flex flex-col items-center justify-center transition-all duration-200 ease-in-out`}
                >
                    <div className="bg-white/80 backdrop-blur-sm py-8 px-12 rounded-lg shadow-lg flex flex-col items-center w-full">
                        <Typography.Title level={3} className="text-center">
                            Đăng nhập
                        </Typography.Title>
                        <Form form={form} layout="vertical" className="w-full" onFinish={handleLogin}>
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
                            <Flex className="justify-end">
                                <Button
                                    color="default"
                                    variant="link"
                                    className="p-0 mb-4"
                                    onClick={() => setOpenModal(true)}
                                >
                                    Quên mật khẩu?
                                </Button>

                            </Flex>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block loading={loginApi.isPending}>
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                        </Form>
                        <Flex justify="center" align="center" gap={4}>
                            <Typography.Text>Bạn chưa có tài khoản? </Typography.Text>
                            <Button
                                color="default"
                                variant="link"
                                className="p-0"
                                onClick={() => navigate('/register')}
                            >
                                Đăng ký
                            </Button>
                        </Flex>
                        <Divider>Hoặc</Divider>
                        <div className="w-full">
                            <GoogleLogin
                                width={"100%"}
                                size="large"
                                onSuccess={handleGoogleLogin}
                                onError={() => {
                                    console.log('Đăng nhập Google thất bại');
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                title="Quên mật khẩu"
                centered
                open={openModal}
                onCancel={() => { setOpenModal(false); setStep(1); formForgot.resetFields(); }}
                footer={null}
                destroyOnHidden={true}
            >
                <Form
                    form={formForgot}
                    layout="vertical"
                    onFinish={(values: any) => step === 1 ? handleSendOtp(values) : handleResetPassword(values)}
                >

                    {step === 1 && (
                        <>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: "Vui lòng nhập email" },
                                    { type: "email", message: "Email không hợp lệ" }
                                ]}
                            >
                                <Input placeholder="Nhập email để nhận OTP" />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={forgotPasswordApi.isPending}
                            >
                                Gửi OTP
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Form.Item
                                name="otp"
                                label="Mã OTP"
                                rules={[{ required: true, message: "Vui lòng nhập OTP" }]}
                            >
                                <Input placeholder="Nhập mã OTP" />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="newPassword"
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
                                name="confirmNewPassword"
                                dependencies={["newPassword"]}
                                rules={[
                                    { required: true, message: "Vui lòng xác nhận mật khẩu." },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("newPassword") === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Xác nhận mật khẩu" />
                            </Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={resetPasswordApi.isPending}
                            >
                                Đổi mật khẩu
                            </Button>
                        </>
                    )}

                </Form>
            </Modal>

        </div>
    );
};

export default LoginPage;
