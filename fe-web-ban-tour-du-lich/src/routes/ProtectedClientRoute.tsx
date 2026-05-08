import { Navigate } from "react-router-dom";
import { notification } from "antd";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "../store";
import { resetJustLoggedOut } from "../features/user/userSlice";

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

const ProtectedClientRoute = ({ children }: ProtectedClientRouteProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const justLoggedOut = useSelector((state: RootState) => state.user.justLoggedOut);
  const notified = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    // Sau khi redirect xong -> reset flag để lần sau có thể hiện noti đúng lúc
    if (justLoggedOut) {
      dispatch(resetJustLoggedOut());
    }
  }, [dispatch, justLoggedOut]);

  // Chưa login và không phải vừa logout → Báo lỗi và chặn
  if (!isAuthenticated && !justLoggedOut) {
    if (!notified.current) {
      notification.warning({
        message: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập tài khoản người dùng để tiếp tục.",
        placement: "topRight",
      });
      notified.current = true;
    }
    return <Navigate to="/login" replace />;
  }

  // Logout hợp lệ → Không báo lỗi, chỉ redirect
  if (!isAuthenticated && justLoggedOut) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedClientRoute;