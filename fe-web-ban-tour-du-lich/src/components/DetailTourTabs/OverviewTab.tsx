import { Carousel, Descriptions, Image, Rate, Space, Typography } from "antd";

interface OverviewTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}
const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <Typography.Title level={3}>{data.title}</Typography.Title>
      <Space>
        <Rate disabled allowHalf defaultValue={data.rating} style={{ color: "#fadb14" }} />
        <Typography.Text strong>{data.rating}</Typography.Text>
        <Typography.Text type="secondary">({data.total_reviews} đánh giá)</Typography.Text>
      </Space>
      <Typography.Paragraph className="text-justify">
        {data.description}
      </Typography.Paragraph>

      <Descriptions
        column={1}
        size="middle"
        labelStyle={{ fontWeight: "bold", width: 150, color: "#DF6951" }}
      >
        <Descriptions.Item label="Điểm đến">{data.destination}</Descriptions.Item>
        <Descriptions.Item label="Danh mục">{data.categories.map(i => i.category).join(", ")}</Descriptions.Item>
        <Descriptions.Item label="Vùng">{data.region === 'northern' ? 'Miền Bắc' : data.region === 'central' ? 'Miền Trung' : 'Miền Nam'}</Descriptions.Item>
        <Descriptions.Item label="Khởi hành từ">{data.departure}</Descriptions.Item>
        <Descriptions.Item label="Ngày bắt đầu">{data.start_date}</Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc">{data.end_date}</Descriptions.Item>
        <Descriptions.Item label="Thời gian">{data.duration}</Descriptions.Item>
        <Descriptions.Item label='Đã bán'>{data.tickets_sold}/{data.capacity}</Descriptions.Item>
        <Descriptions.Item label='Giá vé'>{data.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</Descriptions.Item>
        <Descriptions.Item label="Bao gồm">
          {data.includes.map(i => i.item).join(", ")}
        </Descriptions.Item>
        <Descriptions.Item label="Không bao gồm">
          {data.excludes.map(i => i.item).join(", ")}
        </Descriptions.Item>
      </Descriptions>
      <Carousel arrows infinite={false} draggable dotPosition="bottom">
        {data.gallery.map((img) => (
          <div key={img.id}>
            <div className="h-48 sm:h-56 md:h-64 [&_.ant-image]:h-full [&_.ant-image]:w-full">
              <Image
                src={img.image_url}
                alt={`Gallery ${img.id}`}
                className="w-full !h-full object-cover object-center"
              />
            </div>

          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default OverviewTab;
