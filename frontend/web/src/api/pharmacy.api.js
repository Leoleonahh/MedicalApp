import api from "./axios";

export const registerPharmacy = async (data) => {
  const response = await api.post("/pharmacies/register", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getMyVerifiedPharmacies = async () => {
  const response = await api.get("/pharmacies/my/verified");

  return response.data;
};

export const getAllVerifiedPharmacies = async () => {
  const response = await api.get("/pharmacies/verified");

  return response.data;
};

export const getPharmacyDetail = async (pharmacyId) => {
  const response = await api.get(`/pharmacies/${pharmacyId}`);

  return response.data;
};

export const updatePromptPay = async (pharmacyId, promptpayNumber) => {
  const response = await api.put(`/pharmacies/${pharmacyId}/promptpay`, {
    promptpay_number: promptpayNumber,
  });

  return response.data;
};

export const getPharmacyProducts = async (pharmacyId) => {
  const response = await api.get(`/pharmacies/${pharmacyId}/products`);

  return response.data;
};

export const getPharmacyProductTypes = async () => {
  const response = await api.get("/pharmacies/products/types");

  return response.data;
};

export const createPharmacyProduct = async (pharmacyId, data) => {
  const formData = new FormData();
  formData.append("product_name", data.product_name);
  formData.append("description", data.description);
  formData.append("typepro_id", data.typepro_id);
  formData.append("price", data.price);
  formData.append("stock", data.stock);
  if (data.image) formData.append("image", data.image);

  const response = await api.post(
    `/pharmacies/${pharmacyId}/products`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
};

export const updatePharmacyProduct = async (
  pharmacyId,
  pharmacyProductId,
  data
) => {
  const response = await api.put(
    `/pharmacies/${pharmacyId}/products/${pharmacyProductId}`,
    data
  );

  return response.data;
};
