import { Navigate } from "react-router-dom";
import { notification } from "antd";
import { useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
    const isAuthenticated = useSelector((state: RootState) => state.admin.isAuthenticated);
    const notified = useRef(false);

    // Chưa login → chặn
    if (!isAuthenticated) {
        if (!notified.current) {
            notification.warning({
                message: "Chưa đăng nhập",
                description: "Vui lòng đăng nhập tài khoản admin để tiếp tục.",
                placement: "topRight",
            });
            notified.current = true;
        }
        return <Navigate to="/admin/login" replace />;
    }
    return children;
};

export default ProtectedAdminRoute;