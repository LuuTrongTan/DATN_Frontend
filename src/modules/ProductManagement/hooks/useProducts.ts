import { useState } from 'react';

const useProducts = () => {
  const [products] = useState([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Implementation will be added later
  return { products, loading, error };
};

export default useProducts;

