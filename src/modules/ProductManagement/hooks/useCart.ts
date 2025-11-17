import { useState } from 'react';

const useCart = () => {
  const [cartItems, setCartItems] = useState([]);

  // Implementation will be added later
  return { cartItems, setCartItems };
};

export default useCart;

