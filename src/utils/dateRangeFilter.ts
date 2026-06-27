export type DateFilterType = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export const getDateRange = (
  dateFilter: DateFilterType,
  customStartDate?: string,
  customEndDate?: string
): DateRange => {
  if (dateFilter === 'all') {
    return { startDate: null, endDate: null };
  }

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  switch (dateFilter) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0));
      endDate = new Date(yesterday.setHours(23, 59, 59, 999));
      break;
    case 'thisWeek':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      startDate = new Date(weekStart.setHours(0, 0, 0, 0));
      endDate = new Date();
      break;
    case 'lastWeek':
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
      endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
      break;
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = lastMonth;
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) endDate = new Date(customEndDate);
      break;
  }

  return { startDate, endDate };
};
