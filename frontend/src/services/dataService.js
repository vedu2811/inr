import axios from "axios";

// 🔴 FIX: Smart URL detection
const API_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

export const fetchRiskData = async (timeRange = "5Y") => {
  try {
    const response = await axios.get(
      `${API_URL}/api/dashboard-data?range=${timeRange}`
    );
    return response.data;
  } catch (error) {
    console.error("Connection Failed:", error);
    return null;
  }
};
