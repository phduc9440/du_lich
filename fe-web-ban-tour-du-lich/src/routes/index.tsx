import type { RouteObject } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";
import HomePage from "../pages/client/HomePage";
import ListTourPage from "../pages/client/ListTourPage";
import DetailTourPage from "../pages/client/DetailTourPage";
import FeedbackPage from "../pages/client/FeedbackPage";
import PaymentPage from "../pages/client/PaymentPage";
import PaymentResultPage from "../pages/client/PaymentResultPage";
import MyTicketsPage from "../pages/client/MyTicketsPage";
import OrderPage from "../pages/client/OrderPage";
import ProfilePage from "../pages/client/ProfilePage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminLayout from "../layouts/AdminLayout";
import LoginPage from "../pages/client/LoginPage";
import AdminUserPage from "../pages/admin/AdminUserPage";
import AdminTourPage from "../pages/admin/AdminTourPage";
import AdminEditTourPage from "../pages/admin/AdminEditTourPage";
import AdminAddTourPage from "../pages/admin/AdminAddTourPage";
import AdminCreateAccountPage from "../pages/admin/AdminCreateAccountPage";
import AdminCategoryPage from "../pages/admin/AdminCategoryPage";
import AdminOrderPage from "../pages/admin/AdminOrderPage";
import AdminSupportPage from "../pages/admin/AdminSupportPage";
import AdminListTicketPage from "../pages/admin/AdminListTicketPage";
import AdminStatsRevenuePage from "../pages/admin/AdminStatsRevenuePage";
import AdminStatsToursPage from "../pages/admin/AdminStatsToursPage";
import AdminStatsUsersPage from "../pages/admin/AdminStatsUsersPage";
import AdminCouponPage from "../pages/admin/AdminCouponPage";
import RegisterPage from "../pages/client/RegisterPage";
import ProtectedClientRoute from "./ProtectedClientRoute";
import { AuthBlockedAdminRoute, AuthBlockedUserRoute } from "./AuthBlockedRoute";
import ChangePasswordPage from "../pages/client/ChangePasswordPage";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import AdminListGuiderPage from "../pages/admin/AdminListGuiderPage";
import AdminGuideViewTourPage from "../pages/admin/AdminGuideViewTourPage";
import AdminEmployeePage from "../pages/admin/AdminEmployeePage";
import AdminViewAssignedGuidePage from "../pages/admin/AdminViewAssignedGuidePage";
import AdminTourDivideForGuidePage from "../pages/admin/AdminTourDivideForGuidePage";
import AdminUpdateProfilePage from "../pages/admin/AdminUpdateProfilePage";

const publicRoutes: RouteObject[] = [
    {
        path: "/",
        element: <DefaultLayout />,
        children: [
            { path: "", element: <HomePage /> },
            { path: "list-tour", element: <ListTourPage /> },
            { path: "detail/:id", element: <DetailTourPage /> },
        ],
    },
    {
  path: "/login",
  element: (
    <AuthBlockedUserRoute>
      <LoginPage />
    </AuthBlockedUserRoute>
  )
},
{
  path: "/register",
  element: (
    <AuthBlockedUserRoute>
      <RegisterPage />
    </AuthBlockedUserRoute>
  )
},
{
  path: "/admin/login",
  element: (
    <AuthBlockedAdminRoute>
      <AdminLoginPage />
    </AuthBlockedAdminRoute>
  )
}

];

const privateRoutes: RouteObject[] = [
    {
        path: "/",
        element: <ProtectedClientRoute><DefaultLayout /></ProtectedClientRoute>,
        children: [
            { path: "payment", element: <PaymentPage /> },
            { path: "payment/result", element: <PaymentResultPage /> },
            { path: "my-tickets", element: <MyTicketsPage /> },
            { path: "order", element: <OrderPage /> },
            { path: "profile", element: <ProfilePage /> },
            { path: "change-password", element: <ChangePasswordPage /> },
            { path: "feedback", element: <FeedbackPage /> },
        ]
    }
]
const adminRoutes: RouteObject[] = [
    {
        path: "/admin",
        element: <ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>,
        children: [
            { path: "", element: <></>},
            { path: "users", element: <AdminUserPage /> },
            { path: "employees", element: <AdminEmployeePage/> },
            { path: "tours", element: <AdminTourPage /> },
            { path: "tours/edit/:id", element: <AdminEditTourPage /> },
            { path: "tours/add", element: <AdminAddTourPage /> },
            { path: "categories", element: <AdminCategoryPage /> },
            { path: "create-account", element: <AdminCreateAccountPage /> },
            { path: "orders", element: <AdminOrderPage /> },
            { path: "supports", element: <AdminSupportPage /> },
            { path: "tour-assigned", element: <AdminViewAssignedGuidePage /> },
            { path: "tickets/:id", element: <AdminListTicketPage /> },
            { path: "coupons", element: <AdminCouponPage /> },
            { path: "stats/revenue", element: <AdminStatsRevenuePage /> },
            { path: "stats/tours", element: <AdminStatsToursPage /> },
            { path: "stats/users", element: <AdminStatsUsersPage /> },
            { path: "list-guider", element: <AdminListGuiderPage/>},
            { path: "list-guider/tours/:id", element: <AdminTourDivideForGuidePage/>},
            { path: "guide-tour", element: <AdminGuideViewTourPage/>},
            { path: "update-profile", element: <AdminUpdateProfilePage/>},
        ]
    },
]
export { publicRoutes, privateRoutes, adminRoutes };