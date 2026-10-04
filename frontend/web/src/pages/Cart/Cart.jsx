import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrashAlt, FaMinus, FaPlus } from "react-icons/fa";
import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../../api/cart.api";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const result = await getCart();
        const items = result.data?.items || [];
        setCartItems(
          items.map((item) => ({
            ...item,
            name: item.product_name || item.name || "ไม่ระบุชื่อสินค้า",
          }))
        );
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          setError(requestError.response?.data?.message || "ไม่สามารถโหลดตะกร้าได้");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (localStorage.getItem("token")) {
      loadCart();
    } else {
      setError("กรุณาเข้าสู่ระบบก่อน");
      setIsLoading(false);
    }
  }, []);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const updateQuantity = async (item, delta) => {
    const quantity = Math.max(1, item.quantity + delta);
    if (quantity > Number(item.stock)) return;

    try {
      setUpdatingId(item.cart_item_id);
      const result = await updateCartItem(item.cart_item_id, quantity);
      const updatedItem = result.data;
      setCartItems((items) =>
        items.map((currentItem) =>
          currentItem.cart_item_id === item.cart_item_id
            ? { ...currentItem, ...updatedItem, quantity }
            : currentItem
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "ไม่สามารถแก้ไขจำนวนสินค้าได้");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      setUpdatingId(cartItemId);
      await removeCartItem(cartItemId);
      setCartItems((items) => items.filter((item) => item.cart_item_id !== cartItemId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "ไม่สามารถลบสินค้าได้");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setUpdatingId("clear");
      await clearCart();
      setCartItems([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "ไม่สามารถล้างตะกร้าได้");
    } finally {
      setUpdatingId(null);
    }
  };
  // Redirect to Checkout page to collect address/payment
  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <Link to="/shop" className="cart-back">
            <FaArrowLeft />
          </Link>
          <h1>ตะกร้าสินค้า</h1>
        </div>
        <div className="cart-empty">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <Link to="/shop" className="cart-back">
          <FaArrowLeft />
        </Link>
        <div>
          <p className="cart-subtitle">หน้าตะกร้าสินค้า</p>
          <h1>รายการที่คุณเลือก</h1>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          {error && <p className="cart-error">{error}</p>}
          <p>ยังไม่มีสินค้าในตะกร้า</p>
          <Link to="/shop" className="btn btn-secondary">
            กลับไปหน้าช้อป
          </Link>
        </div>
      ) : (
        <div className="cart-body">
          <div className="cart-list">
            {error && <p className="cart-error">{error}</p>}
            {cartItems.map((item) => (
              <div className="cart-item" key={item.cart_item_id}>
                <div className="item-row item-header">
                  <div>
                    <p className="item-name">{item.name}</p>
                    <p className="item-price">฿{item.price} / ชิ้น</p>
                  </div>
                  <button type="button" className="item-remove" disabled={updatingId !== null} onClick={() => removeItem(item.cart_item_id)}>
                    <FaTrashAlt />
                  </button>
                </div>

                <div className="item-row item-quantity-row">
                  <span className="item-label">จำนวน</span>
                  <div className="item-quantity">
                    <button type="button" disabled={updatingId !== null} onClick={() => updateQuantity(item, -1)}>
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" disabled={updatingId !== null || item.quantity >= Number(item.stock)} onClick={() => updateQuantity(item, 1)}>
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <div className="item-row item-total-row">
                  <span className="item-label">รวม</span>
                  <strong>฿{item.price * item.quantity}</strong>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <div className="summary-card">
              <p>จำนวนรายการ</p>
              <h2>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</h2>
            </div>
            <div className="summary-card">
              <p>รวมราคา</p>
              <h2>฿{totalPrice}</h2>
            </div>
            <button type="button" className="btn btn-primary checkout-btn" onClick={handleCheckout}>
              สั่งซื้อ
            </button>
            <button
              type="button"
              className="btn btn-secondary clear-cart-btn"
              disabled={updatingId !== null}
              onClick={handleClearCart}
            >
              {updatingId === "clear" ? "กำลังล้าง..." : "ล้างตะกร้า"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;
