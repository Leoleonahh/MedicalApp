import api from "./axios";

// =====================================
// Upload Wound
// =====================================

export const uploadWound = async (data) => {
  if (!(data.image instanceof File)) {
    throw new Error("กรุณาเลือกไฟล์รูปภาพก่อนอัปโหลด");
  }

  const formData = new FormData();

  formData.append("image", data.image);

  if (data.associated_symptom) {
    formData.append(
      "associated_symptom",
      data.associated_symptom
    );
  }

  if (data.incident_date) {
    formData.append(
      "incident_date",
      data.incident_date
    );
  }

  if (data.wound_site) {
    formData.append(
      "wound_site",
      data.wound_site
    );
  }

  if (data.latitude) {
    formData.append(
      "latitude",
      data.latitude
    );
  }

  if (data.longitude) {
    formData.append(
      "longitude",
      data.longitude
    );
  }

  // ดูข้อมูลก่อนส่ง
  console.log("Image:", data.image);
  console.log("FormData image:", formData.get("image"));

  const response = await api.post(
    "/api/wound/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


// =====================================
// Predict Wound by uploaded image id
// =====================================

export const predictWound = async (imageId) => {
  const response = await api.post("/api/predict", {
    image_id: imageId,
  });

  return response.data;
};

// =====================================
// Recommendation by prediction id
// =====================================

export const getRecommendation = async (predictionId) => {
  const response = await api.get(`/api/recommendations/${predictionId}`);

  return response.data;
};

// =====================================
// Wound history for current user
// =====================================

export const getWoundHistory = async () => {
  const response = await api.get("/api/wound/history/list/all");

  return response.data;
};

// =====================================
// Wound detail with prediction
// =====================================

export const getWoundDetail = async (imageId) => {
  const response = await api.get(`/api/wound/detail/${imageId}`);

  return response.data;
};


// =====================================
// Recommendations
// =====================================

export const getRecommendations = async () => {

  const response = await api.get(
    "/api/recommendations"
  );

  return response.data;
};