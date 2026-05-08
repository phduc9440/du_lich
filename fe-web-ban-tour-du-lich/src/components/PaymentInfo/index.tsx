import { Button, Col, Row, Space, Typography } from "antd";

interface PaymentInfoProps {
    tourInfo: {
        title: string;
        tour_code: string;
        start_date: string;
        end_date: string;
    },
    ticketInfo: {
        quantity: number,
        unitPrice: number
    },
    orderInfo: {
        order_code: string;
        payment_url: string;
        discount: number;
    }
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ tourInfo, ticketInfo, orderInfo }) => {
    return (
        <Row gutter={[16, 16]}>
            <Col span={15}>
                <Space direction="vertical" className="w-full" size="small">
                    <Typography.Title level={5}>Mã đơn hàng: {orderInfo.order_code}</Typography.Title>
                    <div>
                        <Typography.Title level={5}>Thông tin tour</Typography.Title>
                        <Typography.Paragraph>
                            <strong>Mã:</strong> {tourInfo.tour_code}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Tên:</strong> {tourInfo.title}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Ngày bắt đầu:</strong> {tourInfo.start_date}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Ngày kết thúc:</strong> {tourInfo.end_date}
                        </Typography.Paragraph>
                    </div>
                    <div>
                        <Typography.Title level={5}>Chi tiết thanh toán</Typography.Title>
                        <Typography.Paragraph>
                            <strong>Số lượng vé:</strong> {ticketInfo.quantity}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Đơn giá:</strong> {ticketInfo.unitPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Giảm giá:</strong> {orderInfo.discount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <strong>Tổng tiền:</strong> <span style={{ fontSize: '18px', color: '#1890ff' }}>{(ticketInfo.quantity * ticketInfo.unitPrice - orderInfo.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
                        </Typography.Paragraph>
                    </div>

                    <Typography.Paragraph type="warning">
                        Vui lòng kiểm tra kỹ thông tin trước khi thanh toán. Sau khi thanh toán thành công, vé sẽ được gửi đến email của bạn.
                    </Typography.Paragraph>
                </Space>
            </Col>
            <Col span={9} className="flex flex-col items-center justify-center">
                <Button type="primary" href={orderInfo.payment_url} target="_blank" className="mt-4">
                    Mở trang thanh toán
                </Button>
                <Typography.Paragraph type="secondary" className="mt-4 text-center">
                    Dùng ứng dụng ngân hàng hoặc ví điện tử quét mã QR trên để hoàn tất thanh toán qua.
                </Typography.Paragraph>
            </Col>
        </Row>
    );
};

export default PaymentInfo;