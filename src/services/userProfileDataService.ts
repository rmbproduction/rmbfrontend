import { API_CONFIG } from '../config/api.config';
import axios from 'axios';

/**
 * Interface for standardized profile data
 */
export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  [key: string]: string; // Allow for additional fields
}

/**
 * UserProfileDataService handles all user profile data operations
 * It acts as a central point for retrieving and saving user profile information
 * across different storage locations (localStorage, sessionStorage, and server)
 */
const userProfileDataService = {
  /**
   * Get user's phone number from any available source
   * @returns {string} The user's phone number or empty string if not found
   */
  getUserPhone: (): string => {
    try {
      // Check all possible storage locations with priority
      const storageSources = [
        { name: 'localStorage.userPhone', value: localStorage.getItem('userPhone') },
        { name: 'localStorage.userProfileData', value: localStorage.getItem('userProfileData') },
        { name: 'localStorage.userProfile', value: localStorage.getItem('userProfile') },
        { name: 'sessionStorage.savedProfileData', value: sessionStorage.getItem('savedProfileData') },
        { name: 'sessionStorage.userProfile', value: sessionStorage.getItem('userProfile') },
        { name: 'localStorage.user', value: localStorage.getItem('user') },
        { name: 'sessionStorage.user', value: sessionStorage.getItem('user') }
      ];
      
      // Log all potential sources for debugging
      console.log('[userProfileDataService] Looking for phone number in storage:');
      
      for (const source of storageSources) {
        if (source.value) {
          try {
            // If it's directly a phone number string
            if (typeof source.value === 'string' && 
                (source.value.startsWith('+') || /^\d{10,15}$/.test(source.value))) {
              console.log(`[userProfileDataService] Found phone in ${source.name} directly:`, source.value);
              return source.value;
            }
            
            // Try to parse JSON
            const parsed = JSON.parse(source.value);
            if (parsed && parsed.phone) {
              console.log(`[userProfileDataService] Found phone in ${source.name}:`, parsed.phone);
              return parsed.phone;
            }
          } catch (e) {
            console.warn(`[userProfileDataService] Error parsing ${source.name}:`, e);
          }
        }
      }
      
      // If nothing found
      console.warn('[userProfileDataService] No phone number found in any storage location');
      return '';
    } catch (e) {
      console.error('[userProfileDataService] Error retrieving user phone:', e);
      return '';
    }
  },
  
  /**
   * Get user's address from any available source
   * @returns {string} The user's address or empty string if not found
   */
  getUserAddress: (): string => {
    try {
      // Check all possible storage locations with priority
      return (
        localStorage.getItem('userAddress') || 
        JSON.parse(localStorage.getItem('userProfileData') || '{}')?.address || 
        JSON.parse(localStorage.getItem('userProfile') || '{}')?.address || 
        JSON.parse(sessionStorage.getItem('savedProfileData') || '{}')?.address ||
        JSON.parse(sessionStorage.getItem('userProfile') || '{}')?.address || 
        ''
      );
    } catch (e) {
      console.error('Error retrieving user address:', e);
      return '';
    }
  },
  
  /**
   * Get user's name from any available source
   * @returns {string} The user's name or empty string if not found
   */
  getUserName: (): string => {
    try {
      // Check all possible storage locations with priority
      return (
        JSON.parse(localStorage.getItem('userProfileData') || '{}')?.name || 
        JSON.parse(localStorage.getItem('userProfile') || '{}')?.name || 
        JSON.parse(localStorage.getItem('user') || '{}')?.name ||
        JSON.parse(sessionStorage.getItem('savedProfileData') || '{}')?.name ||
        JSON.parse(sessionStorage.getItem('userProfile') || '{}')?.name || 
        ''
      );
    } catch (e) {
      console.error('Error retrieving user name:', e);
      return '';
    }
  },
  
  /**
   * Get user's email from any available source
   * @returns {string} The user's email or empty string if not found
   */
  getUserEmail: (): string => {
    try {
      // Check all possible storage locations with priority
      return (
        JSON.parse(localStorage.getItem('userProfileData') || '{}')?.email || 
        JSON.parse(localStorage.getItem('userProfile') || '{}')?.email || 
        JSON.parse(localStorage.getItem('user') || '{}')?.email ||
        JSON.parse(sessionStorage.getItem('savedProfileData') || '{}')?.email ||
        JSON.parse(sessionStorage.getItem('userProfile') || '{}')?.email || 
        ''
      );
    } catch (e) {
      console.error('Error retrieving user email:', e);
      return '';
    }
  },
  
  /**
   * Get full profile data, merged from all sources
   * @returns {ProfileData} Combined profile data from all sources
   */
  getFullProfileData: (): ProfileData => {
    try {
      // Default empty profile
      const emptyProfile: ProfileData = {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: ''
      };
      
      // Try to get data from localStorage
      let localStorageProfile: Partial<ProfileData> = {};
      try {
        localStorageProfile = JSON.parse(localStorage.getItem('userProfileData') || '{}');
      } catch (e) {
        console.warn('Error parsing userProfileData from localStorage:', e);
      }
      
      // Try to get data from userProfile in localStorage
      let userProfileLocal: Partial<ProfileData> = {};
      try {
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        userProfileLocal = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          postalCode: profile.postal_code || ''
        };
      } catch (e) {
        console.warn('Error parsing userProfile from localStorage:', e);
      }
      
      // Try to get data from sessionStorage
      let sessionStorageProfile: Partial<ProfileData> = {};
      try {
        sessionStorageProfile = JSON.parse(sessionStorage.getItem('savedProfileData') || '{}');
      } catch (e) {
        console.warn('Error parsing savedProfileData from sessionStorage:', e);
      }
      
      // Try to get user data
      let userData: Partial<ProfileData> = {};
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        userData = {
          name: user.name || user.username || '',
          email: user.email || ''
        };
      } catch (e) {
        console.warn('Error parsing user data from localStorage:', e);
      }
      
      // Special case for phone and address
      const phone = userProfileDataService.getUserPhone();
      const address = userProfileDataService.getUserAddress();
      
      // Merge all sources, with later sources taking precedence
      return {
        ...emptyProfile,
        ...userData,
        ...userProfileLocal,
        ...sessionStorageProfile,
        ...localStorageProfile,
        phone: phone || localStorageProfile.phone || userProfileLocal.phone || sessionStorageProfile.phone || '',
        address: address || localStorageProfile.address || userProfileLocal.address || sessionStorageProfile.address || ''
      };
    } catch (e) {
      console.error('Error getting full profile data:', e);
      return {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: ''
      };
    }
  },
  
  /**
   * Save profile data to all necessary storage locations
   * @param {ProfileData} data - The profile data to save
   */
  saveProfileData: (data: Partial<ProfileData>): void => {
    try {
      // Save to localStorage
      if (data.phone) {
        localStorage.setItem('userPhone', data.phone);
      }
      
      if (data.address) {
        localStorage.setItem('userAddress', data.address);
      }
      
      // Update userProfileData in localStorage
      try {
        const currentProfileData = JSON.parse(localStorage.getItem('userProfileData') || '{}');
        const updatedProfileData = { ...currentProfileData, ...data };
        localStorage.setItem('userProfileData', JSON.stringify(updatedProfileData));
      } catch (e) {
        console.warn('Error updating userProfileData in localStorage:', e);
        localStorage.setItem('userProfileData', JSON.stringify(data));
      }
      
      // Update savedProfileData in sessionStorage
      try {
        const currentSessionData = JSON.parse(sessionStorage.getItem('savedProfileData') || '{}');
        const updatedSessionData = { ...currentSessionData, ...data };
        sessionStorage.setItem('savedProfileData', JSON.stringify(updatedSessionData));
      } catch (e) {
        console.warn('Error updating savedProfileData in sessionStorage:', e);
        sessionStorage.setItem('savedProfileData', JSON.stringify(data));
      }
      
      console.log('Profile data saved to local storage:', data);
    } catch (e) {
      console.error('Error saving profile data:', e);
    }
  },
  
  /**
   * Save profile data to the server
   * @param {Partial<ProfileData>} data - The profile data to save
   * @returns {Promise<any>} The server response
   */
  saveProfileToServer: async (data: Partial<ProfileData>): Promise<any> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Format the data for the server
      const serverData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode
      };
      
      // Make the API call
      const response = await axios.patch(
        `${API_CONFIG.BASE_URL}/accounts/profile/`,
        serverData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // If successful, also save to local storage
      userProfileDataService.saveProfileData(data);
      
      return response.data;
    } catch (error) {
      console.error('Error saving profile to server:', error);
      throw error;
    }
  },
  
  /**
   * Fetch the user's profile from the server
   * @returns {Promise<ProfileData>} The user's profile data
   */
  fetchProfileFromServer: async (): Promise<ProfileData> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/accounts/profile/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Format the response data
      const profileData: ProfileData = {
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        postalCode: response.data.postal_code || ''
      };
      
      // Save to local storage
      userProfileDataService.saveProfileData(profileData);
      
      return profileData;
    } catch (error) {
      console.error('Error fetching profile from server:', error);
      // Return local data as fallback
      return userProfileDataService.getFullProfileData();
    }
  },
  
  /**
   * Initialize profile data by fetching from server if available,
   * otherwise using local data
   * @returns {Promise<ProfileData>} The user's profile data
   */
  initializeProfileData: async (): Promise<ProfileData> => {
    try {
      // Try to fetch from server first
      return await userProfileDataService.fetchProfileFromServer();
    } catch (e) {
      console.warn('Could not fetch profile from server, using local data:', e);
      return userProfileDataService.getFullProfileData();
    }
  }
};

export default userProfileDataService; 