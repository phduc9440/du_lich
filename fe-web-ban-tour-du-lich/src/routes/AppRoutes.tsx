import { useRoutes } from "react-router-dom";
import { publicRoutes, privateRoutes, adminRoutes } from "./index";
import NotFoundPage from "../components/NotFoundPage";
const AppRoutes = () => {
    const routes = useRoutes([...publicRoutes, ...privateRoutes, ...adminRoutes, { path: "*", element: <NotFoundPage /> }, ]);
    return routes;
}
export default AppRoutes;