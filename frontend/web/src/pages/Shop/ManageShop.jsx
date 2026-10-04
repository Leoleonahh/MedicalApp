import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getPharmacyProducts } from "../../api/pharmacy.api";
import api from "../../api/axios";
import "./ManageShop.css";

function ManageShop() {
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalSales: 0,
    monthlySales: [],
    bestSellingProducts: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      if (!localStorage.getItem("token")) {
        setError("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      try {
        const selectedShop = JSON.parse(
          localStorage.getItem("selected_shop") || "null"
        );

        if (!selectedShop?.pharmacy_id) {
          setError("ไม่พบร้านค้าที่เลือก");
          return;
        }

        const result = await getPharmacyProducts(selectedShop.pharmacy_id);
        setProducts(result.products || result.data || []);
      } catch (err) {
        console.error("Load pharmacy products error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลสินค้าได้");
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const selectedShop = JSON.parse(
          localStorage.getItem("selected_shop") || "null"
        );

        if (!selectedShop?.pharmacy_id) return;

        const response = await api.get(
          `/orders/pharmacy/${selectedShop.pharmacy_id}/orders`
        );
        const orders = response.data?.data || [];
        const orderDetails = await Promise.all(
          orders.map(async (order) => {
            const detailResponse = await api.get(
              `/orders/pharmacy/orders/${order.order_id}`
            );
            return {
              ...order,
              items: detailResponse.data?.data?.items || [],
            };
          })
        );

        const validOrders = orderDetails.filter(
          (order) => order.order_status === "DELIVERED"
        );

        const monthlySales = new Map();
        const productSales = new Map();
        let totalSales = 0;

        validOrders.forEach((order) => {
          const total = Number(order.grand_total) || 0;
          const month = new Date(order.created_at).toLocaleDateString("th-TH", {
            month: "short",
            year: "numeric",
          });

          totalSales += total;
          monthlySales.set(month, (monthlySales.get(month) || 0) + total);

          order.items.forEach((item) => {
            const name = item.product_name || "ไม่ระบุชื่อสินค้า";
            const current = productSales.get(name) || { quantity: 0, sales: 0 };
            productSales.set(name, {
              quantity: current.quantity + (Number(item.quantity) || 0),
              sales: current.sales + (Number(item.subtotal) || 0),
            });
          });
        });

        setDashboard({
          totalSales,
          monthlySales: Array.from(monthlySales, ([month, sales]) => ({
            month,
            sales,
          })),
          bestSellingProducts: Array.from(productSales, ([name, values]) => ({
            name,
            ...values,
          }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5),
        });
      } catch (err) {
        console.error("Load shop dashboard error:", err);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="products-page">
      <div className="left-accent" />

      <div className="products-container">
        <header className="products-header">
          <div className="products-left">
            <Link to="/shop/select" className="manage-back"><FaArrowLeft /></Link>
            <h1 className="products-title">Products</h1>
          </div>

          <div className="products-actions">
            <Link to="/shop/orders" className="pill">order</Link>
            <Link to="/shop/edit-products" className="pill">Edit Products</Link>
            <Link to="/shop/select" className="pill">เลือกร้าน</Link>
            <Link to="/shop/profile" className="pill">Shop Profile</Link>
          </div>
        </header>

        <div className="products-grid">
          <div className="product-column">
            {error && <p className="products-message products-error">{error}</p>}

            {!error && products.length === 0 && (
              <p className="products-message">ยังไม่มีสินค้าในร้านนี้</p>
            )}

            {products.map((product) => (
              <div className="product-item" key={product.pharmacy_product_id}>
                <div className="product-item-info">
                  <strong>{product.product_name || "-"}</strong>
                  <span>{product.type || "-"}</span>
                </div>
                <div className="product-item-meta">
                  <span>ราคา {product.price ?? "-"}</span>
                  <span>คงเหลือ {product.stock ?? "-"} ชิ้น</span>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="product-column dashboard-column">
            <div className="dashboard-heading">
              <h2>Shop Dashboard</h2>
              <span>สรุปยอดขายของร้าน</span>
            </div>

            <div className="dashboard-total">
              <span>ยอดขายรวม</span>
              <strong>{dashboard.totalSales.toLocaleString("th-TH")} บาท</strong>
            </div>

            <section className="dashboard-section">
              <h3>ยอดขายรายเดือน</h3>
              {dashboard.monthlySales.length ? (
                <div className="monthly-sales-list">
                  {dashboard.monthlySales.map((item) => (
                    <div className="monthly-sales-item" key={item.month}>
                      <span>{item.month}</span>
                      <strong>{item.sales.toLocaleString("th-TH")} บาท</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty">ยังไม่มีข้อมูลยอดขาย</p>
              )}
            </section>

            <section className="dashboard-section">
              <h3>สินค้าที่ขายดีที่สุด</h3>
              {dashboard.bestSellingProducts.length ? (
                <div className="best-selling-list">
                  {dashboard.bestSellingProducts.map((item, index) => (
                    <div className="best-selling-item" key={item.name}>
                      <span className="best-selling-rank">{index + 1}</span>
                      <div>
                        <strong>{item.name}</strong>
                        <span>ขายแล้ว {item.quantity} ชิ้น</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty">ยังไม่มีข้อมูลสินค้า</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageShop;
