import { useState } from "react";
import { Avatar, Upload, Form, Row, Col, Input, Radio, Button, Flex, Skeleton, message } from "antd";
import { UserOutlined, CameraOutlined, EditOutlined } from "@ant-design/icons";
import avatar from "../../../assets/imgs/avatar.png";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../services/authService";
import { uploadImagesCloudinary } from "../../../utils/uploadImagesCloudinary";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../store";
import { setUser } from "../../../features/user/userSlice";

const ProfilePage: React.FC = () => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    // call api
    const apiGetProfile = useGetProfileQuery();
    const apiUpdateProfile = useUpdateProfileMutation();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadImg = (info: any) => {
        const file = info.file.originFileObj || info.file; // Lấy file gốc
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImageUrl(e.target?.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChangeInfo = async (value: any) => {
        setLoadingUpdate(true);
        try {
            const url = await uploadImagesCloudinary(imageUrl ? [imageUrl] : []);
            const image = url.length > 0 ? url[0] : apiGetProfile.data?.data.avatar_url;
            const data = await apiUpdateProfile.mutateAsync({ ...value, avatar_url: image });
            dispatch(setUser({ ...data?.data, role: 'user' }));
            message.success('Cập nhật thành công.');
            setLoadingUpdate(false);
            setCanEdit(false);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.log('lỗi update profile', error);
            message.error(error.response.data.message)
        }
    }

    if (apiGetProfile.isLoading) {
        return (<Skeleton active />)
    }
    return (
        <>
            <div className="w-full h-40 bg-gradient-to-r from-blue-200 via-blue-100 to-amber-50 rounded-md"></div>
            <div className="px-4 sm:px-6 md:px-8 lg:px-16 xl:px-60 py-4 relative">
                <Flex justify="space-between" align="center" className="gap-3 flex-col sm:flex-row">
                    <Upload
                        showUploadList={false}
                        beforeUpload={() => false}
                        onChange={handleUploadImg}
                        disabled={!canEdit}
                    >
                        <div className="relative cursor-pointer">
                            <Avatar
                                size={80}
                                src={imageUrl || apiGetProfile.data?.data.avatar_url || avatar}
                                shape="circle"
                                icon={<UserOutlined />}
                            />
                            <div className="absolute bottom-0 right-0 flex items-center justify-center bg-black/50 rounded-full w-7 h-7">
                                <CameraOutlined style={{ color: "white", fontSize: 16 }} />
                            </div>
                        </div>
                    </Upload>
                    <Button type="primary" icon={<EditOutlined />} onClick={() => setCanEdit(true)}>Chỉnh sửa</Button>
                </Flex>
                <Form layout="vertical" initialValues={apiGetProfile.data?.data} disabled={!canEdit} onFinish={handleChangeInfo} className="mt-4">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Form.Item name='username' label='Họ và tên' rules={[
                                { required: true, message: 'Vui lòng nhập tên của bạn' },
                                { type: 'string', message: 'Tên không hợp lệ!' }
                            ]}>
                                <Input />
                            </Form.Item>
                            {/* <Form.Item name='birthday' label='Ngày sinh' rules={[
                                { required: true, message: 'Vui lòng nhập ngày sinh của bạn' },
                                { type: 'date', message: 'Ngày sinh không hợp lệ!' }
                            ]}>
                                <DatePicker style={{ width: '100%' }} needConfirm />
                            </Form.Item> */}
                            <Form.Item
                                name="gender"
                                label="Giới tính"
                                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                            >
                                <Radio.Group>
                                    <Radio value="male">Nam</Radio>
                                    <Radio value="female">Nữ</Radio>
                                    <Radio value="other">Khác</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    { required: true, message: "Vui lòng nhập số điện thoại." },
                                    { pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: "Số điện thoại không hợp lệ!" }
                                ]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item name='email' label='Email' rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' }
                            ]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <div className="flex justify-end">
                                <Button type="primary" htmlType="submit" loading={loadingUpdate}>
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </div>
        </>
    );
};

export default ProfilePage;