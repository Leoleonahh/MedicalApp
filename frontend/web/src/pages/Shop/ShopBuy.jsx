import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ShopBuy.css";

function ShopBuy() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const shops = JSON.parse(localStorage.getItem("my_shops") || "[]");
    const s = shops.find((x) => String(x.id) === String(id));
    setShop(s || null);

    // try to load shop products from localStorage, otherwise sample
    const key = `shop_products_${id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setProducts(JSON.parse(saved));
      return;
    }

    const sample = [
      { id: 1, name: "ผ้าพันแผล", price: 120 },
      { id: 2, name: "ผ้าก๊อซ", price: 20 },
      { id: 3, name: "พลาสเตอร์", price: 95 },
    ];
    localStorage.setItem(key, JSON.stringify(sample));
    setProducts(sample);
  }, [id]);

  function addToCart(p) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const found = cart.find((c) => c.id === p.id && c.shopId === Number(id));
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ ...p, qty: 1, shopId: Number(id) });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${p.name} ถูกเพิ่มในตะกร้า`);
  }

  if (!shop) return <div style={{padding:24}}>ไม่พบร้านค้า</div>;

  return (
    <div className="buy-page">
      <div className="left-accent" />
      <div className="buy-container">
        <header className="buy-header">
          <Link to="/shop/buy" className="manage-back">กลับ</Link>
          <h1 className="buy-title">ร้าน: {shop.name}</h1>
        </header>

        <div className="product-list">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-left">
                <div className="product-name">{p.name}</div>
                <div className="product-price">{p.price} บาท</div>
              </div>
              <div className="product-actions">
                <button className="btn-add" onClick={() => addToCart(p)}>ซื้อ</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopBuy;
