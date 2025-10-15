import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const createUserInfo = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/walkin-transaction/personal-info`,
      userData
    );
    const createdUser = response.data;
    return createdUser;
  } catch (error) {
    console.error("Error creating user info:", error);
    throw error;
  }
};

export const createUserTransaction = async (userTransaction) => {
  try {
    const response = await axios.post(
      `${API_URL}/walkin-transaction/transactions/batch`,
      userTransaction
    );
    const createdUserTransaction = response.data;
    return createdUserTransaction;
  } catch (error) {
    console.error("Error creating user info:", error);
    throw error;
  }
};
