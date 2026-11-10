import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Private tools keep their own URLs and share the site's top navigation.
export const FeaturePageLayout: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  const isExpandedLayout =
    location.pathname.includes('/account-security') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/vault') ||
    location.pathname.includes('/diary');
  return (
    <div
      className={`bg-[radial-gradient(circle_at_top_left,_rgba(226,250,241,.72),_transparent_38%),linear-gradient(180deg,_#fbfffd_0%,_#f5fbf8_100%)] w-full ${
        isExpandedLayout
          ? 'h-full flex-1 min-h-0 py-1.5 sm:py-2.5 px-2 sm:px-4 lg:overflow-hidden overflow-y-auto flex flex-col'
          : 'min-h-[calc(100vh-5rem)] py-5 sm:py-7 lg:py-10'
      }`}
    >
      <div
        className={`w-full ${
          isExpandedLayout
            ? 'max-w-[1780px] 2xl:max-w-[1920px] px-1 sm:px-2 h-full flex-1 min-h-0 flex flex-col'
            : 'max-w-7xl 2xl:max-w-[1536px] px-4 sm:px-6 lg:px-8'
        } mx-auto`}
      >
        <Outlet />
      </div>
    </div>
  );
};
