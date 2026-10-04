import api from "./axios";

export const getHotlines = async () => {
  const response = await api.get("/api/hotlines");

  return response.data;
};
