import { Card, Typography, Space, Flex, } from "antd";
import { ArrowRightOutlined, CalendarOutlined, EnvironmentOutlined, StarFilled } from "@ant-design/icons";
import type { Tour } from "../../types/tour";

interface TourCardProps {
    tour: Tour;
    onClick?: () => void;
}

const TourCard: React.FC<TourCardProps> = ({tour, onClick,}) => {
    return (
        <Card
            hoverable
            className="flex flex-col rounded-xl overflow-hidden shadow-md min-h-[300px]
                       transform transition-transform duration-300
                       hover:scale-105 hover:-translate-y-2 hover:-translate-x-2"
            styles={{
                body: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                },
            }}
            onClick={onClick}
            cover={<div className="relative">
                <img src={tour.main_image} alt={tour.title} width={"100%"} className="object-cover h-[140px] sm:h-[160px] md:h-[180px]" />
                <div className="w-full px-1.5 py-1 bg-[#E85A4F] text-white flex justify-between items-center text-xs font-medium
                                absolute bottom-0 left-0">
                    <div>
                        <CalendarOutlined /> {tour.start_date}
                    </div>
                    <ArrowRightOutlined />
                    <div>
                        <CalendarOutlined /> {tour.end_date}
                    </div>
                </div>
            </div>}
        >

            <Flex vertical style={{ flex: 1 }}>
                <Typography.Title level={5}>{tour.tour_code}</Typography.Title>
                <Typography.Paragraph strong ellipsis={{ rows: 1 }} className="!mb-1">
                    {tour.title}
                </Typography.Paragraph>
                <Typography.Paragraph ellipsis={{ rows: 1 }}><EnvironmentOutlined /> {tour.destination}</Typography.Paragraph>
                <Typography.Paragraph className="!text-gray-600 !mt-1" ellipsis={{ rows: 3 }} style={{ flex: 1 }}>
                    {tour.description}
                </Typography.Paragraph>
                <Space size={"middle"}>
                    <Typography.Text className="font-semibold text-green-600">
                        {Number(tour.price).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </Typography.Text>
                    <div>
                        <StarFilled className="text-red-500 mr-1" />
                        <Typography.Text className="text-gray-700">{tour.rating}</Typography.Text>
                    </div>
                </Space>
            </Flex>
        </Card>
    );
};

export default TourCard;
