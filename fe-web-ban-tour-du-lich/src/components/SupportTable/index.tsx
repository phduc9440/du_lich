import { Table, Tag, Button, Space, Typography, Popconfirm } from "antd";
import type { Support } from "../../types/support";
import { CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import formatTime from "../../utils/formatTime";

interface SupportTableProps {
  supports: Support[];
  handleChangeStatus: (id: number) => void;
  handleViewDetail: (support: Support) => void;
}

const SupportTable: React.FC<SupportTableProps> = ({
  supports,
  handleChangeStatus,
  handleViewDetail,
}) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Người dùng",
      dataIndex: "user_id",
      key: "user_id",
      render: (id) => <Typography.Text strong>#{id}</Typography.Text>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Nội dung",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (text) => (text ? text.slice(0, 60) + (text.length > 60 ? "..." : "") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => status === 'pending' ? <Tag icon={<SyncOutlined spin />} color="processing">Chờ xử lý</Tag> : <Tag icon={<CloseCircleOutlined />} color="error">Đã xử lý</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? formatTime(date) : "Không có",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleViewDetail(record)}>
            Chi tiết
          </Button>

          {record.status !== "closed" && (
            <Popconfirm
              title="Xác nhận đóng yêu cầu?"
              okText="Đóng"
              cancelText="Huỷ"
              onConfirm={() => handleChangeStatus(record.id)}
            >
              <Button type="link" danger disabled={record.status === "cancelled"}>
                Đóng
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={supports}
      scroll={{ x: 992 }}
      size="middle"
      pagination={{ pageSize: 10 }}
      bordered
    />
  );
};

export default SupportTable;
