/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format (24-hour)
 * @returns Formatted time string in HH:MM AM/PM format
 * @example
 * formatTime('14:30') // Returns '2:30 PM'
 * formatTime('09:00') // Returns '9:00 AM'
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
