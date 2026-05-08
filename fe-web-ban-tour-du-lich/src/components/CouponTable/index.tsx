import React, { useState } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { Coupon, UpsertCoupon } from "../../types/coupon";
import dayjs from "dayjs";

interface CouponTableProps {
  data?: Coupon[];
  pagination: { page: number; pageSize: number, total: number };
  onCreate?: (payload: UpsertCoupon) => void;
  onUpdate?: (id: number, payload: UpsertCoupon) => void;
  onDelete?: (id: number) => void;
  onTableChange: (pagination, filters, sorter) => void;
}

const CouponTable: React.FC<CouponTableProps> = ({ data, onCreate, onUpdate, onDelete, pagination, onTableChange }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const onEdit = (record: Coupon) => {
    console.log('abc',record);
    
    setEditing(record);
    setOpen(true);
    form.setFieldsValue({
      code: record.code,
      description: record.description ?? undefined,
      discount_amount: record.discount_amount ?? undefined,
      discount_percent: record.discount_percent ?? undefined,
      discount_limit: record.discount_limit ?? undefined,
      expire_at: record.expire_at ? dayjs(record.expire_at) : undefined,
      is_active: record.is_active,
      max_use: record.max_use,
    });
  };

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
    form.resetFields();
    form.setFieldsValue({ is_active: true, max_use: 1 });
  };

  const columns: ColumnsType<Coupon> = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "%", dataIndex: "discount_percent", key: "discount_percent", render: (v) => v ?? "-" },
    { title: "Giảm (đ)", dataIndex: "discount_amount", key: "discount_amount", render: (v) => v ? v.toLocaleString("vi-VN") : "-" },
    { title: "Giới hạn (đ)", dataIndex: "discount_limit", key: "discount_limit", render: (v) => v ? v.toLocaleString("vi-VN") : "-" },
    { title: "Hết hạn", dataIndex: "expire_at", key: "expire_at" },
    { title: "Tối đa", dataIndex: "max_use", key: "max_use" },
    { title: "Trạng thái", dataIndex: "is_active", key: "is_active", render: (b: boolean) => <Tag color={b ? "green" : "red"}>{b ? "Active" : "Inactive"}</Tag> },
    {
      title: "Thao tác", key: "action", render: (_, record) => (
        <>
          <Tooltip title="Chỉnh sửa">
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm title="Xóa mã giảm giá?" okText='Xác nhận' cancelText='Đóng' onConfirm={() => onDelete?.(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </>
      )
    },
  ];

  const handleOk = async () => {
    try {
      const values = await form.getFieldsValue();
      const payload: UpsertCoupon = {
        ...values,
        expire_at: values.expire_at ? values.expire_at.format("YYYY-MM-DD") : undefined,
        discount_limit: values.discount_limit || undefined,
      };
      if (editing) {
        await onUpdate?.(editing.id, payload);
      } else {
        await onCreate?.(payload);
      }
      setOpen(false);
      form.resetFields();
    } catch (error) {
      // Validation errors will be shown by Ant Design Form
      console.error('Form validation error:', error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>Thêm mã</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: 900 }}
        pagination={{ position: ['bottomRight'], pageSize: pagination.pageSize,
        current: pagination.page, total: pagination.total,
        showSizeChanger: false}}
        onChange={onTableChange}
      />
      <Modal open={open} onCancel={() => setOpen(false)} onOk={handleOk} title={editing ? "Cập nhật mã" : "Thêm mã"}>
        <Form form={form} layout="vertical">
          <Form.Item label="Mã" name="code" rules={[{ required: true, message: "Vui lòng nhập mã" }]}>
            <Input placeholder="VD: SALE10" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size="middle" className="w-full">
            <Form.Item label="Giảm %" name="discount_percent" className="flex-1" rules={[{ type: 'number', min: 0, max: 100 }]}>
              <InputNumber className="w-full" placeholder="0-100" />
            </Form.Item>
            <Form.Item label="Giảm tiền (đ)" name="discount_amount" className="flex-1" rules={[{ type: 'number', min: 0 }]}>
              <InputNumber className="w-full" placeholder="Ví dụ: 50000" />
            </Form.Item>
          </Space>
          <Form.Item label="Ngày hết hạn" name="expire_at">
            <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Chọn ngày hết hạn" />
          </Form.Item>
          <Space size="middle" className="w-full">
            <Form.Item label="Tối đa lượt dùng" name="max_use" className="flex-1" rules={[{ required: true, type: 'number', min: 1 }]}>
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="Giới hạn giảm giá (đ)" name="discount_limit" className="flex-1" rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber className="w-full" placeholder="Ví dụ: 200000" />
            </Form.Item>
            <Form.Item label="Kích hoạt" name="is_active" valuePropName="checked" className="flex-1">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

export default CouponTable;


