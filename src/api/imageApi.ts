/**
 * API utilities for testing Cloudinary image URLs
 */
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { isValidCloudinaryUrl } from '../services/imageUtils';

/**
 * Test backend image URL generation
 */
export const testImageUrls = async () => {
  try {
    // Get a vehicle ID
    const vehiclesResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/?limit=3`);
    
    if (!vehiclesResponse.data || !Array.isArray(vehiclesResponse.data) || vehiclesResponse.data.length === 0) {
      console.error('No vehicles found for testing');
      return { success: false, error: 'No vehicles found' };
    }
    
    // Get the first vehicle ID
    const vehicleId = vehiclesResponse.data[0].id;
    
    // Get the vehicle details
    const vehicleResponse = await axios.get(`${API_CONFIG.BASE_URL}/marketplace/vehicles/${vehicleId}/`);
    
    // Extract the image URLs
    const { front_image_url, back_image_url, left_image_url, right_image_url } = vehicleResponse.data;
    
    // Test each URL for format validity
    const results = {
      vehicleId,
      front: {
        url: front_image_url,
        isValidFormat: isValidCloudinaryUrl(front_image_url),
        accessible: false
      },
      back: {
        url: back_image_url,
        isValidFormat: isValidCloudinaryUrl(back_image_url),
        accessible: false
      },
      left: {
        url: left_image_url,
        isValidFormat: isValidCloudinaryUrl(left_image_url),
        accessible: false
      },
      right: {
        url: right_image_url,
        isValidFormat: isValidCloudinaryUrl(right_image_url),
        accessible: false
      }
    };
    
    // Test accessibility of each URL
    try {
      if (front_image_url) {
        const response = await fetch(front_image_url, { method: 'HEAD' });
        results.front.accessible = response.ok;
      }
    } catch (e) {}
    
    try {
      if (back_image_url) {
        const response = await fetch(back_image_url, { method: 'HEAD' });
        results.back.accessible = response.ok;
      }
    } catch (e) {}
    
    try {
      if (left_image_url) {
        const response = await fetch(left_image_url, { method: 'HEAD' });
        results.left.accessible = response.ok;
      }
    } catch (e) {}
    
    try {
      if (right_image_url) {
        const response = await fetch(right_image_url, { method: 'HEAD' });
        results.right.accessible = response.ok;
      }
    } catch (e) {}
    
    console.log('Image URL test results:', results);
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Error testing image URLs:', error);
    return {
      success: false,
      error: error
    };
  }
};

export default {
  testImageUrls
}; 