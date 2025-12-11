/**
 * Formats a date according to user preferences stored in localStorage
 * @param date - Date string, Date object, number (timestamp), or undefined/null
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | number | undefined | null): string {
  if (!date) return 'N/A';

  // Ensure we always have a Date object
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'N/A';

  // Get user's date format preference from user-specific settings
  let dateFormat = 'MM/DD/YYYY'; // default format

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userSettingsKey = `appSettings_${user.id}`;
      const savedSettings = localStorage.getItem(userSettingsKey);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dateFormat = settings.dateFormat || 'MM/DD/YYYY';
      }
    }
  } catch (error) {
    console.error('Error parsing settings:', error);
  }

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
}

/**
 * Formats a date with time according to user preferences
 * @param date - Date string, Date object, number (timestamp), or undefined/null
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date | number | undefined | null): string {
  if (!date) return 'N/A';

  // Ensure we always have a Date object
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'N/A';

  const formattedDate = formatDate(dateObj);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${formattedDate} ${hours}:${minutes}`;
}
