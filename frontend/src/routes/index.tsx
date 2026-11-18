import { createBrowserRouter } from "react-router-dom";
import { authRoutes } from "./authRoutes";
import { protectedRoutes } from "./protectedRoutes";

const router = createBrowserRouter([...authRoutes, protectedRoutes]);

export default router;
