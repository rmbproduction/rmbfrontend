/**
 * Utility functions for financial calculations
 */

/**
 * Calculate EMI (Equated Monthly Installment) for a given loan amount
 * @param principal - The loan amount
 * @param months - The loan tenure in months
 * @param interestRate - The annual interest rate in percentage (e.g., 10 for 10%)
 * @returns The calculated monthly EMI amount
 */
export const calcEMI = (principal: number, months: number = 12, interestRate: number = 10): number => {
  if (!principal || principal <= 0) return 0;
  if (!months || months <= 0) return principal;
  
  // Convert annual interest rate to monthly rate
  const monthlyRate = interestRate / (12 * 100);
  
  // EMI calculation formula
  // EMI = P × r × (1 + r)ⁿ / ((1 + r)ⁿ - 1)
  // Where:
  // P = Principal loan amount
  // r = Monthly interest rate (annual rate ÷ 12 ÷ 100)
  // n = Loan tenure in months
  
  // If interest rate is 0, just divide the principal by months
  if (interestRate === 0) {
    return principal / months;
  }
  
  const emi = 
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(emi);
};

/**
 * Calculate total interest payable over the loan tenure
 * @param principal - The loan amount
 * @param months - The loan tenure in months
 * @param interestRate - The annual interest rate in percentage
 * @returns The total interest payable
 */
export const calculateTotalInterest = (
  principal: number, 
  months: number = 12, 
  interestRate: number = 10
): number => {
  const emi = calcEMI(principal, months, interestRate);
  const totalPayment = emi * months;
  return totalPayment - principal;
};

/**
 * Get monthly EMI amounts for different loan tenures
 * @param principal - The loan amount
 * @param tenures - Array of tenures in months
 * @param interestRate - The annual interest rate in percentage
 * @returns Object with tenures as keys and EMI amounts as values
 */
export const getEMIOptions = (
  principal: number, 
  tenures: number[] = [3, 6, 12], 
  interestRate: number = 10
): Record<number, number> => {
  const options: Record<number, number> = {};
  
  tenures.forEach(tenure => {
    options[tenure] = calcEMI(principal, tenure, interestRate);
  });
  
  return options;
}; 