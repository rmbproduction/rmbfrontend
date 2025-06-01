import axios from 'axios';
import TokenManager from './tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://repairmybike.up.railway.app/api';

const marketplaceService = {
  async submitVehicle(formData: any, photos: any, documents: any) {
    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.post(
      `${API_BASE_URL}/marketplace/vehicles/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  },

  async getUserSellRequests() {
    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.get(
      `${API_BASE_URL}/marketplace/sell-requests/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  },

  enrichVehicleData(data: any) {
    return {
      ...data,
      created_at: new Date().toISOString(),
      status: data.status || 'pending'
    };
  }
};

export default marketplaceService; 