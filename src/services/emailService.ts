import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

/**
 * Email Service
 * 
 * Provides functionality to send emails from the frontend application
 * through the backend API.
 */
const emailService = {
  /**
   * Send vehicle summary email to the user
   * @param vehicleId The ID of the vehicle
   * @param email The recipient email address
   * @param summaryData The vehicle summary data to include in the email
   * @returns Promise that resolves when email is sent
   */
  sendVehicleSummaryEmail: async (
    vehicleId: string, 
    email: string, 
    summaryData: any
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Authentication required to send email.');
      }
      
      // Get user info from localStorage if available
      const userPhone = localStorage.getItem('userPhone') || summaryData.contact_number || '';
      const userName = localStorage.getItem('userName') || '';
      
      // Prepare the email data
      const emailData = {
        recipient_email: email,
        subject: `Summary of Your Vehicle Listing - ${summaryData.vehicle?.brand} ${summaryData.vehicle?.model}`,
        vehicle_id: vehicleId,
        summary_data: summaryData,
        recipient_name: userName,
        recipient_phone: userPhone,
        include_attachments: true // Flag to include any photos/docs as attachments
      };
      
      // Make API call to send email
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/marketplace/email-vehicle-summary/`,
        emailData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: 'Vehicle summary was successfully sent to your email.'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to send email. Please try again.'
        };
      }
    } catch (error: any) {
      console.error('Error sending vehicle summary email:', error);
      
      // Format a user-friendly error message
      let errorMessage = 'Failed to send email. Please try again later.';
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = 'Authentication required to send email. Please log in again.';
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },
  
  /**
   * Generate the email body content for a vehicle summary
   * Can be used for preview or to create custom emails
   * @param summaryData The vehicle summary data
   * @returns HTML string for the email body
   */
  generateVehicleSummaryEmailContent: (summaryData: any): string => {
    const vehicle = summaryData.vehicle || {};
    
    // Format price
    const formatPrice = (price: string | number): string => {
      if (!price) return 'Not specified';
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      return `₹${numericPrice.toLocaleString('en-IN')}`;
    };
    
    // Format date
    const formatDate = (dateString: string): string => {
      if (!dateString) return 'Not specified';
      try {
        return new Date(dateString).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return dateString;
      }
    };
    
    // Base summary content
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #FF5733; margin-bottom: 20px; font-size: 24px;">Vehicle Summary</h1>
        
        <div style="margin-bottom: 20px; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          <h2 style="margin-top: 0; color: #333; font-size: 20px;">
            ${vehicle.brand || 'Unknown'} ${vehicle.model || ''} ${vehicle.year || ''}
          </h2>
          <p style="color: #FF5733; font-size: 18px; font-weight: bold;">
            Expected Price: ${formatPrice(vehicle.expected_price || vehicle.price || 0)}
            ${summaryData.is_price_negotiable ? ' (Negotiable)' : ''}
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            Vehicle Details
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 40%;">Registration</td>
              <td style="padding: 8px 0; font-weight: bold;">${vehicle.registration_number || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Condition</td>
              <td style="padding: 8px 0; font-weight: bold;">${vehicle.condition || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Driven</td>
              <td style="padding: 8px 0; font-weight: bold;">${vehicle.kms_driven ? `${vehicle.kms_driven} km` : 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Fuel Type</td>
              <td style="padding: 8px 0; font-weight: bold;">${vehicle.fuel_type || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Color</td>
              <td style="padding: 8px 0; font-weight: bold;">${vehicle.color || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Last Service Date</td>
              <td style="padding: 8px 0; font-weight: bold;">${formatDate(vehicle.last_service_date || '')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Insurance Valid Till</td>
              <td style="padding: 8px 0; font-weight: bold;">${formatDate(vehicle.insurance_valid_till || '')}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            Contact Information
          </h3>
          <p style="margin: 8px 0;"><strong>Contact Number:</strong> ${summaryData.contact_number || 'Not provided'}</p>
          <p style="margin: 8px 0;"><strong>Pickup Address:</strong> ${summaryData.pickup_address || 'Not provided'}</p>
        </div>
        
        <div style="margin-top: 30px; font-size: 14px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
          <p>This is an automatically generated email. Please do not reply to this message.</p>
          <p>© ${new Date().getFullYear()} AutoRevive. All rights reserved.</p>
        </div>
      </div>
    `;
  }
};

export default emailService; 