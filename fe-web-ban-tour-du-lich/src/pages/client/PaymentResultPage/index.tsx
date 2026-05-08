import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status'); // 'success' | 'failed' | 'error'
  
  useEffect(() => {
    const paymentResult = {
      type: 'PAYMENT_RESULT',
      status: status,
      orderId: orderId,
      timestamp: Date.now(),
    };
    
    // Gửi message qua postMessage (nếu có window.opener - thường không có sau redirect từ MoMo)
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
        window.opener.postMessage(paymentResult, window.location.origin);
      } catch (e) {
        // Ignore error
      }
    }
    
    // Lưu vào localStorage để Tab A có thể đọc qua polling
    try {
      localStorage.setItem('payment_result', JSON.stringify(paymentResult));
    } catch (e) {
      // Ignore localStorage error
    }
    
    // Xóa flag sau khi sử dụng
    const wasOpenedFromWindowOpen = localStorage.getItem('payment_tab_opened') === 'true';
    if (wasOpenedFromWindowOpen) {
      localStorage.removeItem('payment_tab_opened');
    }
    
    // Thử đóng tab ngay (đủ thời gian để lưu localStorage)
    setTimeout(() => {
      try {
        window.close();
      } catch (e) {
        // Ignore close error
      }
      
      // Sau 0.3 giây, nếu tab vẫn chưa đóng thì redirect về /order
      setTimeout(() => {
        if (document && document.body) {
          navigate('/order');
        }
      }, 300);
    }, 100);
    
  }, [status, orderId, navigate]);
  
  return null;
};

export default PaymentResultPage;

