interface UserProfileData {
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at?: string;
}

class UserProfileDataService {
  private profileData: UserProfileData = {};

  async saveProfileData(data: Partial<UserProfileData>): Promise<void> {
    // Validate the incoming data
    if (!this.isValidProfileData(data)) {
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
      return false;
    }

    // Check if all fields are of the correct type
    for (const [key, value] of Object.entries(data)) {
      switch (key) {
        case 'username':
        case 'email':
        case 'name':
        case 'phone':
        case 'address':
        case 'city':
        case 'state':
        case 'pincode':
        case 'created_at':
          if (value !== undefined && typeof value !== 'string') {
            return false;
          }
          break;
        default:
          // Unknown field
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

  getUserPincode(): string {
    return this.profileData.pincode || '';
  }
}

export default new UserProfileDataService(); 