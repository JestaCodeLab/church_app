/**
 * Predefined permission categories for the system
 * These are the main areas that permissions fall under
 */

export const PERMISSION_CATEGORIES = {
  members: {
    slug: 'members',
    name: 'Member Management',
    description: 'Manage church members',
    icon: 'Users'
  },
  departments: {
    slug: 'departments',
    name: 'Department Management',
    description: 'Manage departments and leaders',
    icon: 'FolderKanban'
  },
  branches: {
    slug: 'branches',
    name: 'Branch Management',
    description: 'Manage church branches',
    icon: 'Church'
  },
  events: {
    slug: 'events',
    name: 'Event Management',
    description: 'Manage events and registrations',
    icon: 'Calendar'
  },
  finance: {
    slug: 'finance',
    name: 'Financial Management',
    description: 'Manage finances and reports',
    icon: 'HandCoins'
  },
  communications: {
    slug: 'communications',
    name: 'Communications',
    description: 'SMS, email, and messaging',
    icon: 'MessageSquare'
  },
  reports: {
    slug: 'reports',
    name: 'Reports & Analytics',
    description: 'View and export reports',
    icon: 'BarChart3'
  },
  users: {
    slug: 'users',
    name: 'User Management',
    description: 'Manage users and roles',
    icon: 'Users'
  },
  settings: {
    slug: 'settings',
    name: 'Settings',
    description: 'System settings and configuration',
    icon: 'Settings'
  },
  dashboard: {
    slug: 'dashboard',
    name: 'Dashboard',
    description: 'Dashboard access',
    icon: 'LayoutDashboard'
  }
};

export const PERMISSION_CATEGORY_LIST = Object.values(PERMISSION_CATEGORIES);

export const getCategoryName = (slug: string): string => {
  return PERMISSION_CATEGORIES[slug as keyof typeof PERMISSION_CATEGORIES]?.name || slug;
};
