// Validation utilities
export const validatePhoneNumber = (phone: string): boolean => {
  // Vietnamese phone number regex
  // Supports formats: 0123456789, 0987654321, +84123456789, 84123456789
  const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with +84, keep as is
  if (cleaned.startsWith('+84')) {
    return cleaned;
  }
  
  // If starts with 84, add +
  if (cleaned.startsWith('84')) {
    return '+' + cleaned;
  }
  
  // If starts with 0, replace with +84
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  }
  
  return cleaned;
};

export const getPhoneNumberError = (phone: string): string => {
  if (!phone.trim()) {
    return 'Số điện thoại là bắt buộc';
  }
  
  if (!validatePhoneNumber(phone)) {
    return 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0123456789)';
  }
  
  return '';
};
