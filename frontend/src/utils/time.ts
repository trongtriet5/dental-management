/**
 * Format time from HH:MM:SS to HH:MM
 * @param timeString - Time string in format HH:MM:SS or HH:MM
 * @returns Formatted time string in HH:MM format
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // If already in HH:MM format, return as is
  if (timeString.match(/^\d{1,2}:\d{2}$/)) {
    return timeString;
  }
  
  // If in HH:MM:SS format, remove seconds
  if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
    return timeString.substring(0, 5);
  }
  
  // If in other formats, try to parse and format
  try {
    const [hours, minutes] = timeString.split(':');
    if (hours && minutes) {
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
  } catch (error) {
    console.warn('Error formatting time:', timeString, error);
  }
  
  return timeString; // Return original if can't format
};

/**
 * Format time for display with optional seconds
 * @param timeString - Time string
 * @param showSeconds - Whether to show seconds
 * @returns Formatted time string
 */
export const formatTimeDisplay = (timeString: string, showSeconds: boolean = false): string => {
  if (!timeString) return '';
  
  if (showSeconds) {
    return timeString;
  }
  
  return formatTime(timeString);
};

/**
 * Format date to DD/MM/YYYY format
 * @param dateString - Date string in various formats
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Chưa có';
  
  try {
    let date: Date;
    
    // Handle different input formats
    if (dateString.includes('/')) {
      // Handle DD/MM/YYYY format
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateString.includes('-')) {
      // Handle YYYY-MM-DD format
      date = new Date(dateString);
    } else {
      // Try to parse as Date
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    // Format to DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return 'Ngày không hợp lệ';
  }
};

/**
 * Format date for display with custom format
 * @param dateString - Date string
 * @param format - Format string (default: 'DD/MM/YYYY')
 * @returns Formatted date string
 */
export const formatDateDisplay = (dateString: string, format: string = 'DD/MM/YYYY'): string => {
  if (!dateString) return 'Chưa có';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString());
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return 'Ngày không hợp lệ';
  }
};

/**
 * Get greeting message based on current time of day
 * @returns Greeting message string
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Chào buổi sáng! Chúc bạn một ngày làm việc hiệu quả.";
  } else if (hour >= 12 && hour < 17) {
    return "Chào buổi trưa! Nghỉ ngơi lấy lại năng lượng, rồi tiếp tục làm việc thôi nào!";
  } else {
    return "Chào buổi chiều! Cố gắng thêm chút nữa, sắp hết ngày rồi.";
  }
};
