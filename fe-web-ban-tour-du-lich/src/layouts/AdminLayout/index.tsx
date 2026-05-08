import { Avatar, Button, Layout, Menu, Typography, Drawer, Grid, } from "antd";
import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOutlined, CommentOutlined, FormOutlined, UserOutlined, BarsOutlined, LineChartOutlined, LoginOutlined, TeamOutlined, FileOutlined } from "@ant-design/icons";
import avatar from '../../assets/imgs/avatar.png';
import axiosClient from "../../configs/axiosClient";
import { queryClient } from "../../configs/queryClient";
import type { AppDispatch, RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/admin/adminSlice";

const { Header, Content, Sider } = Layout;
const AdminLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const adminName = useSelector((state: RootState) => state.admin.admin?.username);
    const adminEmail = useSelector((state: RootState) => state.admin.admin?.email);
    const adminRole = useSelector((state: RootState) => state.admin.admin?.role);

    const dispatch = useDispatch<AppDispatch>();
    const [openMenu, setOpenMenu] = useState(false);
    const screens = Grid.useBreakpoint();
    const menuKeys = [
        "/admin/users",
        "/admin/employees",
        "/admin/orders",
        "/admin/tours",
        "/admin/create-account",
        "/admin/supports",
        "/admin/tour-assigned",
        "/admin/categories",
        "/admin/coupons",
        "/admin/stats/revenue",
        "/admin/stats/tours",
        "/admin/stats/users",
        "/admin/supports",
        "/admin/list-guider",
        "/admin/list-guider/tours",
        "/admin/guide-tour",
        "/admin/guide-tour/history",
        "/admin/update-profile"
    ];
    const selectedKey = menuKeys.find((key) => location.pathname.startsWith(key)) || "/admin/users";
    const handleLogout = async () => {
        try {
            await axiosClient.post('/auth/logout');
            dispatch(logout());
            queryClient.clear();
            navigate('/admin/login');
        } catch (error) {
            console.log('lỗi đăng xuất', error);
        }
    }

    return (
        <Layout className="min-h-screen">
            <Header className="bg-white mb-4 px-4 py-3 rounded-b-2xl sticky top-0 z-10 w-full flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    {!screens.lg && (
                        <Button type="text" icon={<BarsOutlined />} onClick={() => setOpenMenu(true)} />
                    )}
                    <Avatar size={40} src={avatar} />
                    <div className="flex flex-col ml-2">
                        <Typography.Text strong>{adminName}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{adminEmail}</Typography.Text>
                    </div>
                    <Button type="text" icon={<LoginOutlined />} iconPosition="end" onClick={handleLogout}>Đăng xuất</Button>
                </div>
            </Header>
            <Layout>
                {screens.lg && (
                    <Sider width={264} className="mx-4 bg-transparent overflow-auto fixed inset-x-0 top-[80px] bottom-0 scrollbar-thin scrollbar-gutter-stable">

                        <div className="flex flex-col justify-between h-full">
                            <Menu mode="inline" selectedKeys={[selectedKey]} onClick={({ key }) => navigate(key)}
                                className="p-3 !border-none rounded-lg">
                                {
                                    adminRole !== 'guide' && (<><Menu.SubMenu key="management-user" title="Quản lý tài khoản" icon={<UserOutlined />}>
                                        <Menu.Item key="/admin/users">Khách hàng</Menu.Item>
                                        {adminRole === 'super_admin' && (<>
                                        <Menu.Item key="/admin/create-account">Thêm nhân viên</Menu.Item>
                                         <Menu.Item key="/admin/employees">Nhân viên</Menu.Item>
                                        </>)}
                                    </Menu.SubMenu><Menu.SubMenu key="management-divide" title="Phân công" icon={<TeamOutlined />}>
                                            {adminRole === 'super_admin' && (<Menu.Item key="/admin/list-guider" title="Quản lý hướng dẫn viên">
                                                Tour được phân công
                                            </Menu.Item>
                                            )}
                                            <Menu.Item key="/admin/tour-assigned">Hướng dẫn viên của tour</Menu.Item>
                                        </Menu.SubMenu><Menu.SubMenu key="management-order" icon={<FormOutlined />} title="Quản lý đơn hàng">
                                            <Menu.Item key="/admin/orders">Đơn hàng</Menu.Item>
                                            {adminRole === 'super_admin' && (<Menu.Item key="/admin/coupons">Mã giảm giá</Menu.Item>)}
                                        </Menu.SubMenu>
                                        {adminRole === 'super_admin' && (
                                            <Menu.SubMenu key="management-tour" title="Quản lý tour" icon={<BookOutlined />}>
                                                <Menu.Item key="/admin/tours">Tours</Menu.Item>
                                                <Menu.Item key="/admin/categories">Danh mục</Menu.Item>
                                            </Menu.SubMenu>
                                        )}
                                        {adminRole === 'super_admin' && (<Menu.SubMenu key='stat' title='Thống kê' icon={<LineChartOutlined />}>
                                            <Menu.Item key="/admin/stats/revenue">Doanh thu</Menu.Item>
                                            <Menu.Item key="/admin/stats/tours">Tour</Menu.Item>
                                            <Menu.Item key="/admin/stats/users">Khách hàng</Menu.Item>
                                        </Menu.SubMenu>)}
                                        <Menu.Item key="/admin/supports" icon={<CommentOutlined />}>Hỗ trợ người dùng</Menu.Item></>
                                    )}
                                {adminRole === 'guide' && (
                                    <Menu.Item key="/admin/guide-tour" title="Tour hướng dẫn" icon={<BookOutlined />}>Tour hướng dẫn</Menu.Item>
                                )}
                                <Menu.Item key="/admin/update-profile" icon={<FileOutlined />}>Cập nhật thông tin</Menu.Item>
                            </Menu>

                            <div className="h-[80px] bg-white rounded-xl mb-5 flex justify-center items-end">
                                <Typography.Text className="mb-2">Version 1.1.1.1</Typography.Text>
                            </div>
                        </div>
                    </Sider>
                )}
                <Layout>
                    <Content className={`${screens.lg ? 'ml-[296px]' : 'ml-0'} px-4 pb-4 space-y-4`}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
            {!screens.lg && (
                <Drawer
                    placement="left"
                    open={openMenu}
                    onClose={() => setOpenMenu(false)}
                    width={264}
                    title="Menu quản trị"
                >
                    <Menu mode="inline" selectedKeys={[selectedKey]} onClick={({ key }) => navigate(key)}
                        className="p-3 !border-none rounded-lg">
                        {
                            adminRole !== 'guide' && (<><Menu.SubMenu key="management-user" title="Quản lý tài khoản" icon={<UserOutlined />}>
                                <Menu.Item key="/admin/users">Khách hàng</Menu.Item>
                                {adminRole === 'super_admin' && (<>
                                <Menu.Item key="/admin/employees">Nhân viên</Menu.Item>
                                <Menu.Item key="/admin/create-account">Thêm nhân viên</Menu.Item>
                                </>)}
                            </Menu.SubMenu><Menu.SubMenu key="management-divide" title="Phân công" icon={<TeamOutlined />}>
                                    {adminRole === 'super_admin' && (<Menu.Item key="/admin/list-guider" title="Quản lý hướng dẫn viên">
                                        Tour được phân công
                                    </Menu.Item>
                                    )}
                                    <Menu.Item key="/admin/tour-assigned">Hướng dẫn viên của tour</Menu.Item>
                                </Menu.SubMenu><Menu.SubMenu key="management-order" icon={<FormOutlined />} title="Quản lý đơn hàng">
                                    <Menu.Item key="/admin/orders">Đơn hàng</Menu.Item>
                                    {adminRole === 'super_admin' && (<Menu.Item key="/admin/coupons">Mã giảm giá</Menu.Item>)}
                                </Menu.SubMenu><Menu.SubMenu key="management-tour" title="Quản lý tour" icon={<BookOutlined />}>
                                    <Menu.Item key="/admin/tours">Tours</Menu.Item>
                                    <Menu.Item key="/admin/categories">Danh mục</Menu.Item>
                                </Menu.SubMenu>
                                {adminRole === 'super_admin' && (<Menu.SubMenu key='stat' title='Thống kê' icon={<LineChartOutlined />}>
                                    <Menu.Item key="/admin/stats/revenue">Doanh thu</Menu.Item>
                                    <Menu.Item key="/admin/stats/tours">Tour</Menu.Item>
                                    <Menu.Item key="/admin/stats/users">Khách hàng</Menu.Item>
                                </Menu.SubMenu>)}
                                <Menu.Item key="/admin/supports" icon={<CommentOutlined />}>Hỗ trợ người dùng</Menu.Item></>
                            )}
                        {adminRole === 'guide' && (
                            <Menu.Item key="/admin/guide-tour" title="Tour hướng dẫn" icon={<BookOutlined />}>Tour hướng dẫn</Menu.Item>
                        )}
                        <Menu.Item key="/admin/update-profile" icon={<FileOutlined />}>Cập nhật thông tin</Menu.Item>
                    </Menu>
                </Drawer>
            )}
        </Layout>
    )
}

export default AdminLayout;