import { Card, Col, Row, Space, Tag, Typography, Button, Modal } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import FormReview from "../FormReview";
import formatTime from "../../utils/formatTime";
import type { Order } from "../../types/order";
import Countdown from 'react-countdown';

interface OrderCardProps {
    order: Order;
    handlePayment?: (payment_url: string) => void;
    submitReview?: (value: unknown) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    handlePayment = () => { },
    submitReview = () => { },
}) => {
    const [isReviewing, setIsReviewing] = useState(false);
    const startDate = new Date(order.createdAt);
    const duration = 16 * 60 * 60 * 1000 + // 16 tiếng
        41 * 60 * 1000;      // 41 phút
    const endDate = new Date(startDate.getTime() + duration);


    return (
        <Card className="mb-4">
            {/* Trạng thái đơn */}
            <Space className="mb-4">
                <Typography.Title level={5} className="!m-0">{order?.order_code}</Typography.Title>

                {order.status === "confirmed" && (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Đã xác nhận
                    </Tag>
                )}
                {order.status === "pending" && (
                    <>
                        <Tag icon={<SyncOutlined spin />} color="processing">
                            Chờ thanh toán
                        </Tag>
                        <Countdown
                            date={endDate}
                            renderer={({ total, minutes, seconds }) => {
                                const hours = Math.floor(total / (1000 * 60 * 60));
                                return <Typography.Text strong type="danger">
                                    {String(hours).padStart(2, "0")}:
                                    {String(minutes).padStart(2, "0")}:
                                    {String(seconds).padStart(2, "0")}
                                </Typography.Text>
                            }}
                        />
                    </>

                )}
                {order.status === "completed" && (
                    <Tag icon={<ExclamationCircleOutlined />} color="warning">
                        Đã kết thúc
                    </Tag>
                )}
                {order.status === "cancelled" && (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                        Đã hủy
                    </Tag>
                )}
            </Space>

            {/* Thông tin tour */}
            <Row gutter={[16, 12]} className="mb-4">
                <Col xs={24} sm={6}>
                    <img
                        src={order.tour.main_image}
                        className="lg:w-3/4 w-full h-24 sm:h-24 object-cover rounded-lg"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <Typography.Text strong className="block">{order.tour.title}</Typography.Text>
                    <Typography.Text type="secondary" className="block">Mã tour: {order?.tour?.tour_code}</Typography.Text>
                </Col>
                <Col xs={24} sm={6} className="sm:text-right">
                    <Typography.Text strong>Số lượng vé: x{order?.quantity}</Typography.Text>
                </Col>
            </Row>

            {/* Thanh toán + hành động */}
            <Row gutter={[16, 12]} align="middle" className="mb-2">
                <Col xs={24} sm={12}>
                    <Space direction="vertical" align="start">
                        <Typography.Text>
                            Trạng thái thanh toán:{" "}
                            <b>{order?.is_paid ? "Đã thanh toán" : "Chờ thanh toán"}</b>
                        </Typography.Text>
                        <Typography.Text type="secondary">Cập nhật: {formatTime(order?.updatedAt)}</Typography.Text>
                    </Space>
                </Col>
                <Col xs={24} sm={12} className="sm:text-right">
                    <Space direction="vertical" align="end" className="w-full">
                        <Typography.Text strong>
                            Tổng tiền:{" "}
                            <span style={{ color: "#ee4d2d" }}>
                                {order.total_price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </span>
                        </Typography.Text>
                        <Space wrap className="justify-start sm:justify-end w-full">
                            {order.status === "completed" && (
                                <>
                                    <Button
                                        color="danger"
                                        variant="filled"
                                        disabled={order.is_review}
                                        onClick={() => setIsReviewing(true)}
                                    >
                                        Đánh giá tour
                                    </Button>
                                    <Modal
                                        open={isReviewing}
                                        onCancel={() => setIsReviewing(false)}
                                        footer={null}
                                        title="Đánh giá"
                                        centered
                                        width={650}
                                        style={{ maxWidth: "95vw" }}
                                    >
                                        <FormReview
                                            onClose={() => setIsReviewing(false)}
                                            tour={{
                                                id: Number(order?.tour_id),
                                                name: order?.tour?.title,
                                                tour_code: order?.tour?.tour_code,
                                                image: order?.tour?.main_image,
                                            }}
                                            onSubmit={(data) => {
                                                submitReview({ ...data, order_id: order.id });
                                                setIsReviewing(false);
                                            }}
                                        />
                                    </Modal>
                                </>
                            )}
                            {order.status === "pending" && (
                                <>
                                    <Button type="primary" onClick={() => handlePayment(order.payment_url!)}>
                                        Thanh toán
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default OrderCard;
