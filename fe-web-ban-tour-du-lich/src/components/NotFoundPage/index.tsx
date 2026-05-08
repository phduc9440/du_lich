import React from "react";
import { Button, Typography, Flex } from "antd";
import { useNavigate } from "react-router-dom";
import { FrownOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Flex
      vertical
      justify="center"
      align="center"
      style={{
        height: "100vh",
        background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <FrownOutlined style={{ fontSize: 100, color: "#ff6b6b", marginBottom: 20 }} />

      <Title level={1}>
        404 - Trang không tồn tại
      </Title>
      <Paragraph style={{ color: "#6c757d", fontSize: 16, maxWidth: 400 }}>
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        <br />
        Vui lòng quay lại trang chủ.
      </Paragraph>

      <Flex gap={12}>
        <Button type="primary" size="large" onClick={() => navigate("/")}>
          Về trang chủ
        </Button>
        <Button size="large" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Flex>
    </Flex>
  );
};

export default NotFoundPage;