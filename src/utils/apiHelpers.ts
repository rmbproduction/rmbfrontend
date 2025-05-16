/**
 * API Helper utilities for common API operations with retry functionality
 */
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { UserSubscription, VisitSchedule } from '../models/subscription-plan';
import { UserProfile } from '../models/user';
import { withRetry } from './apiUtils';

// Create an axios instance specifically for these helpers
const helperClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.DEFAULT_TIMEOUT
});

// Initialize with token if available
const token = localStorage.getItem('accessToken');
if (token) {
  helperClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Create retryable API helper functions
export const getUserProfile = withRetry(async (userId: string): Promise<UserProfile> => {
  try {
    const response = await helperClient.get(`/accounts/profile/${userId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
});

export const getUserSubscriptions = withRetry(async (): Promise<UserSubscription[]> => {
  try {
    const response = await helperClient.get(`${API_CONFIG.BASE_URL}/subscription/subscriptions/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    throw error;
  }
});

export const getSubscriptionVisits = withRetry(async (subscriptionId: number): Promise<VisitSchedule[]> => {
  try {
    const response = await helperClient.get(`${API_CONFIG.BASE_URL}/subscription/subscriptions/${subscriptionId}/visits/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching visits for subscription ${subscriptionId}:`, error);
    throw error;
  }
}); 