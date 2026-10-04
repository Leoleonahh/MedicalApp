import api from "./axios";

// ===============================
// Register
// ===============================

export const register = async (data) => {

  const response = await api.post(
    "/api/auth/register",
    data
  );

  return response.data;
};


// ===============================
// Login
// ===============================

export const login = async (data) => {

  const response = await api.post(
    "/api/auth/login",
    data
  );

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/api/auth/profile");

  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/api/auth/profile", data);

  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.post("/api/auth/change-password", data);

  return response.data;
};


// ===============================
// Forgot Password
// ===============================

export const forgotPassword = async (data) => {

  const response = await api.post(
    "/api/auth/forgot-password",
    data
  );

  return response.data;
};


// ===============================
// Verify OTP
// ===============================

export const verifyOTP = async (data) => {

  const response = await api.post(
    "/api/auth/verify-otp",
    data
  );

  return response.data;
};


// ===============================
// Reset Password
// ===============================

export const resetPassword = async (data) => {

  const response = await api.post(
    "/api/auth/reset-password",
    data
  );

  return response.data;
};