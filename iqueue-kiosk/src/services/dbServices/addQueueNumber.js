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

export const updateQueueNoStatus = async (queueNumberId, status) =>{
  try {
    const response = await axios.patch(
      `${API_URL}/queue-number/update-status/${queueNumberId}`,
      { status }
    );
    const updatedQueueNumber = response.data;
    return updatedQueueNumber;
  } catch (error) {
    console.error("Error updating queue number status:", error);
    throw error;
  }
};


// get count of waiting queue numbers
export const getCountWaiting = async (officeName) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `${API_URL}/queue-number/count/waiting/${officeName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getAverageServiceTime = async (officeId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/service-time/average-duration/${officeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};