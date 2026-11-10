import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { TripsProvider } from './context/TripsContext';
import { DiaryProvider } from './context/DiaryContext';
import { VaultProvider } from './context/VaultContext';
import { DestinationsProvider } from './context/DestinationsContext';
import { NotificationsProvider } from './context/NotificationsContext';

// Layout Shells
import { PublicShell } from './layouts/PublicShell';
import { FeaturePageLayout } from './layouts/FeaturePageLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public & User Pages
import { HomeEntry } from './pages/HomeEntry';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ExplorePage } from './pages/ExplorePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SafetyPage } from './pages/SafetyPage';
import { AboutPage } from './pages/AboutPage';
import { CommunityRulesPage } from './pages/CommunityRulesPage';
import { VaultSecurityPage } from './pages/VaultSecurityPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

import { TravelVaultPage } from './pages/TravelVaultPage';
import { FindTripPage } from './pages/FindTripPage';
import { CreateTripPage } from './pages/CreateTripPage';
import { TripDetailsPage } from './pages/TripDetailsPage';
import { TripLeaderConsolePage } from './pages/TripLeaderConsolePage';
import { TravelDiaryPage } from './pages/TravelDiaryPage';
import { AddExperiencePage } from './pages/AddExperiencePage';
import { CreateStoryPage } from './pages/CreateStoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { DestinationDetailPage } from './pages/DestinationDetailPage';
import { CreateDestinationPage } from './pages/CreateDestinationPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountSecurityPage } from './pages/AccountSecurityPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/common/ScrollToTop';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailsPage } from './pages/admin/AdminUserDetailsPage';
import { AdminTripsPage } from './pages/admin/AdminTripsPage';
import { AdminTripDetailsPage } from './pages/admin/AdminTripDetailsPage';
import { AdminJoinRequestsPage } from './pages/admin/AdminJoinRequestsPage';
import { AdminTrustSafetyPage } from './pages/admin/AdminTrustSafetyPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminBlocksPage } from './pages/admin/AdminBlocksPage';
import { AdminDiaryPage } from './pages/admin/AdminDiaryPage';
import { AdminCmsHomepagePage } from './pages/admin/AdminCmsHomepagePage';
import { AdminDestinationsPage } from './pages/admin/AdminDestinationsPage';
import { AdminCmsPagesPage } from './pages/admin/AdminCmsPagesPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSystemHealthPage } from './pages/admin/AdminSystemHealthPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <TripsProvider>
              <DiaryProvider>
                <VaultProvider>
                  <DestinationsProvider>
                    <NotificationsProvider>
                      <AppRoutes />
                    </NotificationsProvider>
                  </DestinationsProvider>
                </VaultProvider>
              </DiaryProvider>
            </TripsProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* =========================================
        ADMIN CONTROL PANEL ROUTES
       ========================================= */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="users/:userId" element={<AdminUserDetailsPage />} />
      <Route path="trips" element={<AdminTripsPage />} />
      <Route path="trips/:tripId" element={<AdminTripDetailsPage />} />
      <Route path="join-requests" element={<AdminJoinRequestsPage />} />
      <Route path="trust-safety" element={<AdminTrustSafetyPage />} />
      <Route path="reviews" element={<AdminReviewsPage />} />
      <Route path="reports" element={<AdminReportsPage />} />
      <Route path="blocks" element={<AdminBlocksPage />} />
      <Route path="diary" element={<AdminDiaryPage />} />
      <Route path="cms/homepage" element={<AdminCmsHomepagePage />} />
      <Route path="cms/destinations" element={<AdminDestinationsPage />} />
      <Route path="cms/pages" element={<AdminCmsPagesPage />} />
      <Route path="media" element={<AdminMediaPage />} />
      <Route path="packages" element={<AdminPackagesPage />} />
      <Route path="notifications" element={<AdminNotificationsPage />} />
      <Route path="system/services" element={<AdminServicesPage />} />
      <Route path="settings" element={<AdminSettingsPage />} />
      <Route path="administrators" element={<AdminStaffPage />} />
      <Route path="roles" element={<AdminRolesPage />} />
      <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      <Route path="system/health" element={<AdminSystemHealthPage />} />
    </Route>

    {/* =========================================
        PUBLIC MARKETING ROUTES (PublicShell)
       ========================================= */}
    <Route element={<PublicShell />}>
      <Route path="/" element={<HomeEntry />} />
      <Route path="/app" element={<FeaturePageLayout />}>
        <Route index element={<Navigate to="/" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vault" element={<TravelVaultPage />} />
        <Route path="trips" element={<FindTripPage />} />
        <Route path="trips/my" element={<FindTripPage />} />
        <Route path="trips/create" element={<CreateTripPage />} />
        <Route path="trips/:tripId" element={<TripDetailsPage />} />
        <Route path="trips/:tripId/console" element={<TripLeaderConsolePage />} />
        <Route path="trips/:tripId/requests" element={<TripLeaderConsolePage />} />
        <Route path="diary" element={<TravelDiaryPage />} />
        <Route path="diary/add" element={<AddExperiencePage />} />
        <Route path="diary/create-story" element={<CreateStoryPage />} />
        <Route path="stories/create" element={<CreateStoryPage />} />
        <Route path="profile" element={<AccountSecurityPage initialTab="profile" />} />
        <Route path="profile/settings" element={<AccountSecurityPage initialTab="security" />} />
        <Route path="account-security" element={<AccountSecurityPage initialTab="security" />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/create" element={<CreateDestinationPage />} />
        <Route path="explore/:destinationSlug" element={<DestinationDetailPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/vault" element={<Navigate to="/app/vault" replace />} />
      <Route path="/diary" element={<Navigate to="/app/diary" replace />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/explore/create" element={<CreateDestinationPage />} />
      <Route path="/explore/:destinationSlug" element={<DestinationDetailPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/stories/create" element={<CreateStoryPage />} />
      <Route path="/stories/:storySlug" element={<StoryDetailPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/safety" element={<SafetyPage />} />
      <Route path="/community-rules" element={<CommunityRulesPage />} />
      <Route path="/vault-security" element={<VaultSecurityPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/trips" element={<FindTripPage />} />
      <Route path="/trips/create" element={<CreateTripPage />} />
      <Route path="/trips/:tripId" element={<TripDetailsPage />} />
      {/* 404 Catch-All Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* AUTH SPLIT ROUTES (Dedicated full-screen Auth layout) */}
    <Route path="/signup" element={<AuthPage initialMode="signup" />} />
    <Route path="/login" element={<AuthPage initialMode="login" />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  </Routes>
);
