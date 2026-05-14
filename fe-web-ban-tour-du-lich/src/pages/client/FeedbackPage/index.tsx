/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Typography, Space, Form, Input, Button, Flex, message } from "antd";
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useCreateFeedback } from "../../../services/supportService";

const { Title, Text } = Typography;

const FeedbackPage: React.FC = () => {
  const [form] = Form.useForm();
  // call api
  const createFeedbackApi = useCreateFeedback();

  const handleSubmit = async (values: any) => {
    try {
      await createFeedbackApi.mutateAsync(values);
      form.resetFields();
      message.success("Gửi phản hồi thành công!");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-200 to-orange-400 p-10 rounded-xl">
      <Row gutter={[40, 40]} align="middle" justify="center">
        <Col xs={24} md={10}>
          <Flex vertical>
            <Title level={3} className="!text-gray-900 !mb-2">
              Gặp vấn đề về hệ thống?
            </Title>
            <Text className="text-gray-700">
              Vui lòng phản hồi, chúng tôi sẽ khắc phục sự cố sớm nhất có thể.
            </Text>
  
            <Space
              direction="vertical"
              size="large"
              className="mt-6 text-gray-800"
            >
              <Space>
                <EnvironmentOutlined className="text-orange-500 text-lg" />
                <Text>Số 122 Hoàng Quốc Việt, phường Nghĩa Đô, thành phố Hà Nội</Text>
              </Space>
  
              <Space className="px-3 py-2 border border-orange-500 rounded-md">
                <PhoneOutlined className="text-orange-500 text-lg" />
                <Text strong>0964 219 404</Text>
              </Space>
  
              <Space>
                <MailOutlined className="text-orange-500 text-lg" />
                <Text>pduc942004@gmail.com</Text>
              </Space>
            </Space>
          </Flex>
        </Col>

        <Col xs={24} md={12}>
          <div className="bg-white/60 p-6 rounded-xl shadow-md">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="title"
                label={<span className="font-semibold text-gray-700">Vấn đề</span>}
                rules={[{ required: true, message: "Vui lòng nhập vấn đề bạn gặp phải" }]}
              >
                <Input placeholder="Nhập vấn đề..." />
              </Form.Item>
              <Form.Item
                name="message"
                label={<span className="font-semibold text-gray-700">Nội dụng</span>}
                rules={[{ required: true, message: "Vui lòng nhập nội dung chi tiết" }]}
              >
                <Input.TextArea rows={4} placeholder="Nhập nội dung" />
              </Form.Item>

              <Form.Item className="text-center">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="!bg-orange-500 hover:!bg-orange-600 !border-none rounded-full px-8 py-5"
                >
                  Gửi
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default FeedbackPage;
