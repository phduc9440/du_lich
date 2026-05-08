import { Button, Form, Input, message, Typography } from 'antd';
import heroBanner from '../../../assets/imgs/heroBannerAdminLogin.png';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAdminLogin } from '../../../services/adminService';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { setAdmin } from '../../../features/admin/adminSlice';
import { logout } from '../../../features/user/userSlice';
const AdminLoginPage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    // call api
    const adminLoginApi = useAdminLogin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLogin = async(data: any) => {
        try {
            const dataLogin = await adminLoginApi.mutateAsync(data);        
            dispatch(setAdmin(dataLogin.data.admin));
            dispatch(logout());
            message.success('Đăng nhập thành công!');
            if (dataLogin?.data?.admin?.role === 'guide') {
                navigate('/admin/guide-tour');
            } else {
                navigate('/admin/users');
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
            message.error(error.response.data.message || 'Lỗi đăng nhập.')
        }
    }
    return (
        <div className="h-screen bg-no-repeat bg-center bg-cover relative" style={{
            backgroundImage: `url(${heroBanner})`
        }}>
            <div className='bg-[#D9D9D9]/60 absolute left-0 bottom-0 w-full h-1/2 flex justify-center items-center'>
                <div>
                    <Typography.Title level={3} className='text-center'>Welcome back!</Typography.Title>
                    <Form form={form} layout="vertical" autoComplete='off' className='!w-96' onFinish={handleLogin}>
                        <Form.Item name='email' label='Email' rules={[
                            { required: true, message: 'Vui lòng nhập email đăng nhập.' },
                            { type: 'email', message: 'Email đăng nhập không hợp lệ!' }
                        ]}>
                            <Input placeholder='example@mail.com' />
                        </Form.Item>
                        <Form.Item name='password' label='Mật khẩu' rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { type: 'string', message: 'Mật khẩu không hợp lệ!' }
                        ]}>
                            <Input.Password
                                placeholder="Mật khẩu"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button htmlType='submit' type='primary' 
                                className='w-full rounded-3xl bg-[#27AE60] hover:!bg-[#27AE60]/70 transition-colors duration-300'
                                loading={adminLoginApi.isPending}
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>)
}

export default AdminLoginPage;