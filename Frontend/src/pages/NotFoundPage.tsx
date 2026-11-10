import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, MapPin, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title="404 — Page Not Found"
        description="The page you were looking for could not be found on TripzoBox."
        noIndex={true}
      />

      <div className="max-w-xl w-full text-center space-y-6">
        {/* Visual Badge / Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Compass className="w-12 h-12 stroke-[1.8] animate-spin-slow" />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm">
            404
          </span>
        </div>

        {/* Heading & Copy */}
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight">
            Lost on the Trail?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            The destination or page you are looking for has taken another trail, been moved, or does not exist.
          </p>
        </div>

        {/* Suggested Helpful Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>

          <Link
            to="/explore"
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 text-xs font-bold transition shadow-2xs"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Explore Spots</span>
          </Link>

          <Link
            to="/trips"
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 text-xs font-bold transition shadow-2xs"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Find Trips</span>
          </Link>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to previous page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

