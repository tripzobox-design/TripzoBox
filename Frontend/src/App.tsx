import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { TripsProvider } from './context/TripsContext';
import { DiaryProvider } from './context/DiaryContext';
import { VaultProvider } from './context/VaultContext';
import { DestinationsProvider } from './context/DestinationsContext';
import { NotificationsProvider } from './context/NotificationsContext';

// Layout Shells
import { PublicShell } from './layouts/PublicShell';
import { FeaturePageLayout } from './layouts/FeaturePageLayout';

// Pages
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
import { ScrollToTop } from './components/common/ScrollToTop';

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <TripsProvider>
            <DiaryProvider>
              <VaultProvider>
                <DestinationsProvider>
                  <NotificationsProvider><AppRoutes /></NotificationsProvider>
                </DestinationsProvider>
              </VaultProvider>
            </DiaryProvider>
          </TripsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

export const AppRoutes: React.FC = () => (
                  <Routes>
                    {/* PUBLIC MARKETING ROUTES (PublicShell) */}
                    <Route element={<PublicShell />}>
                      <Route path="/" element={<HomeEntry />} />
                      <Route path="/app" element={<FeaturePageLayout />}>
                        <Route index element={<Navigate to="/" replace />} />
                        <Route path="dashboard" element={<Navigate to="/" replace />} />
                        <Route path="vault" element={<TravelVaultPage />} />
                        <Route path="trips" element={<FindTripPage />} />
                        <Route path="trips/my" element={<FindTripPage />} />
                        <Route path="trips/create" element={<CreateTripPage />} />
                        <Route path="trips/:tripId" element={<TripDetailsPage />} />
                        <Route path="diary" element={<TravelDiaryPage />} />
                        <Route path="diary/add" element={<AddExperiencePage />} />
                        <Route path="diary/create-story" element={<CreateStoryPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="profile/settings" element={<ProfilePage settingsOnly />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="explore" element={<ExplorePage />} />
                        <Route path="explore/create" element={<CreateDestinationPage />} />
                        <Route path="explore/:destinationSlug" element={<DestinationDetailPage />} />
                      </Route>
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/explore/create" element={<CreateDestinationPage />} />
                      <Route path="/explore/:destinationSlug" element={<DestinationDetailPage />} />
                      <Route path="/stories" element={<StoriesPage />} />
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
                      <Route path="/trips/:tripId" element={<TripDetailsPage />} />
                    </Route>

                    {/* AUTH SPLIT ROUTES (Dedicated full-screen Auth layout) */}
                    <Route path="/signup" element={<AuthPage initialMode="signup" />} />
                    <Route path="/login" element={<AuthPage initialMode="login" />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
);
