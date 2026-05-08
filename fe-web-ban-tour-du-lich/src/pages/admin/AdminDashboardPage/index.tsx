import React from "react";
import { Card, Col, Row, Statistic, Table, Tag, } from "antd";
import { ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Area, AreaChart, Legend } from 'recharts';
import { BookOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";

const AdminDashboardPage:React.FC = () => {
    const revenueThisMonth = 128_500_000;
    const recentOrders = [
        { key: 1, order_code: 'ORD-001', customer: 'Nguyễn Văn A', total: 3500000, status: 'completed' },
        { key: 2, order_code: 'ORD-002', customer: 'Trần Thị B', total: 2100000, status: 'pending' },
        { key: 3, order_code: 'ORD-003', customer: 'Lê Văn C', total: 5400000, status: 'confirmed' },
    ];
    const topTours = [
        { key: 1, title: 'Đà Nẵng – Hội An 3N2Đ', sold: 120, revenue: 240000000 },
        { key: 2, title: 'Đà Lạt 4N3Đ', sold: 80, revenue: 160000000 },
        { key: 3, title: 'Phú Quốc 5N4Đ', sold: 64, revenue: 192000000 },
    ];

    const orderColumns = [
        { title: 'Mã đơn', dataIndex: 'order_code', key: 'order_code' },
        { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
        { title: 'Tổng tiền', dataIndex: 'total', key: 'total', render: (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: string) => {
            const color = s === 'completed' ? 'green' : s === 'pending' ? 'orange' : 'blue';
            const label = s === 'completed' ? 'Hoàn tất' : s === 'pending' ? 'Chờ thanh toán' : 'Đã xác nhận';
            return <Tag color={color}>{label}</Tag>;
        } },
    ];
    const tourColumns = [
        { title: 'Tour', dataIndex: 'title', key: 'title' },
        { title: 'Đã bán', dataIndex: 'sold', key: 'sold' },
        { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', render: (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) },
    ];


    const chartData = [
        { name: 'T1', revenue: 12 },
        { name: 'T2', revenue: 18 },
        { name: 'T3', revenue: 15 },
        { name: 'T4', revenue: 22 },
        { name: 'T5', revenue: 28 },
        { name: 'T6', revenue: 35 },
        { name: 'T7', revenue: 32 },
        { name: 'T8', revenue: 40 },
        { name: 'T9', revenue: 38 },
        { name: 'T10', revenue: 50 },
        { name: 'T11', revenue: 48 },
        { name: 'T12', revenue: 56 },
    ];

    return (
        <div className="space-y-4 px-4 sm:px-6 md:px-8 lg:px-16">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title='Tổng số tour' prefix={<BookOutlined />} value={128} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title='Tổng người dùng' prefix={<UserOutlined/>} value={5320} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title='Tổng đơn hàng' prefix={<ShoppingOutlined />} value={870} />
                    </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                    <Card>
                        <Statistic title='Doanh thu tháng này' value={revenueThisMonth.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Đơn hàng gần đây" bodyStyle={{ paddingTop: 12 }}>
                        <Table columns={orderColumns} dataSource={recentOrders} pagination={false} size="middle" scroll={{ x: 600 }} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Tour bán chạy" bodyStyle={{ paddingTop: 12 }}>
                        <Table columns={tourColumns} dataSource={topTours} pagination={false} size="middle" scroll={{ x: 600 }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card title="Doanh thu 12 tháng">
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => `${v}m`} />
                                    <RechartsTooltip formatter={(v) => [`${Number(v).toLocaleString('vi-VN')} triệu`, 'Doanh thu']} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" name="Doanh thu (triệu)" stroke="#1677ff" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}


export default AdminDashboardPage;