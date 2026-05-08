import React from "react";
import { Button, Form, Input, message, Select, Typography } from "antd";
import { useAdminCreateAccout } from "../../../services/adminService";
import { queryClient } from "../../../configs/queryClient";


const AdminCreateAccountPage: React.FC = () => {
  const [form] = Form.useForm();
  // call api
  const adminCreateAccountApi = useAdminCreateAccout();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRegister = async (value: any) => {
    try {
      await adminCreateAccountApi.mutateAsync(value);
      queryClient.refetchQueries({ queryKey: ['adminAllGuidesWithTourCount'], exact: false });
      form.resetFields();
      message.success('Tạo tài khoản nhân viên thành công.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi đăng ký.")
    }
  }

  return (

    <div className="flex justify-center">
      <div className="bg-white/80 backdrop-blur-sm py-8 px-12 rounded-lg shadow-lg flex flex-col items-center lg:w-1/2 lg:mx-0 w-full">
        <Typography.Title level={3} className="text-center">
          Thêm tài khoản nhân viên
        </Typography.Title>
        <Form form={form} layout="vertical" className="w-full" onFinish={handleRegister}>
          <Form.Item
            label="Họ và tên"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên." }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email." },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input placeholder="example@gmail.com" />
          </Form.Item>
          <Form.Item
            label="Vai trò"
            name="role"
            required
            rules={[{ required: true, message: "Vui lòng chọn vai trò." }]}
          >
            <Select
              placeholder="Chọn vai trò"
              options={[
                { value: 'super_admin', label: 'Quản lý' },
                { value: 'employee', label: 'Nhân viên' },
                { value: 'guide', label: 'Hướng dẫn viên' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Vùng"
            name="region"
            required
            rules={[{ required: true, message: "Vui lòng chọn vùng." }]}
          >
            <Select
              placeholder="Chọn vùng"
              options={[
                { value: 'northern', label: 'Miền Bắc' },
                { value: 'central', label: 'Miền Trung' },
                { value: 'southern', label: 'Miền Nam' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại." },
              { pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: "Số điện thoại không hợp lệ!" }
            ]}>
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu." },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!",
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={adminCreateAccountApi.isPending}>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
};

export default AdminCreateAccountPage;
