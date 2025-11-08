import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export const getOfficeById = async (office_id) => {
  const response = await axios.get(`${API_URL}/office-details/${office_id}`);
  return response.data;
}

//  Get all office details
export const getAllOffices = async () => {
  const response = await axios.get(`${API_URL}/office-details`);
  return response.data;
};

//  Get services in each office
export const getAllServicesInOffices = async (office_id) => {
  const response = await axios.get(
    `${API_URL}/office-transactions/services/${office_id}/bulk`
  );
  return response.data;
};

//  Get office hours for each office
export const getAllOfficeHours = async (office_id) => {
  const response = await axios.get(`${API_URL}/office-hours/${office_id}`);
  return response.data;
};

//  Combine everything into full office data
export const getAllOfficeFullData = async () => {
  const offices = await getAllOffices();

  const fullOfficeData = await Promise.all(
    offices.map(async (office) => {
      const [transactions, hours] = await Promise.all([
        getAllServicesInOffices(office.office_id),
        getAllOfficeHours(office.office_id),
      ]);

      return {
        id: office.office_id,
        name: office.office_name,
        status: office.office_status,
        closed_reason: office.closed_reason,
        location: office.location,
        head_person: office.head_person,
        contact_number: office.contact_number,
        email_address: office.email_address,
        transactions: (transactions || []).map((t) => ({
          id: t.office_transaction_id,
          type: t.transaction_type,
          name: t.transaction_details,
          amount: t.transaction_amount,
        })),
        hours: hours || [],
      };
    })
  );

  return fullOfficeData;
};
