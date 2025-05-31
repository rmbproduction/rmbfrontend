import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, List, notification, Space, InputNumber, Typography, Spin } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { 
  useActiveCart,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  CartItem
} from '../hooks/cart/useCartQueries';

const { Title, Text } = Typography;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { activeCart, isLoading } = useActiveCart();
  const updateCartItem = useUpdateCartItemMutation();
  const removeCartItem = useRemoveCartItemMutation();
  const clearCart = useClearCartMutation();

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeCartItem.mutateAsync(itemId);
      notification.success({
        message: 'Item Removed',
        description: 'Item has been removed from your cart.',
      });
    } catch (error: any) {
      notification.error({
        message: 'Failed to Remove Item',
        description: error?.response?.data?.message || 'Please try again later.',
      });
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (!activeCart) return;
    
    try {
      await updateCartItem.mutateAsync({
        cartId: activeCart.id,
        itemId,
        quantity
      });
      notification.success({
        message: 'Quantity Updated',
        description: 'Cart item quantity has been updated.',
      });
    } catch (error: any) {
      notification.error({
        message: 'Failed to Update Quantity',
        description: error?.response?.data?.message || 'Please try again later.',
      });
    }
  };

  const handleClearCart = async () => {
    if (!activeCart) return;
    
    try {
      await clearCart.mutateAsync(activeCart.id);
      notification.success({
        message: 'Cart Cleared',
        description: 'All items have been removed from your cart.',
      });
    } catch (error: any) {
      notification.error({
        message: 'Failed to Clear Cart',
        description: error?.response?.data?.message || 'Please try again later.',
      });
    }
  };

  const handleCheckout = () => {
    if (!activeCart || !activeCart.items?.length) {
      notification.error({
        message: 'Cart Error',
        description: 'Your cart is empty. Please add items before proceeding to checkout.',
      });
      return;
    }

    try {
      // Navigate to checkout with explicit mode
      navigate('/checkout?mode=cart');
    } catch (error) {
      console.error('Checkout error:', error);
      notification.error({
        message: 'Checkout Error',
        description: 'Failed to process checkout. Please try again.',
      });
    }
  };

  const renderContent = () => {
    if (!activeCart || !activeCart.items?.length) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-8">
          <Empty
            description={
              <div className="text-gray-500 mt-4 text-lg">
                Your cart is empty
              </div>
            }
            image={<ShoppingCartOutlined className="text-gray-300" style={{ fontSize: 64 }} />}
          >
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/services')}
              className="mt-6"
              icon={<ArrowLeftOutlined />}
            >
              Browse Services
            </Button>
          </Empty>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/services')}
                className="flex items-center"
              >
                Continue Shopping
              </Button>
            </div>
            <Button 
              danger 
              onClick={handleClearCart}
              loading={clearCart.isPending}
              disabled={isLoading || clearCart.isPending}
              icon={<DeleteOutlined />}
            >
              Clear Cart
            </Button>
          </div>

          <List
            dataSource={activeCart.items}
            renderItem={(item: CartItem) => (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-4 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-grow">
                    <Title level={4} className="!mb-2">{item.service_name}</Title>
                    {item.package_name && (
                      <Text type="secondary" className="block mb-2">
                        Package: {item.package_name}
                      </Text>
                    )}
                    <div className="mt-4">
                      <Space direction="vertical" size="large" className="w-full">
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center">
                            <Text className="mr-2">Quantity:</Text>
                            <InputNumber
                              min={1}
                              value={item.quantity}
                              onChange={(value) => value && handleUpdateQuantity(item.id, value)}
                              disabled={isLoading || updateCartItem.isPending}
                              className="w-20"
                            />
                          </div>
                          <Text strong className="text-lg">₹{item.service_price}</Text>
                        </div>
                        <Text type="secondary" className="text-base">
                          Subtotal: ₹{(parseFloat(item.service_price) * item.quantity).toFixed(2)}
                        </Text>
                      </Space>
                    </div>
                  </div>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(item.id)}
                    loading={removeCartItem.isPending}
                    disabled={isLoading || removeCartItem.isPending}
                    className="self-start"
                  />
                </div>
              </div>
            )}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <Title level={3} className="!mb-6">Order Summary</Title>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <Text>Subtotal</Text>
                <Text strong>₹{activeCart.total_amount}</Text>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <Text>Service Tax</Text>
                <Text type="secondary">Included</Text>
              </div>
              <div className="flex justify-between items-center pt-2">
                <Title level={4} className="!mb-0">Total</Title>
                <Title level={4} className="!mb-0">₹{activeCart.total_amount}</Title>
              </div>
            </div>
            <Button 
              type="primary" 
              size="large" 
              block 
              onClick={handleCheckout}
              disabled={isLoading || clearCart.isPending || !activeCart?.items?.length}
              className="mt-8 bg-[#FF5733] hover:bg-[#ff4019]"
            >
              Proceed to Checkout
            </Button>
            <Text type="secondary" className="block text-center mt-4">
              Prices are inclusive of all taxes
            </Text>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Title level={2} className="mb-8">Shopping Cart</Title>
        <Spin spinning={isLoading} tip="Loading cart...">
          <div className="min-h-[60vh]">
            {renderContent()}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default Cart;