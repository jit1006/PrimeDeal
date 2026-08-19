import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import VerifyEmail from "./auth/VerifyEmail";
import HeroSection from "./components/HeroSection";
import MainLayout from "./Layout/MainLayout";
import Profile from "./components/Profile";
import SearchPage from "./components/SearchPage";
import ShopDetails from "./components/ShopDetails";
import Cart from "./components/Cart";
import Store from "./admin/Store";
import AddProducts from "./admin/AddProducts";
import StoreOrders from "./admin/StoreOrders";
import OrderPage from "./components/OrderPage";
import { useUserStore } from "./zustand/useUserStore";
import { useEffect } from "react";
import Loading from "./components/Loading";
import Login from "./auth/login";
import NotFound from "./components/NotFound";
import { useThemeStore } from "./zustand/useThemeStore";
import Nearby from "./components/Nearby";
import AdminStoreDetail from "./admin/StoreDetail";
import SetupAddress from "./components/SetupAddress";
import LandingPage from "./components/LandingPage";
import ProductCatalog from "./admin/ProductCatalog";
import OrderDetailPage from "./components/OrdersDetail";

const AuthenticatedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUserStore();
  if (!isAuthenticated) {
    return <Navigate to="/home" replace={true} />;
  }
  return children;
};

const UserOnlyRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if (!isAuthenticated) {
    return <Navigate to="/home" replace={true} />;
  }

  if (user?.admin) {
    return <Navigate to="/admin/store" replace />;
  }
  return children;
};

const AuthenticatedUser = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUserStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace={true} />;
  }
  return children;
};

const AdminRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace={true} />;
  }
  if (!user?.admin) {
    return <Navigate to="/" replace={true} />;
  }
  return children;
};

function App() {
  const initializeTheme = useThemeStore((state: any) => state.initializeTheme);
  const { checkAuthentication, isCheckingAuth } = useUserStore();
  useEffect(() => {
    try {
      initializeTheme(); // ✅ Call theme initialization safely
    } catch (error) {
      console.error("Error initializing theme:", error);
    }
  }, [initializeTheme, checkAuthentication]);
  if (isCheckingAuth) return <Loading />;
  return (
    <main>
      <BrowserRouter>
        <Routes>
          {/*  Normal Layout Routes (Navbar stays) */}
          <Route path="/" element={<MainLayout />}>
            {/* Profile & Address Routes (Accessible by both Users and Admins) */}
            <Route
              path="profile"
              element={
                <AuthenticatedRoutes>
                  <Profile />
                </AuthenticatedRoutes>
              }
            />
            <Route
              path="setup-address"
              element={
                <AuthenticatedRoutes>
                  <SetupAddress />
                </AuthenticatedRoutes>
              }
            />
            <Route
              path="setup-address/:id"
              element={
                <AuthenticatedRoutes>
                  <SetupAddress />
                </AuthenticatedRoutes>
              }
            />
          </Route>

          {/* ✅ Normal Customer Routes */}
          <Route
            path="/"
            element={
              <UserOnlyRoutes>
                <MainLayout />
              </UserOnlyRoutes>
            }
          >
            <Route index element={<HeroSection />} />
            <Route path="search/" element={<SearchPage />} />
            <Route path="shop/:id" element={<ShopDetails />} />
            <Route path="nearby" element={<Nearby />} />
            <Route path="cart" element={<Cart />} />
            <Route path="order" element={<OrderPage />} />
            <Route path="order/:id" element={<OrderDetailPage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoutes>
                <MainLayout />
              </AdminRoutes>
            }
          >
            <Route path="store" element={<Store />} />
            <Route path="product-catalog" element={<ProductCatalog />} />
            <Route path="store/:id" element={<AdminStoreDetail />} />
            <Route path="store/product/:id" element={<AddProducts />} />
            <Route path="storeOrders" element={<StoreOrders />} />
          </Route>

          {/*  Authentication Routes */}
          <Route
            path="/home"
            element={
              <AuthenticatedUser>
                <LandingPage />
              </AuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <AuthenticatedUser>
                <Login />
              </AuthenticatedUser>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthenticatedUser>
                <Signup />
              </AuthenticatedUser>
            }
          />
          <Route
            path="/setup-address"
            element={
              <AuthenticatedUser>
                <SetupAddress />
              </AuthenticatedUser>
            }
          />
          <Route
            path="/forgotpassword"
            element={
              <AuthenticatedUser>
                <ForgotPassword />
              </AuthenticatedUser>
            }
          />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/verifyemail" element={<VerifyEmail />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </main>
  );
}

export default App;
