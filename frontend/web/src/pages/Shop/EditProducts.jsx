import { Link } from "react-router-dom";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  createPharmacyProduct,
  getPharmacyProductTypes,
  getPharmacyProducts,
  updatePharmacyProduct,
} from "../../api/pharmacy.api";
import "./EditProducts.css";

function EditProducts() {
  const [products, setProducts] = useState([]);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [error, setError] = useState(() =>
    localStorage.getItem("token") ? "" : "กรุณาเข้าสู่ระบบก่อน"
  );
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [productTypes, setProductTypes] = useState([]);
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    description: "",
    typepro_id: "",
    price: "",
    stock: "",
    image: null,
  });

  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const selectedShop = JSON.parse(
          localStorage.getItem("selected_shop") || "null"
        );

        if (!selectedShop?.pharmacy_id) {
          setError("ไม่พบร้านค้าที่เลือก");
          return;
        }

        setPharmacyId(selectedShop.pharmacy_id);
        const [result, typesResult] = await Promise.all([
          getPharmacyProducts(selectedShop.pharmacy_id),
          getPharmacyProductTypes(),
        ]);
        setProducts(result.products || result.data || []);
        setProductTypes(typesResult.data || []);
      } catch (err) {
        console.error("Load products for edit error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("token")) loadProducts();
  }, []);

  const handleEditClick = (p) => {
    setSelected(p.pharmacy_product_id);
    setQty(p.stock);
    setPrice(p.price);
  };

  const handleSave = async () => {
    if (!pharmacyId || selected === null) return;

    try {
      setSaving(true);
      const result = await updatePharmacyProduct(pharmacyId, selected, {
        stock: Number(qty),
        price: Number(price),
      });
      const updatedProduct = result.data;

      setProducts((prev) =>
        prev.map((product) =>
          product.pharmacy_product_id === selected
            ? {
                ...product,
                stock: updatedProduct?.stock ?? Number(qty),
                price: updatedProduct?.price ?? Number(price),
              }
            : product
        )
      );
      setSelected(null);
    } catch (err) {
      console.error("Update pharmacy product error:", err);
      setError(err.response?.data?.message || "ไม่สามารถบันทึกสินค้าได้");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();
    if (!pharmacyId) return;
    const formElement = event.currentTarget;

    try {
      setError("");
      setSaving(true);
      const result = await createPharmacyProduct(pharmacyId, newProduct);
      setProducts((current) => [...current, result.data]);
      setNewProduct({
        product_name: "",
        description: "",
        typepro_id: "",
        price: "",
        stock: "",
        image: null,
      });
      formElement.reset();
      setAdding(false);
    } catch (err) {
      console.error("Create pharmacy product error:", err);
      setError(err.response?.data?.message || "ไม่สามารถเพิ่มสินค้าได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-products-page">
      <div className="left-accent" />

      <div className="ep-container">
        <header className="ep-header">
          <div className="ep-left">
            <Link to="/shop/manage" className="manage-back"><FaArrowLeft /></Link>
            <h1 className="ep-title">Products</h1>
          </div>

          <div className="ep-actions">
            <button
              type="button"
              className="pill primary"
              onClick={() => {
                setSelected(null);
                setAdding(true);
                setError("");
              }}
            >
              เพิ่มสินค้าใหม่
            </button>
          </div>
        </header>

        <div className="ep-card">
          <div className="ep-columns">
            <div className="ep-column">
              <div className="ep-column-title">รายการสินค้า</div>
              {loading && <div className="ep-empty">กำลังโหลดข้อมูลสินค้า...</div>}
              {error && <div className="ep-empty ep-error">{error}</div>}
              {!loading && !error && products.length === 0 && (
                <div className="ep-empty">ยังไม่มีสินค้าในร้านนี้</div>
              )}
              {products.map((p) => (
                <div className="ep-item" key={p.pharmacy_product_id}>
                  <div className="ep-item-left">
                    <div className="ep-name">{p.product_name}</div>
                    <div className="ep-meta">จำนวน: {p.stock} ชิ้น</div>
                  </div>
                  <div className="ep-item-right">
                    <div className="ep-price">฿{p.price ?? "-"}</div>
                    <button className="icon-btn" onClick={() => handleEditClick(p)}><FaEdit/></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ep-column">
              <div className="ep-column-title">รายละเอียด / แก้ไข</div>
              {adding ? (
                <form className="ep-edit-form" onSubmit={handleAddProduct}>
                  <div className="ep-field">
                    <label htmlFor="new-product-name">ชื่อสินค้า</label>
                    <input
                      id="new-product-name"
                      value={newProduct.product_name}
                      onChange={(event) => setNewProduct((current) => ({ ...current, product_name: event.target.value }))}
                      maxLength={150}
                      required
                    />
                  </div>
                  <div className="ep-field">
                    <label htmlFor="new-product-type">ประเภทสินค้า</label>
                    <select
                      id="new-product-type"
                      value={newProduct.typepro_id}
                      onChange={(event) => setNewProduct((current) => ({ ...current, typepro_id: event.target.value }))}
                      required
                    >
                      <option value="">เลือกประเภทสินค้า</option>
                      {productTypes.map((type) => (
                        <option key={type.typepro_id} value={type.typepro_id}>{type.type_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ep-field">
                    <label htmlFor="new-product-description">รายละเอียดสินค้า</label>
                    <textarea
                      id="new-product-description"
                      value={newProduct.description}
                      onChange={(event) => setNewProduct((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                  <div className="ep-field">
                    <label htmlFor="new-product-image">รูปสินค้า (ไม่บังคับ)</label>
                    <input
                      id="new-product-image"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setNewProduct((current) => ({ ...current, image: event.target.files?.[0] || null }))}
                    />
                  </div>
                  <div className="ep-form-row">
                    <div className="ep-field">
                      <label htmlFor="new-product-price">ราคา</label>
                      <input
                        id="new-product-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(event) => setNewProduct((current) => ({ ...current, price: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="ep-field">
                      <label htmlFor="new-product-stock">จำนวน (ชิ้น)</label>
                      <input
                        id="new-product-stock"
                        type="number"
                        min="0"
                        step="1"
                        value={newProduct.stock}
                        onChange={(event) => setNewProduct((current) => ({ ...current, stock: event.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  {error && <div className="ep-empty ep-error">{error}</div>}
                  <div className="ep-actions-row">
                    <button type="button" className="pill" onClick={() => setAdding(false)}>ยกเลิก</button>
                    <button type="submit" className="pill primary" disabled={saving}>
                      {saving ? "กำลังเพิ่มสินค้า..." : "เพิ่มสินค้า"}
                    </button>
                  </div>
                </form>
              ) : selected ? (
                <div className="ep-edit-form">
                  <div className="ep-field">
                    <label>ชื่อสินค้า</label>
                    <input value={products.find((x) => x.pharmacy_product_id === selected)?.product_name || ""} readOnly />
                  </div>
                  <div className="ep-field">
                    <label>จำนวน (ชิ้น)</label>
                    <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
                  </div>
                  <div className="ep-field">
                    <label>ราคา</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="ep-actions-row">
                    <button className="pill" onClick={() => setSelected(null)}>ยกเลิก</button>
                    <button className="pill primary" onClick={handleSave} disabled={saving}>
                      {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ep-empty">เลือกสินค้าจากด้านซ้ายเพื่อแก้ไข (เฉพาะจำนวนและราคา)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProducts;
