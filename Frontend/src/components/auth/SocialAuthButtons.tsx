import React from 'react';

export interface SocialAuthButtonsProps {
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
  isLoading?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onGoogleClick,
  onAppleClick,
  isLoading = false,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 sm:gap-2.5">
      {/* Google Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={onGoogleClick}
        className="w-full h-9 sm:h-12 flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-all shadow-2xs hover:border-gray-300 disabled:opacity-60 cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Apple Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={onAppleClick}
        className="w-full h-9 sm:h-12 flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-4 rounded-xl border border-gray-200 bg-white text-gray-800 font-medium text-xs sm:text-sm hover:bg-gray-50 active:bg-gray-100 transition-all shadow-2xs hover:border-gray-300 disabled:opacity-60 cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0 fill-current text-gray-900" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-6.3-9.77-11.1-20.73-14.42-32.89-3.32-12.16-4.98-23.77-4.98-34.82 0-14.78 3.8-27.18 11.41-37.19 7.6-10.02 17.1-15.08 28.5-15.2 5.01 0 10.33 1.25 15.96 3.75 5.63 2.5 9.4 3.79 11.31 3.87 1.52 0 5.48-1.35 11.88-4.04 6.4-2.69 11.83-3.88 16.29-3.57 15.53 1.15 27.29 6.94 35.29 17.37-13.68 8.27-20.4 19.33-20.15 33.19.25 10.88 4.35 20.08 12.3 27.61 8.04 7.53 17.5 11.75 28.37 12.67-2.39 7.4-5.11 14.39-8.15 20.98zM119.22 33.09c0-7.39 2.66-14.42 7.99-21.09 5.33-6.67 11.96-10.87 19.89-12.6 1.09 7.82-.71 15.34-5.4 22.56-4.69 7.22-11.46 11.53-20.31 12.93-.33-.6-.72-1.19-1.17-1.8z" />
        </svg>
        <span>Continue with Apple</span>
      </button>
    </div>
  );
};

