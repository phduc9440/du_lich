import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

const AuthBlockedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const isUserAuth = useSelector((state: RootState) => state.user.isAuthenticated);

  if (isUserAuth) {
    return <Navigate to="/" replace />;
  }

  return children;
};
const AuthBlockedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdminAuth = useSelector((state: RootState) => state.admin.isAuthenticated);
  const role = useSelector((state: RootState) => state.admin.admin?.role);

  if (isAdminAuth) {
    return role === 'guide' ? <Navigate to="/admin/guide-tour" replace /> : <Navigate to="/admin/users" replace />;
  }

  return children;
};

export {AuthBlockedUserRoute, AuthBlockedAdminRoute};
