import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const createQueueNumber = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/queue-number`,
      userData
    );
    const createdQueueNumber = response.data;
    return createdQueueNumber;
  } catch (error) {
    console.error("Error creating user info:", error);
    throw error;
  }
};