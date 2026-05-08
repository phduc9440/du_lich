import type React from "react";
import type { Ticket } from "../../types/ticket";
import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { ArrowRightOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import formatTime from "../../utils/formatTime";

interface TicketCardProps {
    ticket: Ticket
}

const TicketCard:React.FC<TicketCardProps> = ({ticket}) => {
    return (
        <Card className="bg-gradient-to-r from-orange-400 to-yellow-300">
            <Space wrap>
                <Typography.Title level={5}>{ticket.ticket_code}</Typography.Title>
                {ticket.status === 'active' && <Tag icon={<CheckCircleOutlined />} color="success">Còn hạn</Tag>}
                {ticket.status === 'used' && <Tag icon={<ExclamationCircleOutlined />} color="warning">Hết hạn</Tag>}
                {ticket.status === 'cancelled' && <Tag icon={<CloseCircleOutlined />} color="error">Đã hủy</Tag>}
            </Space>
            <Row gutter={[16, 12]}>
                <Col xs={24} md={8}>
                    <div className="flex gap-4 items-center">
                        <img src={ticket.tour.main_image} alt={ticket.tour.title} className="w-[48px] h-[48px] object-cover rounded"/>
                        <Space direction="vertical" size={2}>
                            <Typography.Text>{ticket.tour.title}</Typography.Text>
                            <Typography.Text strong>{ticket.tour.tour_code}</Typography.Text>
                        </Space>
                    </div>
                </Col>
                <Col xs={24} md={8}>
                    <Space direction="vertical" size={2}>
                        <Typography.Text><span className="font-bold">Người đặt vé:</span> {ticket.user.username}</Typography.Text>
                        <Typography.Text><span className="font-bold">Số điện thoại:</span> {ticket.user.phone}</Typography.Text>
                        <Typography.Text><span className="font-bold">Email:</span> {ticket.user.email}</Typography.Text>
                    </Space>
                </Col>
                <Col xs={24} md={8}>
                    <Space direction="vertical" size={2}>
                        <Typography.Text><span className="font-bold">Thời gian xuất vé:</span> {formatTime(ticket.issue_date)}</Typography.Text>
                        <Typography.Text><span className="font-bold">Hiệu lực:</span> {formatTime(ticket.valid_from)} <ArrowRightOutlined/> {formatTime(ticket.valid_until)}</Typography.Text>
                        <Typography.Text><span className="font-bold">Hướng dẫn viên:</span> {ticket.guide?.username}</Typography.Text>
                        <Typography.Text><span className="font-bold">Số điện thoại:</span> {ticket.guide?.phone}</Typography.Text>
                    </Space>
                </Col>
            </Row>
        </Card>
    )
}
export default TicketCard;