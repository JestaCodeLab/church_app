import { DriveStep } from 'driver.js';

export const PAGE_TOURS: Record<string, DriveStep[]> = {
  dashboard: [
    {
      element: '[data-tour="dashboard-stats"]',
      popover: {
        title: 'Overview Cards',
        description: 'See your church\'s key metrics at a glance — members, events, finances, and more.',
      },
    },
    {
      element: '[data-tour="dashboard-quick-actions"]',
      popover: {
        title: 'Quick Actions',
        description: 'Shortcuts to the most common tasks: add a member, create an event, or record income.',
      },
    },
    {
      element: '[data-tour="dashboard-branch-filter"]',
      popover: {
        title: 'Branch Filter',
        description: 'Switch between branches to see data scoped to a specific location.',
      },
    },
  ],
  members_all: [
    {
      element: '[data-tour="members-add-btn"]',
      popover: {
        title: 'Add a Member',
        description: 'Click here to add a new member individually with their full profile.',
      },
    },
    {
      element: '[data-tour="members-search"]',
      popover: {
        title: 'Search & Filter',
        description: 'Search by name, or filter members by role, branch, gender, or status.',
      },
    },
    {
      element: '[data-tour="members-import"]',
      popover: {
        title: 'Bulk Import',
        description: 'Upload a CSV spreadsheet to add many members at once.',
      },
    },
  ],
  events: [
    {
      element: '[data-tour="events-create-btn"]',
      popover: {
        title: 'Create Event',
        description: 'Click to create a new event or service for your church.',
      },
    },
    {
      element: '[data-tour="events-tabs"]',
      popover: {
        title: 'Filter by Type',
        description: 'Switch between Services, Events, and Special Occasions to organize and view different types.',
      },
    },
    {
      element: '[data-tour="events-actions"]',
      popover: {
        title: 'Manage Events',
        description: 'Edit, delete, or access check-in and attendance for each event using the action buttons.',
      },
    },
  ],
  finance_income: [
    {
      element: '[data-tour="finance-record-btn"]',
      popover: {
        title: 'Record Income',
        description: 'Click to log donations, tithes, or other income sources.',
      },
    },
    {
      element: '[data-tour="finance-filter"]',
      popover: {
        title: 'Filter by Category',
        description: 'View income by type: tithes, offerings, donations, or custom categories.',
      },
    },
    {
      element: '[data-tour="finance-export"]',
      popover: {
        title: 'Export Records',
        description: 'Download your income data as CSV or PDF for accounting and reporting.',
      },
    },
  ],
  messaging_send: [
    {
      element: '[data-tour="messaging-sender-id"]',
      popover: {
        title: 'Sender ID',
        description: 'Configure your sender ID — recipients will see this name when they receive your SMS.',
      },
    },
    {
      element: '[data-tour="messaging-credits"]',
      popover: {
        title: 'SMS Credits',
        description: 'Check your available credits balance. Each SMS costs credits based on your recipient count.',
      },
    },
    {
      element: '[data-tour="messaging-history"]',
      popover: {
        title: 'Message History',
        description: 'View all sent, scheduled, and failed messages. Check delivery status and details here.',
      },
    },
  ],
};
