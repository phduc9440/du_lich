import { Flex, Tag, Typography } from "antd";
import type { AppNotification } from "../../types/notification";
import formatTime from "../../utils/formatTime";
interface NotificationCardProps {
    notification: AppNotification,
}

const NotificationCard:React.FC<NotificationCardProps> = ({notification}) => {
    return(
            <div className={`p-4 ${notification.is_read ? 'bg-white' :'bg-gray-100'} flex flex-col gap-2`}>
                <Flex justify="space-between" align="center">
                    <Typography.Title level={5} className="truncate">{notification.title}</Typography.Title>
                    <Tag color="warning">{notification.type}</Tag>
                </Flex>
                <Typography.Text>{notification.message}</Typography.Text>
                <Typography.Text type="secondary">{formatTime(notification.created_at)}</Typography.Text>
            </div>
    );
}

export default NotificationCard;