import { CalendarOutlined } from "@ant-design/icons";
import { Card, Col, Divider, Flex, InputNumber, Row, Space, Typography } from "antd";
import type React from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { setTicketQuantity } from "../../features/ticket/tickectSlice";

interface OrderOverviewCardProps {
  title: string;
  start_date: string;
  end_date: string;
  imageUrl: string;
  tickets: {
    unitPrice: number;
    quantity: number;
  };
  totalPrice: number;
}

const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  title, start_date, end_date, imageUrl, tickets, totalPrice
}) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <Card>
      <Typography.Title level={4} className="!mb-3">Tổng quan vé của bạn</Typography.Title>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={10}>
          <img
            src={imageUrl}
            alt={title}
            style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
          />
        </Col>
        <Col xs={24} sm={14}>
          <Typography.Title level={5} className="!mb-1">{title}</Typography.Title>
          <Space direction="vertical" size={2}>
            <Typography.Text><CalendarOutlined /> Từ {start_date}</Typography.Text>
            <Typography.Text><CalendarOutlined /> Đến {end_date}</Typography.Text>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Flex vertical className="mt-2" gap={12}>
          <Space size="small" align="center">
            <Typography.Text>Số vé:</Typography.Text>
            <InputNumber
              min={1}
              value={tickets.quantity}
              onChange={(value) => {
                if (value !== null) {
                  dispatch(setTicketQuantity(value));
                }
              }}
              className="w-full sm:w-[140px] [&_.ant-input-number-input]:text-center"
            />
            {tickets.quantity > 1 && (
              <Typography.Text>({tickets.unitPrice.toLocaleString("vi-VN")} đ / vé)</Typography.Text>
            )}
          </Space>
      </Flex>

      <Divider />

      <Flex justify="space-between" align="center" className="my-2">
        <Typography.Text strong>Tổng thanh toán</Typography.Text>
        <Typography.Title level={5} className="!my-0 !text-[#FA8B02]">
          {totalPrice.toLocaleString("vi-VN")} đ
        </Typography.Title>
      </Flex>
    </Card>
  );
};

export default OrderOverviewCard;