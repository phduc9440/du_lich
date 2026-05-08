/* eslint-disable @typescript-eslint/no-explicit-any */
import { CloseOutlined, LoadingOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Upload,
  Image,
  Switch,
  Divider,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { resizeImage } from "../../utils/resizeImage";
import { uploadImagesCloudinary } from "../../utils/uploadImagesCloudinary";
import type { TourCategory } from "../../types/tour";

interface FormTourProps {
  type: "add" | "edit";
  initialValues?: any;
  onSubmit: (values: any) => void;
  categories?: TourCategory[];
  loading?: boolean;
}

const FormTour: React.FC<FormTourProps> = ({
  type,
  initialValues,
  onSubmit,
  categories = [],
  loading
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [gallery, setGallery] = useState(
    initialValues?.gallery || []
  );
  const [thumbnail, setThumbnail] = useState<string>(initialValues?.main_image || "");
  const [isLoadingUpThumbnail, setIsLoadingUpThumbnail] = useState(false);
  const [isLoadingUpGallery, setIsLoadingUpGallery] = useState(false);

  /** upload ảnh thumbnail */
  const handleUploadThumbnail = async (info: any) => {
    setIsLoadingUpThumbnail(true);
    const file = info.file.originFileObj || info.file;
    if (!file) return;
    const base64 = await resizeImage(file);
    const url = await uploadImagesCloudinary([base64]);
    setIsLoadingUpThumbnail(false);
    setThumbnail(url[0]);
  };

  /** upload ảnh */
  const handleUploadImg = async (info: any) => {
    setIsLoadingUpGallery(true);
    const file = info.file.originFileObj || info.file;
    if (!file) return;

    const base64 = await resizeImage(file);
    const url = await uploadImagesCloudinary([base64]);
    setIsLoadingUpGallery(false);

    setGallery((prev) => [
      ...prev,
      { image_url: url[0] }   // chuẩn lại format của bạn
    ]);
  };


  const handleFinish = (values: any) => {
    // Chuyển categories (mảng số) → chuỗi "1,2,3"
    const categoriesStr = values.categories?.join(",");

    // Đảm bảo includes/excludes không undefined
    const includesPayload = values.includes?.map((i: any) => ({ item: i.item })) || [];
    const excludesPayload = values.excludes?.map((i: any) => ({ item: i.item })) || [];

    // schedule giữ nguyên mảng object từ form
    const schedulePayload = values.schedule?.map((s: any) => ({
      day_number: s.day_number,
      title: s.title,
      detail: s.detail,
    })) || [];

    const payload = {
      ...values,
      main_image: thumbnail,
      categories: categoriesStr,       // "1,2,3"
      gallery,         // [{ image_url: ... }, ...]
      includes: includesPayload,       // [{ item: ... }, ...]
      excludes: excludesPayload,       // [{ item: ... }, ...]
      schedule: schedulePayload,       // [{ day_number, title, detail }, ...]
      start_date: values.start_date?.format("YYYY-MM-DD"),
      end_date: values.end_date?.format("YYYY-MM-DD"),
    };

    onSubmit(payload);

    if (type === "add") {
      form.resetFields();
      setGallery([]);
      setThumbnail("");
    }
  };



  return (
    <Form
      layout="vertical"
      form={form}
      requiredMark={false}
      onFinish={handleFinish}
      initialValues={initialValues}
      className="w-full"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Tên tour"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên tour" }]}
          >
            <Input placeholder="Nhập tên tour" variant="filled" />
          </Form.Item>

          <Form.Item
            label="Điểm khởi hành"
            name="departure"
            rules={[{ required: true, message: "Vui lòng nhập nơi khởi hành" }]}
          >
            <Input placeholder="VD: Hà Nội, TP.HCM" variant="filled" />
          </Form.Item>

          <Form.Item
            label="Điểm đến"
            name="destination"
            rules={[{ required: true, message: "Vui lòng nhập điểm đến" }]}
          >
            <Input placeholder="VD: Đà Nẵng, Hội An" variant="filled" />
          </Form.Item>
          <Form.Item
            label="Vùng"
            name="region"
            rules={[{ required: true, message: "Vui lòng nhập vùng" }]}
          >
            <Select
              placeholder="Chọn vùng"
              options={[
                { value: 'northern', label: 'Miền Bắc' },
                { value: 'central', label: 'Miền Trung' },
                { value: 'southern', label: 'Miền Nam' },
              ]}
              className="w-full"
            />
          </Form.Item>
          <Form.Item
            label="Kinh độ"
            name="longitude"
            rules={[{ required: true, message: "Vui lòng nhập kinh độ" }, { pattern: /^-?\d+(\.\d+)?$/, message: "Kinh độ không hợp lệ" }]}
          >
            <Input placeholder="Nhập kinh độ" variant="filled" />
          </Form.Item>
          <Form.Item
            label="Vĩ độ"
            name="latitude"
            rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }, { pattern: /^-?\d+(\.\d+)?$/, message: "Vĩ độ không hợp lệ" }]}
          >
            <Input placeholder="Nhập vĩ độ" variant="filled" />

          </Form.Item>
          <Form.Item
            label="Giá vé (VNĐ)"
            name="price"
            rules={[{ required: true, message: "Vui lòng nhập giá vé" }, { type: 'number', min: 0, message: 'Giá vé phải là số dương' }]}
          >
            <InputNumber
              min={0}
              placeholder="Nhập giá vé"
              className="w-full"
              variant="filled"
            />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (Thumbnail)" name="main_image" rules={[{ required: true, message: "Vui lòng chọn ảnh đại diện" }]}>
            {thumbnail ? (
              <div className="relative inline-block group">
                <Image
                  src={thumbnail}
                  alt="Thumbnail"
                  width={200}
                  height={150}
                  className="object-cover rounded"
                />
                <Button
                  shape="circle"
                  size="small"
                  icon={<CloseOutlined />}
                  className="absolute top-1 right-1 bg-black text-white hidden group-hover:block"
                  onClick={() => setThumbnail("")}
                />
              </div>
            ) : (
              <Upload
                listType="picture"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleUploadThumbnail}
              >
                <Button icon={<UploadOutlined />} loading={isLoadingUpThumbnail}>Chọn ảnh</Button>
              </Upload>
            )}
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label="Thể loại tour"
            name="categories"
            rules={[{ required: true, message: "Vui lòng chọn thể loại" }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn thể loại"
              options={categories.map(cat => ({
                label: cat.category,
                value: cat.id,
              }))}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            label="Ngày bắt đầu"
            name="start_date"
            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu" },]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Ngày kết thúc"
            name="end_date"
            dependencies={["start_date"]}
            rules={[
              { required: true, message: "Vui lòng chọn ngày kết thúc" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue("start_date");
                  if (!value || !start || value.isAfter(start)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Ngày kết thúc phải sau ngày bắt đầu!")
                  );
                },
              }),
            ]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Thời lượng (ngày)"
            name="duration"
            rules={[{ required: true, message: "Vui lòng nhập thời lượng." },]}
          >
            <Input
              placeholder="VD: 5 (tức 5 ngày 4 đêm)"
              className="w-full"
              variant="filled"
            />
          </Form.Item>

          <Form.Item
            label="Sức chứa (khách)"
            name="capacity"
            rules={[{ required: true, message: "Vui lòng nhập sức chứa" }, { type: 'number', min: 1, message: 'Sức chứa phải là số dương' }]}
          >
            <InputNumber min={1} className="w-full" variant="filled" />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}>
            <Input.TextArea rows={4} placeholder="Nhập mô tả tour" />
          </Form.Item>

          <Form.Item
            label="Kích hoạt tour"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Col>
      </Row>

      <Divider>Bộ sưu tập ảnh</Divider>
      <Row gutter={[8, 8]}>
        {gallery.map((url, index) => (
          <Col xs={12} sm={8} md={6} key={index} className="relative group">
            <Image
              src={url.image_url}
              alt={`Ảnh ${index + 1}`}
              width="100%"
              height="100%"
              className="object-cover rounded"
            />
            <Button
              shape="circle"
              size="small"
              onClick={() =>
                setGallery(gallery.filter((_, i) => i !== index))
              }
              className="absolute top-1 right-1 bg-black text-white hidden group-hover:block"
              icon={<CloseOutlined />}
            />
          </Col>
        ))}
        <Col xs={12} sm={8} md={6}>
          <Upload
            listType="picture-card"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleUploadImg}
          >
            {isLoadingUpGallery ? (
              <LoadingOutlined />
            ) : (
              <>
                <PlusOutlined />
                <div className="text-xs text-gray-500">Thêm ảnh</div>
              </>
            )}
          </Upload>
        </Col>
      </Row>

      <Divider>Dịch vụ bao gồm</Divider>
      <Form.List name="includes">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Row key={key} gutter={8} align="middle" className="mb-4">
                <Col flex="auto">
                  <Form.Item
                    className="m-0"
                    name={[name, 'item']}
                    rules={[{ required: true, message: "Nhập dịch vụ" }]}
                  >
                    <Input placeholder="VD: Vé máy bay khứ hồi" />
                  </Form.Item>
                </Col>
                <Col>
                  <Button
                    type="text"
                    danger
                    onClick={() => remove(name)}
                    icon={<CloseOutlined />}
                  />
                </Col>
              </Row>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
            >
              Thêm dịch vụ
            </Button>
          </>
        )}
      </Form.List>

      <Divider>Dịch vụ không bao gồm</Divider>
      <Form.List name="excludes">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Row key={key} gutter={8} align="middle" className="mb-4">
                <Col flex="auto">
                  <Form.Item
                    className="m-0"
                    name={[name, 'item']}
                    rules={[{ required: true, message: "Nhập dịch vụ" }]}
                  >
                    <Input placeholder="VD: VAT, chi phí cá nhân..." />
                  </Form.Item>
                </Col>
                <Col>
                  <Button
                    type="text"
                    danger
                    onClick={() => remove(name)}
                    icon={<CloseOutlined />}
                  />
                </Col>
              </Row>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
            >
              Thêm dịch vụ
            </Button>
          </>
        )}
      </Form.List>

      <Divider>Lịch trình</Divider>
      <Form.List name="schedule">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Row key={key} gutter={[8, 8]} className="mb-4">
                <Col xs={24} md={4}>
                  <Form.Item
                    className="m-0"
                    label="Ngày"
                    name={[name, "day_number"]}
                    rules={[{ required: true, message: "Nhập số ngày" }]}
                  >
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tiêu đề"
                    name={[name, "title"]}
                    rules={[{ required: true, message: "Nhập tiêu đề" }]}
                  >
                    <Input placeholder="VD: Tham quan Bà Nà Hills" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item
                    label="Chi tiết"
                    name={[name, "detail"]}
                    rules={[{ required: true, message: "Nhập nội dung" }]}
                  >
                    <Input.TextArea rows={2} placeholder="Nội dung chi tiết trong ngày" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={2} className="flex items-center">
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => remove(name)}
                  />
                </Col>
              </Row>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              icon={<PlusOutlined />}
            >
              Thêm ngày
            </Button>
          </>
        )}
      </Form.List>

      <Divider />
      <Space className="mt-4" size="large" align="center" wrap>
        <Button onClick={() => navigate(-1)}>Hủy bỏ</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {type === "add" ? "Thêm tour" : "Cập nhật tour"}
        </Button>
      </Space>
    </Form>
  );
};

export default FormTour;
