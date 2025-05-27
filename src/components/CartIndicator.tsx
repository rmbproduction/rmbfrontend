import React from 'react';
import { Badge } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useActiveCart } from '../hooks/cart/useCartQueries';

const CartIndicator: React.FC = () => {
  const navigate = useNavigate();
  const { cartCount } = useActiveCart();

  return (
    <Badge count={cartCount} showZero>
      <ShoppingCartOutlined 
        className="text-2xl cursor-pointer" 
        onClick={() => navigate('/cart')}
      />
    </Badge>
  );
};

export default CartIndicator; 