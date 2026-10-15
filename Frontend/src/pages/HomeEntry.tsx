import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './LandingPage';

// Support bookmarks created while tools temporarily lived on the homepage.
export const HomeEntry: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tool = params.get('tool');
  if (tool) {
    params.delete('tool');
    const publicTool = tool === 'trips' || tool.startsWith('stories');
    return <Navigate to={`${publicTool ? '/' : '/app/'}${tool}${params.size ? `?${params}` : ''}`} replace />;
  }
  if (location.hash === '#explore') {
    const slug = params.get('destination');
    const create = params.get('addPlace') === '1';
    params.delete('destination');
    params.delete('addPlace');
    return <Navigate to={`/explore${create ? '/create' : slug ? `/${encodeURIComponent(slug)}` : ''}${params.size ? `?${params}` : ''}`} replace />;
  }
  return <LandingPage />;
};
