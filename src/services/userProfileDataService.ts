interface UserProfileData {
  id?: number;
  user?: number;
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  profile_photo?: string | null;
  vehicle_name?: number | null;
  vehicle_type?: number | null;
  manufacturer?: number | null;
  created_at?: string;
}

class UserProfileDataService {
  private profileData: UserProfileData = {};

  async saveProfileData(data: Partial<UserProfileData>): Promise<void> {
    // Validate the incoming data
    if (!this.isValidProfileData(data)) {
      console.error('Invalid profile data:', data);
      throw new Error('Invalid profile data format');
    }

    this.profileData = {
      ...this.profileData,
      ...data
    };
  }

  async getProfileData(): Promise<UserProfileData> {
    return { ...this.profileData };
  }

  private isValidProfileData(data: any): boolean {
    if (typeof data !== 'object' || data === null) {
      console.error('Data is not an object:', data);
      return false;
    }

    // Define valid field types
    const validFields = {
      id: 'number',
      user: 'number',
      username: 'string',
      email: 'string',
      name: 'string',
      phone: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      country: 'string',
      postal_code: 'string',
      profile_photo: ['string', 'null'],
      vehicle_name: ['number', 'null'],
      vehicle_type: ['number', 'null'],
      manufacturer: ['number', 'null'],
      created_at: 'string'
    };

    // Check if all fields are of the correct type
    for (const [key, value] of Object.entries(data)) {
      const expectedType = validFields[key as keyof typeof validFields];
      
      // Skip undefined values (they're optional)
      if (value === undefined) continue;

      // Handle array of valid types
      if (Array.isArray(expectedType)) {
        if (!expectedType.some(type => 
          type === 'null' ? value === null : typeof value === type
        )) {
          console.error(`Invalid type for field ${key}:`, {
            value,
            expectedTypes: expectedType,
            actualType: value === null ? 'null' : typeof value
          });
          return false;
        }
      }
      // Handle single valid type
      else if (expectedType && typeof value !== expectedType && value !== null) {
        console.error(`Invalid type for field ${key}:`, {
          value,
          expectedType,
          actualType: typeof value
        });
        return false;
      }
    }

    return true;
  }

  // Helper methods for getting specific fields
  getUserName(): string {
    return this.profileData.name || '';
  }

  getUserEmail(): string {
    return this.profileData.email || '';
  }

  getUserPhone(): string {
    return this.profileData.phone || '';
  }

  getUserAddress(): string {
    return this.profileData.address || '';
  }

  getUserCity(): string {
    return this.profileData.city || '';
  }

  getUserState(): string {
    return this.profileData.state || '';
  }

  getUserPostalCode(): string {
    return this.profileData.postal_code || '';
  }

  getUserCountry(): string {
    return this.profileData.country || '';
  }

  getVehicleInfo(): {
    vehicle_name: number | null;
    vehicle_type: number | null;
    manufacturer: number | null;
  } {
    return {
      vehicle_name: this.profileData.vehicle_name || null,
      vehicle_type: this.profileData.vehicle_type || null,
      manufacturer: this.profileData.manufacturer || null
    };
  }
}

export default new UserProfileDataService(); 