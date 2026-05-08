import React, { useMemo, useState } from 'react';
import heroBanner2 from '../../../assets/imgs/heroBanner2.png';
import { Button, Col, Empty, Form, InputNumber, Row, Segmented, Skeleton, Space, Typography, } from 'antd';
import { useNavigate, useParams, useSearchParams, } from 'react-router-dom';
import { AppstoreOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { LocationTab, OverviewTab, ScheduleTab } from '../../../components/DetailTourTabs';
import decorDetailPage from '../../../assets/imgs/decorDetailPage.png';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store';
import { setTicketQuantity, setSelectedTour } from '../../../features/ticket/tickectSlice';
import ReviewItem from '../../../components/ReviewItem';
import { useGetDetailTour } from '../../../services/tourService';
import { useGetTourReview } from '../../../services/reviewService';
import { useUpdateParams } from '../../../hooks/useUpdateParams';

const DetailTourPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { updateParams } = useUpdateParams();
  const [infoTour, setInfoTour] = useState('overview');
  const [selectedReview, setSelectedReview] = useState(searchParams.get("type_review") || "all");
  const params = useMemo(() => {
    return {
      type_review: selectedReview,
    };
  }, [selectedReview]);

  // call api
  const detailTourApi = useGetDetailTour(id ? Number(id) : undefined);
  const getTourReview = useGetTourReview(id ? Number(id) : undefined, params)

  const tabContent: Record<string, React.ReactNode> = {
    "overview": <OverviewTab data={detailTourApi.data?.data} />,
    "schedule": <ScheduleTab data={detailTourApi.data?.data?.schedule || []} />,
    "location": <LocationTab data={detailTourApi.data?.data || {}} />,
  };
  const handleSubmit = (values: Record<string, number>) => {
    dispatch(setTicketQuantity(values.ticketQuantity));
    // Lưu thông tin tour vào redux để Payment đọc
    dispatch(setSelectedTour({
      id: detailTourApi.data?.data.id || 0,
      tour_code: detailTourApi.data?.data?.tour_code || '',
      title: detailTourApi.data?.data?.title || '',
      start_date: detailTourApi.data?.data?.start_date || '',
      end_date: detailTourApi.data?.data?.end_date || '',
      main_image: detailTourApi.data?.data?.main_image || '',
      unitPrice: Number(detailTourApi.data?.data?.price) || 0,
    }));
    navigate('/payment');
  };
  return (
    <>
      <div className="h-[260px] md:h-[400px] bg-cover bg-center relative" style={{ backgroundImage: `url(${heroBanner2})` }}>
      </div>
      <div className='px-4 sm:px-6 md:px-8 lg:px-16 py-4 relative -top-[32px] md:-top-[64px]'>
        <div className='w-full bg-white p-3 md:p-4 space-y-4 rounded-lg shadow-md'>
          <Segmented
            options={[
              {
                label: (
                  <div>
                    <AppstoreOutlined />
                    <span className='ml-2'>Tổng quan</span>
                  </div>
                ),
                value: 'overview',
              },
              {
                label: (
                  <div>
                    <CalendarOutlined />
                    <span className='ml-2'>Lịch trình</span>
                  </div>
                ),
                value: 'schedule',
              },
              {
                label: (
                  <div>
                    <EnvironmentOutlined />
                    <span className='ml-2'>Vị trí</span>
                  </div>
                ),
                value: 'location',
              },
            ]}
            value={infoTour}
            onChange={(value) => {
              setInfoTour(value.toString());
            }}
            size="large"
            block
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              {detailTourApi.isLoading ? (<Skeleton />) : (tabContent[infoTour])}
            </Col>
            <Col xs={24} lg={8}>
              <div className='bg-gray-200 p-3 md:p-4 rounded-lg shadow-md space-y-4'>
                <Typography.Title level={3} className="text-center">
                  Đặt tour ngay
                </Typography.Title>
                <Form
                  layout="vertical"
                  className="space-y-4 w-full"
                  onFinish={handleSubmit}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <Typography.Text strong>Số lượng vé:</Typography.Text>
                    <Form.Item name="ticketQuantity" className="!mb-0" rules={[
                      { required: true, message: "Vui lòng nhập số lượng vé" },
                      { type: "number", min: 1, message: "Số lượng vé phải là số không âm" },
                    ]}>
                      <InputNumber
                        className="w-full sm:w-[140px] [&_.ant-input-number-input]:text-center"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item className="text-center">
                    <Button
                      htmlType="submit"
                      type="primary"
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:!bg-orange-600"
                    >
                      Xác nhận
                    </Button>
                  </Form.Item>
                </Form>
              </div>
              <img src={decorDetailPage} alt="decor" className='w-full mt-4 object-cover' />
            </Col>
          </Row>
          <Typography.Title level={4}>Đánh giá từ người dùng</Typography.Title>
          {/* loại đánh giá */}
          <Space size='small' wrap>
            <Button
              type={selectedReview === 'all' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('all');
                updateParams({ type_review: 'all' });
              }}
            >
              Tất cả
            </Button>

            <Button
              type={selectedReview === '5' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('5');
                updateParams({ type_review: '5' });
              }}
            >
              5 sao
            </Button>

            <Button
              type={selectedReview === '4' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('4');
                updateParams({ type_review: '4' });
              }}
            >
              4 sao
            </Button>

            <Button
              type={selectedReview === '3' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('3');
                updateParams({ type_review: '3' });
              }}
            >
              3 sao
            </Button>

            <Button
              type={selectedReview === '2' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('2');
                updateParams({ type_review: '2' });
              }}
            >
              2 sao
            </Button>

            <Button
              type={selectedReview === '1' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('1');
                updateParams({ type_review: '1' });
              }}
            >
              1 sao
            </Button>

            <Button
              type={selectedReview === 'with_image' ? 'primary' : 'default'}
              onClick={() => {
                setSelectedReview('with_image');
                updateParams({ type_review: 'with_image' });
              }}
            >
              Có hình ảnh
            </Button>
          </Space>
          {!getTourReview.isLoading && getTourReview.data?.data.length === 0 && (
            <Empty description="Chưa có đánh giá nào." />
          )}
          {getTourReview.isLoading ? (<Skeleton />) : (
            getTourReview.data?.data.map((review, index) => (
              <ReviewItem key={index} review={review} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default DetailTourPage;