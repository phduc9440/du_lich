import { Button, Col, Row, Typography, Modal, Card, Space, message, Select } from "antd";
import OrderOverviewCard from "../../../components/OrderOverviewcard";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useEffect, useMemo, useState } from "react";
import PaymentInfo from "../../../components/PaymentInfo";
import { useNavigate } from "react-router-dom";
import { useGetCoupon } from "../../../services/couponSevice";
import { useCreateOrder } from "../../../services/orderService";
import { resetTickets } from "../../../features/ticket/tickectSlice";
import type { Coupon } from "../../../types/coupon";
import { queryClient } from "../../../configs/queryClient";

const PaymentPage: React.FC = () => {
  const ticketQuantity = useSelector((state: RootState) => state.ticket.quantities || 0);
  const selectedTour = useSelector((state: RootState) => state.ticket.selectedTour);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon>();
  const [discount, setDiscount] = useState<number>(0);
  const unitPrice = selectedTour?.unitPrice || 0;
  const subTotal = useMemo(() => unitPrice * (ticketQuantity || 0), [unitPrice, ticketQuantity]);
  const total = useMemo(() => Math.max(subTotal - discount, 0), [subTotal, discount]);
  
  //call api
  const getCouponApi = useGetCoupon();
  const createOrderApi = useCreateOrder();

  const handleApplyCoupon = async (coupon: Coupon) => {
    if (coupon) {
      if (!coupon.is_active) {
        message.error("Mã giảm giá không còn hiệu lực");
        return;
      }

      let discountValue = 0;

      if (coupon.discount_amount) {
        discountValue = coupon.discount_amount;
      } else if (coupon.discount_percent) {
        discountValue = Math.round((subTotal * coupon.discount_percent) / 100);
      }

      setDiscount(discountValue);
      message.success(`Áp dụng thành công ${coupon.code}: -${discountValue.toLocaleString("vi-VN")} đ`);
    } else {
      setDiscount(0);
    }
  };


  const handleConfirmPayment = async () => {
    if (!ticketQuantity || ticketQuantity <= 0) {
      message.warning("Bạn chưa chọn số vé. Vui lòng quay lại trang chi tiết để chọn vé.");
      return;
    }
    try {
      await createOrderApi.mutateAsync({ coupon_id: selectedCoupon?.id, tour_id: selectedTour?.id, quantity: ticketQuantity });
      message.success('Tạo đơn hàng thành công.');
      setIsModalVisible(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || 'Lỗi tạo đơn hàng.');
    }
  };

  const handleModalCancel = () => {
    dispatch(resetTickets());
    setIsModalVisible(false)
  };

  // Bảo vệ trang Payment: cần có số vé và thông tin tour
  useEffect(() => {
    if (!selectedTour) {
      navigate("/list-tour", { replace: true });
    }
  }, [ticketQuantity, selectedTour, navigate, dispatch]);

  // Lắng nghe từ localStorage - polling (cách chính đang hoạt động)
  useEffect(() => {
    const handlePaymentResult = (paymentData: { status: string; orderId: string | null }) => {
      const { status } = paymentData;
      
      if (status === 'success') {
        // Refresh data orders và tickets
        queryClient.refetchQueries({ queryKey: ['orders'] });
        queryClient.refetchQueries({ queryKey: ['tickets'] });
        
        // Hiển thị thông báo
        message.success(`Thanh toán thành công! Đơn hàng đã được xác nhận.`);
        
        // Đóng modal nếu đang mở
        setIsModalVisible(false);
        
        // Reset tickets
        dispatch(resetTickets());
        
        // Chuyển về trang đơn hàng
        navigate('/order');
      } else if (status === 'failed') {
        message.error('Thanh toán thất bại. Vui lòng thử lại.');
      } else {
        message.error('Đã xảy ra lỗi khi thanh toán.');
      }
    };

    // Polling: Kiểm tra localStorage định kỳ (mỗi 500ms) - chạy liên tục khi component còn mount
    const pollInterval = setInterval(() => {
      try {
        const storedResult = localStorage.getItem('payment_result');
        if (storedResult) {
          const paymentData = JSON.parse(storedResult);
          const timeDiff = Date.now() - (paymentData.timestamp || 0);
          // Chỉ xử lý nếu data mới (trong vòng 30 giây)
          if (paymentData.type === 'PAYMENT_RESULT' && 
              paymentData.timestamp && 
              timeDiff < 30000) {
            handlePaymentResult(paymentData);
            localStorage.removeItem('payment_result');
            clearInterval(pollInterval);
          } else if (paymentData.timestamp && timeDiff >= 30000) {
            // Xóa data cũ (quá 30 giây)
            localStorage.removeItem('payment_result');
          }
        }
      } catch (err) {
        console.error('Lỗi đọc localStorage:', err);
      }
    }, 500);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [navigate, dispatch]);

  return (
    <>
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Thanh toán" className="w-full">
              <Typography.Paragraph strong>
                Vui lòng kiểm tra thông tin và tiến hành thanh toán để hoàn tất đặt vé.
                Đơn hàng sẽ được hủy nếu không thanh toán trong <span className="text-red-500">16:40:00</span> kể từ
                thời gian đặt đơn.
              </Typography.Paragraph>

              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Typography.Text strong>Mã giảm giá</Typography.Text>
                  <div className="mt-2 flex gap-2 items-center">
                    <Select
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      className="max-w-[260px] w-[200px]"
                      placeholder="Nhập mã giảm giá..."
                      options={getCouponApi.data?.data.map((coupon: Coupon) => ({
                        label: `${coupon.code} - ${coupon.discount_amount
                          ? `${coupon.discount_amount.toLocaleString("vi-VN")} đ`
                          : coupon.discount_percent
                            ? `${coupon.discount_percent}%`
                            : ""} ${!coupon.is_active ? "(Hết hạn)" : ""}`,
                        value: coupon.code,
                      }
                      ))}
                      onChange={(value) => {
                        const coupon = getCouponApi.data?.data.find((c: Coupon) => c.code === value);
                        setSelectedCoupon(coupon);
                        handleApplyCoupon(coupon);
                      }}
                    />
                    {discount > 0 && (
                      <Typography.Text type="success">
                        Đã áp dụng {selectedCoupon?.code}: -{discount.toLocaleString("vi-VN")} đ
                      </Typography.Text>
                    )}
                  </div>
                </div>

                <Card size="small" title="Tóm tắt thanh toán" className="max-w-[520px]">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between">
                      <Typography.Text>Tạm tính</Typography.Text>
                      <Typography.Text>
                        {subTotal.toLocaleString("vi-VN")} đ
                      </Typography.Text>
                    </div>
                    <div className="flex justify-between">
                      <Typography.Text>Giảm giá</Typography.Text>
                      <Typography.Text>
                        -{discount.toLocaleString("vi-VN")} đ
                      </Typography.Text>
                    </div>
                    <div className="flex justify-between">
                      <Typography.Text strong>Tổng thanh toán</Typography.Text>
                      <Typography.Text strong className="text-[#FA8B02]">
                        {total.toLocaleString("vi-VN")} đ
                      </Typography.Text>
                    </div>
                  </Space>
                </Card>

                <Button
                  type="primary"
                  size="large"
                  className="rounded-[6px]"
                  onClick={handleConfirmPayment}
                  loading={createOrderApi.isPending}
                  disabled={!ticketQuantity || ticketQuantity <= 0 || !selectedTour || createOrderApi.isSuccess}
                >
                  Xác nhận thanh toán
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <OrderOverviewCard
              title={selectedTour?.title || ""}
              start_date={selectedTour?.start_date || ""}
              end_date={selectedTour?.end_date || ""}
              imageUrl={selectedTour?.main_image || "https://picsum.photos/400/200"}
              tickets={{ unitPrice, quantity: ticketQuantity || 0 }}
              totalPrice={total}
            />
          </Col>
        </Row>
      </div>

      <Modal
        title="Xác nhận thông tin thanh toán"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={720}
      >
        {selectedTour && (
          <PaymentInfo
            tourInfo={{
              title: selectedTour.title,
              tour_code: selectedTour.tour_code,
              start_date: selectedTour.start_date,
              end_date: selectedTour.end_date,
            }}
            ticketInfo={{
              quantity: ticketQuantity || 0,
              unitPrice,
            }}
            orderInfo={{
              order_code: createOrderApi.data?.data?.order_code || '',
              payment_url: createOrderApi.data?.data?.payment_url || '',
              discount: discount,
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default PaymentPage;