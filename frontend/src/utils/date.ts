// Date utility functions
export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    // Handle different date formats
    let date: Date;
    
    if (dateString.includes('/')) {
      // Handle dd/mm/yyyy format
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle yyyy-mm-dd format
      date = new Date(dateString);
    }
    
    // Return in yyyy-mm-dd format for HTML input
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString || '';
  }
};

export const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Convert from yyyy-mm-dd to yyyy-mm-dd format for API
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return dateString;
  }
};

export const formatDateTimeForDisplay = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime for display:', error);
    return dateTimeString || '';
  }
};
