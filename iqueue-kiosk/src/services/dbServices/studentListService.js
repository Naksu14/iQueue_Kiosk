import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const getStudentInfoByLRN = async (lrn) => {
  const response = await axios.get(`${API_URL}/student-list/${lrn}`);
  return response.data;
};
