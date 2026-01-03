import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import AdminLayout from '../../layout/AdminLayout';
import MerchantLayout from '../../layout/MerchantLayout';
import ProtectedRoute from '../../routes/ProtectedRoute';
import PublicRoute from '../../routes/PublicRoute';

// Pages
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import VerifyEmail from '../../pages/auth/VerifyEmail';
import Dashboard from '../../pages/merchant/Dashboard';
import AllMembers from '../../pages/merchant/members/AllMembers';
import NewMember from '../../pages/merchant/members/NewMember';
import EditMember from '../../pages/merchant/members/EditMember';
import Settings from '../../pages/merchant/Settings';
import MemberDetails from '../../pages/merchant/members/MemberDetails';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminMerchants from '../../pages/admin/AdminMerchants';
import AdminUsers from '../../pages/admin/AdminUsers';
import Onboarding from '../../pages/auth/Onboarding';
import OnboardingRoute from '../../routes/OnboardingRoute';
import Branches from '../../pages/merchant/branches/AllBranches';
import NewBranch from '../../pages/merchant/branches/NewBranch';
import BranchDetails from '../../pages/merchant/branches/BranchDetails';
import { Edit } from 'lucide-react';
import EditBranch from '../../pages/merchant/branches/EditBranch';
import AdminFeatures from '../../pages/admin/AdminFeatures';
import AdminBranches from '../../pages/admin/AdminBranches';
import AdminMerchantDetails from '../../pages/admin/AdminMerchantDetails';
import AdminUserDetails from '../../pages/admin/AdminUserDetails';
import OnboardingSuccess from '../onboarding/OnboardingSuccess';
import PendingApprovalRoute from '../../routes/PendingApprovalRoute';
import { useMerchant } from '../../context/MerchantContext';
import AdminPlans from '../../pages/admin/plans/AdminPlans';
import AdminPlanEdit from '../../pages/admin/plans/AdminPlanEdit';
import AdminCreatePlan from '../../pages/admin/plans/AdminCreatePlan';
import AdminPlanDetails from '../../pages/admin/plans/AdminPlanDetails';
import AdminDiscounts from '../../pages/admin/discount/AdminDiscount';
import AdminCreateDiscount from '../../pages/admin/discount/AdminCreateDiscount';
import AdminDiscountDetails from '../../pages/admin/discount/AdminDiscountDetails';
import AdminEditDiscount from '../../pages/admin/discount/AdminEditDiscount';
import NotFound from '../../pages/NotFound';
import AllEvents from '../../pages/merchant/events/AllEvents';
import NewEvent from '../../pages/merchant/events/NewEvent';
import EventDetails from '../../pages/merchant/events/EventDetails';
import EventAttendance from '../../pages/merchant/events/EventAttendance';
import GuestManagement from '../../pages/merchant/events/GuestManagement';
import EventCheckIn from '../../pages/public/EventCheckIn';
import PublicRegistration from '../../pages/public/PublicRegistration';
import EventDonations from '../../pages/merchant/events/EventDonations';
import AllDepartments from '../../pages/merchant/departments/AllDepartments';
import DepartmentForm from '../../pages/merchant/departments/DepartmentForm';
import DepartmentDetails from '../../pages/merchant/departments/DepartmentDetails';
import DepartmentAdminDashboard from '../../pages/merchant/departments/DepartmentAdminDashboard';
import { useAuth } from '../../context/AuthContext';
import SMSDashboard from '../../pages/merchant/messaging/SMSDashboard';
import SendSMS from '../../pages/merchant/messaging/SendSMS';
import SMSTemplates from '../../pages/merchant/messaging/SMSTemplates';
import SMSHistory from '../../pages/merchant/messaging/SMSHistory';
import SMSCredits from '../../pages/merchant/messaging/SMSCredits';
import SMSStatistics from '../../pages/admin/sms/AdminSMSStatistics';
import SMSPackages from '../../pages/admin/sms/AdminSMSPackages';
import AdminSMSBalance from '../../pages/admin/sms/AdminSMSBalance';
import Birthdays from '../../pages/merchant/members/Birthdays';
import BranchMembers from '../../pages/merchant/branches/BranchMembers';
import BirthdaySettings from '../../pages/merchant/members/BirthdaySettings';
import AdminLogs from '../../pages/admin/logs/AdminLogs';
import PublicEventDonation from '../../pages/public/PublicEventDonation';
import DonationStatus from '../../pages/public/DonationStatus';

// Add this wrapper component
const RegisterGuard = ({ children }: { children: React.ReactNode }) => {
  const { isMainDomain, loading } = useMerchant();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only allow register on main domain
  if (!isMainDomain) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


const AnimatedRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { merchant, isMainDomain } = useMerchant();

  // Update document title based on subdomain
  useEffect(() => {
    if (merchant) {
      // On church subdomain: "Faith Church - The Church HQ"
      document.title = `${merchant.name} - The Church HQ`;
    } else if (isMainDomain) {
      // On main domain: "The Church HQ - Church Management Platform"
      document.title = 'The Church HQ - Church Management Platform';
    }
  }, [merchant, isMainDomain]);

  // Update favicon based on merchant logo (optional)
  useEffect(() => {
    if (merchant?.branding?.logo) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = merchant.branding.logo;
      }
    }
  }, [merchant]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={
            <RegisterGuard>
              <Register />
            </RegisterGuard>
          } />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/events/attend/:qrData" element={<EventCheckIn />} />
          <Route path="/attend/:eventId" element={<EventCheckIn />} />
          <Route path="/register/:merchantId" element={<PublicRegistration />} />
          <Route path="/donate/:uniqueId" element={<PublicEventDonation />} />
          <Route path="/donate/:uniqueId/status" element={<DonationStatus />} />
        </Route>

        {/* Onboarding Route - Requires auth but not completed onboarding */}
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

         {/* Pending Approval Route - NEW! */}
        <Route element={<PendingApprovalRoute />}>
            <Route path="/onboarding/success" element={<OnboardingSuccess />} />
        </Route>

        {/* Protected Routes - Church Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MerchantLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/new" element={<NewBranch />} />
            <Route path="/branches/:id" element={<BranchDetails />} />
            <Route path="/branches/:id/edit" element={<EditBranch />} />
            <Route path="/branches/:id/members" element={<BranchMembers />} />

            <Route path="/members/all" element={<AllMembers />} />
            <Route path="/members/new" element={<NewMember />} />
            <Route path="/members/:id" element={<MemberDetails />} />
            <Route path="/members/:id/edit" element={<EditMember />} />
            <Route path="/members/birthdays" element={<Birthdays />} />
            <Route path="/members/birthdays/settings" element={<BirthdaySettings />} />

            <Route path="/events" element={<AllEvents />} />
            <Route path="/events/new" element={<NewEvent />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/events/:id/edit" element={<NewEvent />} />
            <Route path="/events/:id/attendance" element={<EventAttendance />} />
            <Route path="/events/:id/donations" element={<EventDonations />} />
            <Route path="/events/guests" element={<GuestManagement />} />
            
            
            <Route 
              path="/departments" 
              element={
                user?.role?.slug === 'dept_admin' 
                  ? <DepartmentAdminDashboard /> 
                  : <AllDepartments />
              } 
            />
            <Route path="/departments/new" element={<DepartmentForm />} />
            <Route path="/departments/:id" element={<DepartmentDetails />} />
            <Route path="/departments/:id/edit" element={<DepartmentForm />} />

            {/* SMS Routes */}
          <Route path="/messaging/analytics" element={<SMSDashboard />} />
          <Route path="/messaging/send" element={<SendSMS />} />
          <Route path="/messaging/templates" element={<SMSTemplates />} />
          <Route path="/messaging/history" element={<SMSHistory />} />
          <Route path="/messaging/credits" element={<SMSCredits />} />

            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Protected Routes - Super Admin Dashboard */}
        <Route element={<ProtectedRoute requiredRole="super_admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/churches" element={<AdminMerchants />} />
            <Route path="/admin/churches/:id" element={<AdminMerchantDetails />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetails />} />
            <Route path="/admin/branches" element={<AdminBranches />} />
            <Route path="/admin/features" element={<AdminFeatures />} />
            
            {/* Plans */}
            <Route path="/admin/plans" element={<AdminPlans />} />
            <Route path="/admin/plans/new" element={<AdminCreatePlan />} />
            <Route path="/admin/plans/:id" element={<AdminPlanDetails />} />
            <Route path="/admin/plans/:id/edit" element={<AdminPlanEdit />} />
            
            {/* Discounts */}
            <Route path="/admin/discounts" element={<AdminDiscounts />} />
            <Route path="/admin/discounts/new" element={<AdminCreateDiscount />} />
            <Route path="/admin/discounts/:id" element={<AdminDiscountDetails />} />
            <Route path="/admin/discounts/:id/edit" element={<AdminEditDiscount />} />

            {/* ✅ NEW: Messaging Routes */}
            <Route path="/admin/sms-packages" element={<SMSPackages />} />
            <Route path="/admin/sms-statistics" element={<SMSStatistics />} />
            <Route path="/admin/sms-balance" element={<AdminSMSBalance />} />

            <Route path="/admin/logs" element={<AdminLogs />} />
          </Route>
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;