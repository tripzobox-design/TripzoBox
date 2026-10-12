import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { TripsProvider } from './context/TripsContext';
import { DiaryProvider } from './context/DiaryContext';
import { VaultProvider } from './context/VaultContext';

// Layout Shells
import { PublicShell } from './layouts/PublicShell';
import { AppShell } from './layouts/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ExplorePage } from './pages/ExplorePage';
import { DestinationDetailPage } from './pages/DestinationDetailPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SafetyPage } from './pages/SafetyPage';
import { AboutPage } from './pages/AboutPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

import { DashboardPage } from './pages/DashboardPage';
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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <TripsProvider>
            <DiaryProvider>
              <VaultProvider>
                <Routes>
                  {/* PUBLIC MARKETING ROUTES (PublicShell) */}
                  <Route element={<PublicShell />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/explore/:destinationSlug" element={<DestinationDetailPage />} />
                    <Route path="/stories/:storySlug" element={<StoryDetailPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/safety" element={<SafetyPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                  </Route>

                  {/* AUTH SPLIT ROUTES (Dedicated full-screen Auth layout) */}
                  <Route path="/signup" element={<AuthPage initialMode="signup" />} />
                  <Route path="/login" element={<AuthPage initialMode="login" />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* LOGGED-IN WEB APP ROUTES (AppShell) */}
                  <Route path="/app" element={<AppShell />}>
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="vault" element={<TravelVaultPage />} />
                    <Route path="trips" element={<FindTripPage />} />
                    <Route path="trips/create" element={<CreateTripPage />} />
                    <Route path="trips/:tripId" element={<TripDetailsPage />} />
                    <Route path="trips/my" element={<FindTripPage />} />
                    <Route path="diary" element={<TravelDiaryPage />} />
                    <Route path="diary/add" element={<AddExperiencePage />} />
                    <Route path="diary/create-story" element={<CreateStoryPage />} />
                    <Route path="explore" element={<ExplorePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                  </Route>

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </VaultProvider>
            </DiaryProvider>
          </TripsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
