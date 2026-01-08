import axios from "axios";

// 🔴 Leave empty for Vercel deployment (it uses relative path)
const API_URL = "";

export const fetchRiskData = async (timeRange = "5Y") => {
  try {
    // This constructs: https://your-site.vercel.app/api/dashboard-data?range=5Y
    const response = await axios.get(
      `${API_URL}/api/dashboard-data?range=${timeRange}`
    );
    return response.data;
  } catch (error) {
    console.error("Connection Failed:", error);
    return null;
  }
};
