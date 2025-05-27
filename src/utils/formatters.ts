export const formatPrice = (price: string | number | null | undefined): string => {
  if (price === null || price === undefined) return '0';
  
  // Ensure we have a valid number
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0';
  
  return Number(numPrice).toLocaleString('en-IN');
}; 