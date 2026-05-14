import {
  Button,
  Col,
  Divider,
  Flex,
  FloatButton,
  Image,
  Layout,
  Menu,
  Popover,
  Row,
  Space,
  Typography,
  Drawer,
  Grid,
  Tooltip,
  Skeleton,
  Empty,
  Badge,
} from 'antd';
import {
  BellOutlined,
  TwitterSquareFilled,
  InstagramFilled,
  FacebookFilled,
  UpOutlined,
  UserOutlined,
  ScheduleOutlined,
  LogoutOutlined,
  CommentOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  ShopOutlined,
  BarsOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState, type ReactNode } from 'react';
import iconApp from '../../assets/imgs/iconApp.png';
import iconAppLight from '../../assets/imgs/iconAppLight.png';
import NotificationCard from '../../components/NotificationCard';
import defaultAvatar from "../../assets/imgs/avatar.png";
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import axiosClient from '../../configs/axiosClient';
import { logout, resetJustLoggedOut } from '../../features/user/userSlice';
import { queryClient } from '../../configs/queryClient';
import { useGetNotifications } from '../../services/notificationService';
import { useNotifications } from '../../hooks/useNotification';
import ChatBox from '../../components/ChatBox';
import { disconnectSocket } from '../../configs/socket';

const { Header, Content, Footer } = Layout;

const DefaultLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openChat, setOpenChat] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const screens = Grid.useBreakpoint();
  const userInfo = useSelector((state: RootState) => state.user.user);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated) === true;
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.user.user?.id);
  // kết nối socket lấy noti
  const { realtimeNotifications, realtimeUnread, setRealtimeUnread } = useNotifications(userId || 0);
  // call api lấy noti
  const getNotificationApi = useGetNotifications(isAuthenticated);

  const handleOpenNoti = async (visible: boolean) => {
    if (visible) {
      try {
        await axiosClient.post('/notifications/user/read-all');

        setRealtimeUnread(0);  // reset socket unread
        getNotificationApi.refetch(); // reset API unread
      } catch (error) {
        console.log('Lỗi đánh dấu đã đọc tất cả thông báo', error);
      }
    }
  };

  const contentNoti: ReactNode = useMemo(() => {
    const notifications =
      [
        ...realtimeNotifications,   // realtime từ socket
        ...(getNotificationApi.data?.data?.notifications || [])
      ];

    return (
      <div className="w-[350px] h-[400px] overflow-y-scroll divide-y">
        {getNotificationApi.isFetching ? (
          <Skeleton />
        ) : notifications.length === 0 ? (
          <Empty description="Không có thông báo nào" />
        ) : (
          notifications.map((noti) => (
            <NotificationCard key={noti.id} notification={noti} />
          ))
        )}
      </div>
    );
  }, [
    realtimeNotifications,
    getNotificationApi.data?.data?.notifications,
    getNotificationApi.isFetching
  ]);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
      dispatch(logout());
      queryClient.clear();
      disconnectSocket();
      navigate('/login');
      setTimeout(() => {
      dispatch(resetJustLoggedOut());
    }, 0);
    } catch (error) {
      console.log('lỗi đăng xuất', error);
    }
  }

  return (
    <Layout className='min-h-screen'>
      <Header
        className={`sticky top-0 z-[1000] w-full flex items-center justify-between gap-3 px-4 md:px-6
                    transition-colors duration-500 ease-in-out bg-white`}
      >
        <Flex
          align="center"
          gap={8}
          className="cursor-pointer transition-colors duration-500 ease-in-out"
          onClick={() => navigate("/")}
        >
          {!screens.md && <Tooltip title='Menu'><Button type="text" icon={<BarsOutlined />} onClick={() => setOpenMenu(true)} /></Tooltip>}
          <Image src={iconApp} preview={false} width={24} height={27} />
          <Typography.Title level={4} className={`m-0`}>
            Travellian
          </Typography.Title>
        </Flex>

        {screens.md && (
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            className={`flex-1 justify-center border-b-0`}
          >
            <Menu.Item key="/" icon={<HomeOutlined />}>Trang chủ</Menu.Item>
            <Menu.Item key="/list-tour" icon={<UnorderedListOutlined />}>Danh sách tour</Menu.Item>
            <Menu.Item key="/order" icon={<ShopOutlined />}>Đơn hàng</Menu.Item>
          </Menu>
        )}

        <Flex align='center' gap={16} className='mr-0 md:mr-4'>
          {!isAuthenticated ? (<>
            <Button
              size="large"
              type="text"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </Button>
            <Button size="large" type="primary" onClick={() => navigate('/register')}>
              Đăng ký
            </Button>
          </>)
            :
            <div className="relative group flex items-center">
              {/* Avatar */}
              <Image
                preview={false}
                width={40}
                height={40}
                className="rounded-full object-cover bg-cyan-200 cursor-pointer"
                src={userInfo?.avatar_url || defaultAvatar}
              />
              <div
                className="absolute top-10 right-0 min-w-32 bg-white rounded-lg shadow-lg border 
               invisible group-hover:visible 
               transition duration-200 ease-in-out"
              >
                <ul className="text-base text-gray-700 m-0">
                  <li className="rounded-t-lg">
                    <Link
                      to="profile"
                      className="block w-full px-4 py-2 hover:bg-gray-100 hover:text-black rounded-t-lg"
                    >
                      <UserOutlined /> Tài khoản
                    </Link>
                  </li>
                  <li className="rounded-t-lg">
                    <Link
                      to="change-password"
                      className="block w-full px-4 py-2 hover:bg-gray-100 hover:text-black rounded-t-lg"
                    >
                      <UserOutlined /> Đổi mật khẩu
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="my-tickets"
                      className="block w-full px-4 py-2 hover:bg-gray-100 hover:text-black rounded-t-lg"
                    >
                      <ScheduleOutlined /> Vé của tôi
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="feedback"
                      className="block w-full px-4 py-2 hover:bg-gray-100 hover:text-black rounded-t-lg"
                    >
                      <MessageOutlined /> Hỗ trợ
                    </Link>
                  </li>
                  <li className="rounded-b-lg">
                    <Link
                      to="#"
                      className="block w-full px-4 py-2 hover:bg-gray-100 hover:text-black rounded-b-lg"
                      onClick={handleLogout}
                    >
                      <LogoutOutlined /> Đăng xuất
                    </Link>
                  </li>
                </ul>
              </div>
            </div>}
          {isAuthenticated && (
            <Popover title='Thông báo' trigger={'click'} content={contentNoti} onOpenChange={handleOpenNoti}>
            <Badge count={(getNotificationApi.data?.data?.unreadCount || 0) + realtimeUnread} size="small" offset={[-2, 2]}>
              <Button
                shape="circle"
                icon={<BellOutlined style={{ fontSize: "20px" }} />}
                size="large"
                className='w-[40px] h-[40px]'
              />
            </Badge>
          </Popover>)}
        </Flex>
      </Header>
      <Drawer
        placement='left'
        title="Menu"
        open={openMenu}
        onClose={() => setOpenMenu(false)}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => { navigate(key); setOpenMenu(false); }}
          className='border-0'
        >
          <Menu.Item key="/" icon={<HomeOutlined />}>Trang chủ</Menu.Item>
          <Menu.Item key="/list-tour" icon={<UnorderedListOutlined />}>Danh sách tour</Menu.Item>
          <Menu.Item key="/order" icon={<ShopOutlined />}>Đơn hàng</Menu.Item>
        </Menu>
      </Drawer>
      <Content className={`transition-all ease-in`}>
        <div className='relative'>
          <Outlet />
        </div>
        <FloatButton.Group className='transition-all ease-in-out'>
          <FloatButton.BackTop visibilityHeight={600} tooltip={'Về đầu trang'} icon={<UpOutlined />} />
          <FloatButton tooltip={'ChatBot'} icon={<CommentOutlined />} onClick={() => setOpenChat(true)} />
        </FloatButton.Group>
        <ChatBox open={openChat} setOpen={setOpenChat} />
      </Content>
      <Divider />
      <Footer style={{ background: "#0f1c2e", color: "#fff", padding: screens.md ? "40px 80px" : "32px 20px" }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 16 }}>
              <img src={iconAppLight} alt="Travellian" style={{ height: 40 }} />
            </div>
            <Typography.Text style={{ color: "#aaa" }}>
              Copyright © Travellian 2025 All rights reserved
            </Typography.Text>
          </Col>
          <Col xs={12} sm={12} md={4}>
            <Typography.Title level={5} style={{ color: "#fff" }}>Menu</Typography.Title>
            <Space direction="vertical">
              <a href="/" style={{ color: "#aaa" }}>Trang chủ</a>
              <a href="/list-tour" style={{ color: "#aaa" }}>Tour</a>
              <a href="/orders" style={{ color: "#aaa" }}>Đơn hàng</a>
            </Space>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Typography.Title level={5} style={{ color: "#fff" }}>Thông tin</Typography.Title>
            <Space direction="vertical">
              <Link to="/feedback" style={{ color: "#aaa" }}>Feedbacks</Link>
              <a href="/terms" style={{ color: "#aaa" }}>Điều khoản và dịch vụ</a>
              <a href="/privacy" style={{ color: "#aaa" }}>Chính sách</a>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Typography.Title level={5} style={{ color: "#fff" }}>Thông tin liên hệ</Typography.Title>
            <Space direction="vertical" style={{ color: "#aaa" }}>
              <Typography.Text style={{ color: "#aaa" }}>0964 219 404</Typography.Text>
              <Typography.Text style={{ color: "#aaa" }}>pduc942004@gmail.com</Typography.Text>
              <Typography.Text style={{ color: "#aaa" }}>Số 122 Hoàng Quốc Việt, Cầu Giấy, Hà Nội</Typography.Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Typography.Title level={5} style={{ color: "#fff" }}>Theo dõi</Typography.Title>
            <Space size="large">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <FacebookFilled style={{ fontSize: 20, color: "#fff" }} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                <InstagramFilled style={{ fontSize: 20, color: "#fff" }} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer">
                <TwitterSquareFilled style={{ fontSize: 20, color: "#fff" }} />
              </a>
            </Space>
          </Col>
        </Row>
      </Footer>
    </Layout>
  );
};

export default DefaultLayout;
