import api from "./axios";

export const getCart = async () => {
  const response = await api.get("/cart");

  return response.data;
};

export const addToCart = async (pharmacyProductId, quantity = 1) => {
  const response = await api.post("/cart/add", {
    pharmacy_product_id: pharmacyProductId,
    quantity,
  });

  return response.data;
};

export const updateCartItem = async (cartItemId, quantity) => {
  const response = await api.put(`/cart/item/${cartItemId}`, { quantity });

  return response.data;
};

export const removeCartItem = async (cartItemId) => {
  const response = await api.delete(`/cart/item/${cartItemId}`);

  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/cart/clear");

  return response.data;
};

export const checkoutOrder = async (data) => {
  const response = await api.post("/orders/checkout", data);

  return response.data;
};

export const getOrderQRCode = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/qrcode`);

  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/orders/my-orders");

  return response.data;
};

export const getOrderDetail = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);

  return response.data;
};

export const uploadPaymentSlip = async (orderId, file) => {
  const formData = new FormData();
  formData.append("slip", file);

  const response = await api.post(`/orders/${orderId}/upload-slip`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
