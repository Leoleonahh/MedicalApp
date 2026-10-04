import "./Shop.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../../layouts/Topbar";
import { getPharmacyProducts } from "../../api/pharmacy.api";
import {
  addToCart as addProductToCart,
  getCart,
} from "../../api/cart.api";

import {
  FaArrowLeft,
  FaShoppingCart,
  FaSearch
} from "react-icons/fa";
import api from "../../api/axios";

const API_URL = import.meta.env.VITE_API_URL;

function Shop() {
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWoundType, setSelectedWoundType] = useState("");
  const [recommendedMedicineNames, setRecommendedMedicineNames] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const loadCartCount = async () => {
    try {
      const response = await getCart();
      return response.data?.total_quantity || 0;
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        return 0;
      }
      return null;
    }
  };

  useEffect(() => {
    loadCartCount().then((count) => {
      if (count !== null) setCartCount(count);
    });

    const loadProducts = async () => {
      try {
        const selected = JSON.parse(
          localStorage.getItem("selected_shop") || "null"
        );

        if (!selected?.pharmacy_id) {
          setError("ไม่พบร้านค้าที่เลือก");
          return;
        }

        setShopInfo(selected);
        const result = await getPharmacyProducts(selected.pharmacy_id);
        setProducts(result.products || result.data || []);
      } catch (requestError) {
        console.error("Load shop products error:", requestError);
        setError(
          requestError.response?.data?.message ||
          "ไม่สามารถโหลดสินค้าของร้านได้"
        );
      } finally {
        setLoading(false);
      }

    };

    loadProducts();
  }, []);

  const addToCart = async (product) => {
    const pharmacyProductId = product.pharmacy_product_id;
    if (!pharmacyProductId || addingProductId) return;

    const saved = JSON.parse(localStorage.getItem("medicalapp_cart") || "[]");
    const nextCart = [...saved];
    const productId = product.product_id || product.id;
    const shopId = shopInfo?.pharmacy_id || null;
    const existing = nextCart.find(
      (row) => row.id === productId && row.shopId === shopId
    );

    if (existing && existing.quantity >= Number(product.stock)) {
      return;
    }

    if (!existing && Number(product.stock) <= 0) {
      return;
    }

    try {
      setAddingProductId(pharmacyProductId);
      const response = await addProductToCart(pharmacyProductId, 1);
      const cartItem = response.data;

      if (existing) {
        existing.quantity = cartItem.quantity;
      } else {
        nextCart.push({
          ...product,
          id: productId,
          name: product.product_name || product.name,
          quantity: cartItem.quantity,
          shopId,
        });
      }
      localStorage.setItem("medicalapp_cart", JSON.stringify(nextCart));
      const count = await loadCartCount();
      if (count !== null) setCartCount(count);
    } catch (requestError) {
      console.error("Add product to cart error:", requestError);
      setError(
        requestError.response?.data?.message ||
        "ไม่สามารถเพิ่มสินค้าลงตะกร้าได้"
      );
    } finally {
      setAddingProductId(null);
    }
  };

  const getProductImage = (image) => {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    if (image.startsWith("/")) {
      return `${API_URL}${image}`;
    }
    return `${API_URL}/uploads/products/${encodeURIComponent(image)}`;
  };

  const handleWoundTypeChange = async (event) => {
    const woundType = event.target.value;
    setSelectedWoundType(woundType);
    setRecommendedMedicineNames([]);
    setRecommendationError("");

    if (!woundType) return;

    try {
      setLoadingRecommendations(true);
      const response = await api.get(`/api/medicines/wound-type/${woundType}`);
      setRecommendedMedicineNames(
        (response.data?.data || []).map((medicine) => medicine.medicine_name)
      );
    } catch (requestError) {
      console.error("Load wound medicine recommendations error:", requestError);
      setRecommendationError("ไม่สามารถโหลดรายการยาสำหรับบาดแผลนี้ได้");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const normalizeProductName = (name) =>
    name.toLocaleLowerCase().replace(/[\s/.-]+/g, "");

  const searchFilteredProducts = products.filter((product) =>
    product.product_name
      ?.toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );
  const filteredProducts = selectedWoundType
    ? searchFilteredProducts.filter((product) => {
        const productName = normalizeProductName(product.product_name || "");
        return recommendedMedicineNames.some((medicineName) => {
          const normalizedMedicineName = normalizeProductName(medicineName);
          return productName.includes(normalizedMedicineName) ||
            normalizedMedicineName.includes(productName);
        });
      })
    : searchFilteredProducts;

  return (
    <div className="shop-page">

      <Topbar />

      <div className="shop-header">

        <Link to="/shop/buy">
          <FaArrowLeft className="back-btn"/>
        </Link>

        <div className="search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ค้นหา"
          />
          <FaSearch className="search-icon"/>
        </div>

        <div className="shop-icons">
          <Link to="/order-history" className="order-icon" title="ประวัติคำสั่งซื้อ">
            คำสั่งซื้อ
          </Link>
          <Link to="/cart" className="cart-icon" title="ตะกร้าสินค้า">
            <FaShoppingCart />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>

      </div>

      {shopInfo && (
        <div className="shop-selected-banner">
          กำลังเลือกร้าน: <strong>{shopInfo.pharmacy_name}</strong>
        </div>
      )}

      <div className="products-section">

        <div className="wound-filter">
          <label htmlFor="wound-type-filter">เลือกประเภทบาดแผลเพื่อดูยาที่แนะนำ</label>
          <select
            id="wound-type-filter"
            value={selectedWoundType}
            onChange={handleWoundTypeChange}
            disabled={loadingRecommendations}
          >
            <option value="">สินค้าทั้งหมด</option>
            <option value="cut_small">แผลฉีกขาดขนาดเล็ก</option>
            <option value="cut_large">แผลฉีกขาดขนาดใหญ่</option>
            <option value="abrasion">แผลถลอก</option>
            <option value="burn">แผลน้ำร้อนลวก</option>
            <option value="bruise">แผลฟกช้ำ</option>
          </select>
          {recommendationError && <p className="wound-filter-error">{recommendationError}</p>}
        </div>

        <div className="products-grid">

          {loading && <p>กำลังโหลดสินค้า...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p>ยังไม่มีสินค้าในร้านนี้</p>
          )}

          {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
            <p>
              {selectedWoundType
                ? "ร้านนี้ยังไม่มีสินค้าที่ตรงกับยาที่แนะนำสำหรับบาดแผลนี้"
                : "ไม่พบสินค้าที่ค้นหา"}
            </p>
          )}

          {filteredProducts.map((item)=>(
            <div
              className="product-card"
              key={item.pharmacy_product_id}
            >

              <div className="product-image">
                {item.image && (
                  <img src={getProductImage(item.image)} alt={item.product_name} />
                )}
              </div>

              <div className="product-name">
                {item.product_name}
              </div>

              <div className="product-price">
                ฿{item.price ?? 0}
              </div>

              <div className="product-stock">
                สต็อก: {item.stock ?? 0} ชิ้น
              </div>

              <button
                className="product-btn"
                type="button"
                onClick={() => addToCart(item)}
                disabled={
                  addingProductId === item.pharmacy_product_id ||
                  Number(item.stock) <= 0 ||
                  (() => {
                    const cartItem = JSON.parse(
                      localStorage.getItem("medicalapp_cart") || "[]"
                    ).find(
                      (row) =>
                        row.id === (item.product_id || item.id) &&
                        row.shopId === shopInfo?.pharmacy_id
                    );
                    return cartItem?.quantity >= Number(item.stock);
                  })()
                }
              >
                {Number(item.stock) <= 0
                  ? "สินค้าหมด"
                  : addingProductId === item.pharmacy_product_id
                    ? "กำลังเพิ่ม..."
                    : "เพิ่มลงตะกร้า"}
              </button>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

export default Shop;