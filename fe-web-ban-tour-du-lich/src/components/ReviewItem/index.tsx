import { Avatar, Rate, Typography, Image, Space, Divider, Flex } from "antd";
import { UserOutlined, } from "@ant-design/icons";
import type { Review } from "../../types/review";
import formatTime from "../../utils/formatTime";

type ReviewItemProps = {
    review: Review;
};

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {

    return (
        <div className="space-y-4">
            <Flex justify="space-between" align="center"
                className="w-full"
            >
                <Space align="start" size="middle">
                    <Avatar
                        size="large"
                        src={review.avatar_url}
                        icon={!review.avatar_url && <UserOutlined />}
                    />
                    <div>
                        <Typography.Text strong>{review.username}</Typography.Text>
                        <br />
                        <Rate disabled value={review.rating} />
                    </div>
                </Space>
            </Flex>
            <Typography.Text type="secondary">{formatTime(review.created_at)}</Typography.Text>
            <div className="space-y-3 space-x-2">
                {review.contents.map((item, index) => {
                    if (item.type === "text") {
                        return (
                            <Typography.Paragraph key={index}>
                                {item.content}
                            </Typography.Paragraph>
                        );
                    }

                    if (item.type === "image") {
                        return (
                            <Image
                                key={index}
                                src={item.content}
                                alt="review-img"
                                width={120}
                                className="rounded-lg"
                            />
                        );
                    }

                    return null;
                })}
            </div>

            <Divider />
        </div>
    );
};

export default ReviewItem;