import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, notification } from 'antd';
import { ShoppingCartOutlined, CreditCardOutlined } from '@ant-design/icons';
import { axiosInstance, API_ENDPOINTS, apiService } from '../config/api.config';
import { useActiveCart, useAddToCartMutation, Cart } from '../hooks/cart/useCartQueries';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useVehicleSelection } from '../hooks/vehicle/useVehicleSelection';

interface PackageActionsProps {
  serviceId: string;
  packageId?: string;
  serviceName: string;
  packageName?: string;
  vehicleManufacturerId: number;
  vehicleModelId: number;
  vehicleManufacturer: string;
  vehicleModel: string;
  vehicleType: string;
  price: string;
  isSubscription?: boolean;
  planId?: string;
  duration?: string;
  features: string[];
}

const PackageActions: React.FC<PackageActionsProps> = ({
  serviceId,
  packageId,
  serviceName,
  packageName,
  vehicleManufacturerId,
  vehicleModelId,
  vehicleManufacturer,
  vehicleModel,
  vehicleType,
  price,
  isSubscription,
  planId,
  duration,
  features,
}) => {
  const navigate = useNavigate();
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const { activeCart } = useActiveCart();
  const addToCart = useAddToCartMutation();
  const { isAuthenticated } = useAuth();
  const { setSelectedVehicle } = useVehicleSelection();

  // Query to get the service price
  const { isLoading: isPriceLoading } = useQuery({
    queryKey: ['servicePrice', serviceId, vehicleManufacturerId, vehicleModelId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.services.servicePrice(serviceId)}?manufacturer_id=${vehicleManufacturerId}&vehicle_model_id=${vehicleModelId}`
      );
      return response.data;
    },
    enabled: !!(serviceId && vehicleManufacturerId && vehicleModelId),
  });

  const handleAddToCart = async () => {
    try {
      if (!isAuthenticated) {
        notification.info({
          message: 'Login Required',
          description: 'Please login to add items to cart.',
        });
        navigate('/login');
        return;
      }

      // If no active cart, try to create one
      if (!activeCart) {
        try {
          const createCartResponse = await apiService.services.createCart();
          if (!createCartResponse?.data?.id) {
            notification.error({
              message: 'Cart Error',
              description: 'Unable to create a new cart. Please try again.',
            });
            return;
          }
          // Wait for the cart query to update
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error creating cart:', error);
          notification.error({
            message: 'Cart Error',
            description: 'Unable to create a new cart. Please try again.',
          });
          return;
        }
      }

      // Store service details in cart items
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      cartItems.push({
        serviceId,
        packageId,
        serviceName,
        packageName,
        vehicle: {
          manufacturerId: vehicleManufacturerId,
          modelId: vehicleModelId,
          manufacturer: vehicleManufacturer,
          model: vehicleModel,
          vehicleType,
        },
        price,
        features,
        isSubscription,
        planId,
        duration,
      });
      localStorage.setItem('cartItems', JSON.stringify(cartItems));

      // Get the latest active cart
      const currentCart = await apiService.services.getUserCarts();
      const latestCart = currentCart.data?.find((cart: Cart) => cart.status === 'active');
      
      if (!latestCart?.id) {
        notification.error({
          message: 'Cart Error',
          description: 'Unable to find active cart. Please try again.',
        });
        return;
      }

      await addToCart.mutateAsync({
        cartId: latestCart.id,
        item: {
          service_id: serviceId,
          package_id: packageId,
          quantity: 1,
          manufacturer_id: vehicleManufacturerId,
          model_id: vehicleModelId
        }
      });

      notification.success({
        message: 'Added to Cart',
        description: 'Service package has been added to your cart.',
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        notification.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please login again.',
        });
        navigate('/login');
      } else {
        notification.error({
          message: 'Failed to Add to Cart',
          description: error?.response?.data?.message || 'Please try again later.',
        });
      }
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      notification.info({
        message: 'Login Required',
        description: 'Please login to proceed with purchase.',
      });
      navigate('/login');
      return;
    }

    setIsBuyingNow(true);
    try {
      // For buy now flow, we don't need to create a cart
      console.log('Proceeding with buy now flow...');

      // Store selected vehicle in React Query cache
      setSelectedVehicle({
        manufacturer: vehicleManufacturer,
        model: vehicleModel,
        vehicleType: vehicleType,
        manufacturerId: vehicleManufacturerId,
        modelId: vehicleModelId,
      });

      // Store the service data for checkout
      const checkoutItem = {
        serviceId,
        packageId,
        serviceName,
        packageName,
        vehicle: {
          manufacturerId: vehicleManufacturerId,
          modelId: vehicleModelId,
          manufacturer: vehicleManufacturer,
          model: vehicleModel,
          vehicleType,
        },
        price,
        features,
        isSubscription,
        planId,
        duration,
      };
      
      localStorage.setItem('checkoutItem', JSON.stringify(checkoutItem));
      
      // Navigate to checkout page
      navigate('/checkout?mode=buy-now');
    } catch (error: any) {
      console.error('Buy Now Error:', error);
      if (error?.response?.status === 401) {
        notification.error({
          message: 'Session Expired',
          description: 'Your session has expired. Please login again.',
        });
        navigate('/login');
      } else {
        notification.error({
          message: 'Failed to Process',
          description: 'Unable to proceed with booking. Please try again later.',
        });
      }
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (isPriceLoading) {
    return (
      <div className="flex gap-4 mt-4">
        <Button type="default" loading className="flex-1">
          Loading...
        </Button>
        <Button type="primary" loading className="flex-1">
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mt-4">
      <Button
        type="default"
        icon={<ShoppingCartOutlined />}
        onClick={handleAddToCart}
        loading={addToCart.isPending}
        className="flex-1"
      >
        Add to Cart
      </Button>
      <Button
        type="primary"
        icon={<CreditCardOutlined />}
        onClick={handleBuyNow}
        loading={isBuyingNow}
        className="flex-1"
      >
        Buy Now
      </Button>
    </div>
  );
};

export default PackageActions;