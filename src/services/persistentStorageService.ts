const VEHICLE_DATA_PREFIX = 'vehicle_data_';

const persistentStorageService = {
  async saveVehicleData(vehicleId: string | number, data: any): Promise<void> {
    try {
      localStorage.setItem(`${VEHICLE_DATA_PREFIX}${vehicleId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      throw new Error('Failed to save vehicle data');
    }
  },

  getVehicleData(vehicleId: string | number): any {
    try {
      const data = localStorage.getItem(`${VEHICLE_DATA_PREFIX}${vehicleId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving vehicle data:', error);
      return null;
    }
  },

  removeVehicleData(vehicleId: string | number): void {
    try {
      localStorage.removeItem(`${VEHICLE_DATA_PREFIX}${vehicleId}`);
    } catch (error) {
      console.error('Error removing vehicle data:', error);
    }
  }
};

export default persistentStorageService; 