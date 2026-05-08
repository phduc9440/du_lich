import { Card, Typography, Rate, Flex, Image, Tag } from "antd";
import type { Tour } from "../../types/tour";
import { EnvironmentOutlined, FireFilled } from "@ant-design/icons";

interface SuggestTravelCardProps {
  item: Tour
  onClick: () => void;
}

const SuggestTravelCard: React.FC<SuggestTravelCardProps> = ({ item, onClick }) => {
  return (
    <Card
      onClick={onClick}
      hoverable
      cover={
        <div className="relative">
          <Image
            preview={false}
            alt={item.title}
            src={item.main_image}
            height={140}
            width={"100%"}
            style={{
              objectFit: "cover",
            }}
          />
          <div className="absolute top-0 right-0">
            <Tag color="#f50" icon={<FireFilled />} className="m-0">Đề xuất</Tag>
          </div>
        </div>
      }
      className="overflow-hidden shadow-md"
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: '#FFF8F1'
        },
      }}
    >
      <Typography.Paragraph strong ellipsis={{rows: 1}}>
        {item.title}
      </Typography.Paragraph>
      <Typography.Paragraph ellipsis={{rows: 1}}>
        <EnvironmentOutlined /> {item.destination}
      </Typography.Paragraph>
      <Rate disabled defaultValue={Number(item.rating)} style={{ fontSize: 14 }} />

      <Typography.Paragraph
        ellipsis={{ rows: 3 }}
        style={{ marginTop: 8, fontSize: 13, color: "#555" }}
      >
        {item.description}
      </Typography.Paragraph>

      <Flex justify="space-between" align="center"
      >
        <Typography.Text strong>
          {Number(item.price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
        </Typography.Text>
      </Flex>
    </Card>
  );
};

export default SuggestTravelCard;
