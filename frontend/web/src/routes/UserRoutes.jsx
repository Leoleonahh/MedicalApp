import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/ForgotPassword/ResetPassword";
import Home from "../pages/Home/Home";
import Predict from "../pages/Predict/Predict";
import Result from "../pages/Result/Result";
import History from "../pages/History/History";
import Hospital from "../pages/Hospital/Hospital";
import Shop from "../pages/Shop/Shop";
import Cart from "../pages/Cart/Cart";
import OrderHistory from "../pages/OrderHistory/OrderHistory";
import OrderDetail from "../pages/OrderHistory/OrderDetail";
import Profile from "../pages/Profile/Profile";
import ChangePassword from "../pages/Profile/ChangePassword";
import EditProfile from "../pages/Profile/EditProfile";
import CreateShop from "../pages/Shop/CreateShop";
import ManageShop from "../pages/Shop/ManageShop";
import ShopProfile from "../pages/Shop/ShopProfile";
import ShopEdit from "../pages/Shop/ShopEdit";
import ShopSelect from "../pages/Shop/ShopSelect";
import EditProducts from "../pages/Shop/EditProducts";
import ShopOrders from "../pages/Shop/ShopOrders";
import ShopOrderDetail from "../pages/Shop/ShopOrderDetail";
import ShopBuyStart from "../pages/Shop/ShopBuyStart";
import ShopBuy from "../pages/Shop/ShopBuy";
import Checkout from "../pages/Shop/Checkout";
import Payment from "../pages/Shop/Payment";

function UserRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/forgotpassword/reset" element={<ResetPassword />} />
      <Route path="/home" element={<Home />} />
      <Route path="/predict" element={<Predict />} />
      <Route path="/result" element={<Result />} />
      <Route path="/history" element={<History />} />
      <Route path="/hospital" element={<Hospital />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/shop/create" element={<CreateShop />} />
      <Route path="/shop/manage" element={<ManageShop />} />
      <Route path="/shop/profile" element={<ShopProfile />} />
      <Route path="/shop/edit" element={<ShopEdit />} />
      <Route path="/shop/edit-products" element={<EditProducts />} />
      <Route path="/shop/orders" element={<ShopOrders />} />
      <Route path="/shop/orders/:id" element={<ShopOrderDetail />} />
      <Route path="/shop/buy" element={<ShopBuyStart />} />
      <Route path="/shop/buy/:id" element={<ShopBuy />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/shop/select" element={<ShopSelect />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order-history" element={<OrderHistory />} />
      <Route path="/order/:id" element={<OrderDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/change-password" element={<ChangePassword />} />
    </Routes>
  );
}

export default UserRoutes;
