import { Card, Typography, Rate, Flex, Avatar } from "antd";
import formatTime from "../../utils/formatTime";

interface ReviewCardProps {
  avatar_url: string;
  content: string;
  username: string;
  create_at: string;
  rating?: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  avatar_url,
  content,
  username,
  create_at,
  rating = 5,
}) => {
  return (
    <Card
      className="w-[600px]"
    >
      <Avatar
        src={avatar_url}
        size={64}
        className="absolute -top-8 left-6 border-2 border-white shadow-md"
      />

      <Flex vertical gap={16}>
        <Typography.Paragraph className="mt-4 text-sm" ellipsis={{ rows: 3 }}>
          {content}
        </Typography.Paragraph>

        <Rate disabled defaultValue={rating} style={{ color: "#fadb14" }} />

        <div>
          <Typography.Text strong style={{ fontSize: 16 }}>
            {username}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary">{formatTime(create_at)}</Typography.Text>
        </div>
      </Flex>
    </Card>
  );
};

export default ReviewCard;
