/**
 * Format số tiền thành định dạng VNĐ
 * @param value - Số tiền cần format (có thể là number, string, hoặc Decimal)
 * @returns Chuỗi đã format (ví dụ: "300,000đ")
 */
export const formatCurrency = (value: number | string): string => {
  // Convert to number if it's a string
  let numValue: number;
  
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    return '0đ';
  }
  
  if (isNaN(numValue) || numValue === null || numValue === undefined) {
    return '0đ';
  }
  
  return `${Math.round(numValue).toLocaleString('vi-VN')}đ`;
};

/**
 * Format số tiền thành định dạng VNĐ với đơn vị đầy đủ
 * @param value - Số tiền cần format
 * @returns Chuỗi đã format (ví dụ: "300,000 VNĐ")
 */
export const formatCurrencyFull = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0 VNĐ';
  }
  
  return `${Math.round(value).toLocaleString('vi-VN')} VNĐ`;
};
