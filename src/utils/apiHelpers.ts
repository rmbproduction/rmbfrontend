/**
 * API Helper utilities for common API operations with retry functionality
 */
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { UserSubscription, VisitSchedule } from '../models/subscription-plan';
import { UserProfile } from '../models/user';

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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Internal retry function
async function retryableRequest<T>(
  requestFn: () => Promise<T>,
  retries = MAX_RETRIES,
  delayMs = RETRY_DELAY_MS
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying request, ${retries} attempts left`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return retryableRequest(requestFn, retries - 1, delayMs * 2);
  }
}

// API Functions with built-in retry
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const response = await retryableRequest(() => 
      helperClient.get(`/accounts/profile/${userId}/`)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function getUserSubscriptions(): Promise<UserSubscription[]> {
  try {
    const response = await retryableRequest(() => 
      helperClient.get(`${API_CONFIG.BASE_URL}/subscription/subscriptions/`)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    throw error;
  }
}

export async function getSubscriptionVisits(subscriptionId: number): Promise<VisitSchedule[]> {
  try {
    const response = await retryableRequest(() => 
      helperClient.get(`${API_CONFIG.BASE_URL}/subscription/subscriptions/${subscriptionId}/visits/`)
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching visits for subscription ${subscriptionId}:`, error);
    throw error;
  }
} 