import React, { useState } from "react";
import { Table, Button, Space, Modal, Form, Input, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined } from "@ant-design/icons";
import type { TourCategory } from "../../types/tour";

interface CategoryTableProps {
  categories: TourCategory[];
  pagination: {pageSize: number, total: number};
  handleAddCategory: (category: Omit<TourCategory, "id">) => void;
  handleUpdateCategory: (id: number, category: Omit<TourCategory, "id">) => void;
  handleDeleteCategory: (id: number) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  pagination,
  handleAddCategory,
  handleUpdateCategory,
  handleDeleteCategory,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TourCategory | null>(null);
  const [form] = Form.useForm();

  //Mở modal thêm/sửa
  const openModal = (category?: TourCategory) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingCategory) {
        handleUpdateCategory(editingCategory.id, values);
      } else {
        handleAddCategory(values);
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const columns: ColumnsType<TourCategory> = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Tên danh mục", dataIndex: "category", key: "category" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xoá danh mục?"
            description={`Bạn có chắc muốn xoá "${record.category}"?`}
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => {
              handleDeleteCategory(record.id);
            }}
          >
            <Button type="link" danger>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <Button type="primary" onClick={() => openModal()}>
          <PlusOutlined/> Thêm danh mục
        </Button>
      </div>

      <Table columns={columns} dataSource={categories} rowKey="id" scroll={{ x: 992 }} bordered 
        pagination={{ position: ['bottomRight'], pageSize:pagination.pageSize, total: pagination.total,
        showSizeChanger: false
        }}
      />

      <Modal
        title={editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Lưu"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên danh mục"
            name="category"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Ví dụ: Leo núi, Tham quan,..." />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về danh mục" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryTable;
