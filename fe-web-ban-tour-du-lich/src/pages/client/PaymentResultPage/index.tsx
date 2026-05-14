import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status'); // 'success' | 'failed' | 'error'
  
  useEffect(() => {
    const paymentResult = {
      type: 'PAYMENT_RESULT',
      status: status,
      orderId: orderId,
      timestamp: Date.now(),
    };
    
    // Gửi message qua postMessage
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
        window.opener.postMessage(paymentResult, window.location.origin);
      } catch (e) {
        // Ignore error
      }
    }
    
    // Lưu vào localStorage
    try {
      localStorage.setItem('payment_result', JSON.stringify(paymentResult));
    } catch (e) {
      // Ignore localStorage error
    }
    
    // Tự động chuyển hướng sau 5 giây
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/my-tickets');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, orderId, navigate]);

  const renderResult = () => {
    if (status === 'success') {
      return (
        <Result
          status="success"
          title="Thanh toán thành công!"
          subTitle={`Đơn hàng #${orderId} của bạn đã được thanh toán thành công. Hệ thống sẽ tự động chuyển hướng sau ${countdown} giây.`}
          extra={[
            <Button type="primary" key="tickets" onClick={() => navigate('/my-tickets')}>
              Xem vé của tôi
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>,
          ]}
        />
      );
    } else if (status === 'failed' || status === 'error') {
      return (
        <Result
          status="error"
          title="Thanh toán thất bại"
          subTitle="Đã có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch bị hủy."
          extra={[
            <Button type="primary" key="retry" onClick={() => navigate('/list-tour')}>
              Thử lại
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>,
          ]}
        />
      );
    }
    return <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />;
  };
  
  return (
    <div style={{ padding: '50px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {renderResult()}
    </div>
  );
};

export default PaymentResultPage;

