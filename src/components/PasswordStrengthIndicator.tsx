import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface ValidationCriteria {
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasMinLength: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const [criteria, setCriteria] = useState<ValidationCriteria>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
    hasMinLength: false,
  });

  useEffect(() => {
    setCriteria({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 8,
    });
  }, [password]);

  const CriteriaItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center space-x-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isValid ? 1 : 0 }}
        className={`flex items-center justify-center w-4 h-4 rounded-full ${
          isValid ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        {isValid && <FaCheck className="text-white" size={10} />}
      </motion.div>
      <span className={`text-sm ${isValid ? 'text-green-500' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );

  const getPasswordStrength = (): { strength: number; text: string; color: string } => {
    const validCriteriaCount = Object.values(criteria).filter(Boolean).length;
    
    if (validCriteriaCount === 0) return { strength: 0, text: 'Very Weak', color: 'bg-red-500' };
    if (validCriteriaCount === 1) return { strength: 20, text: 'Weak', color: 'bg-red-500' };
    if (validCriteriaCount === 2) return { strength: 40, text: 'Fair', color: 'bg-yellow-500' };
    if (validCriteriaCount === 3) return { strength: 60, text: 'Good', color: 'bg-yellow-500' };
    if (validCriteriaCount === 4) return { strength: 80, text: 'Strong', color: 'bg-green-500' };
    return { strength: 100, text: 'Very Strong', color: 'bg-green-500' };
  };

  const strengthInfo = getPasswordStrength();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 space-y-3"
    >
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-gray-500">Password Strength</span>
          <span className={strengthInfo.strength >= 60 ? 'text-green-500' : 'text-gray-500'}>
            {strengthInfo.text}
          </span>
        </div>
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthInfo.strength}%` }}
            className={`h-full ${strengthInfo.color} transition-all duration-300`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <CriteriaItem isValid={criteria.hasUpperCase} text="Uppercase letter" />
        <CriteriaItem isValid={criteria.hasLowerCase} text="Lowercase letter" />
        <CriteriaItem isValid={criteria.hasNumber} text="Number" />
        <CriteriaItem isValid={criteria.hasSymbol} text="Special character" />
        <CriteriaItem isValid={criteria.hasMinLength} text="At least 8 characters" />
      </div>
    </motion.div>
  );
};

export default PasswordStrengthIndicator; 