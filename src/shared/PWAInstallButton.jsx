import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from './usePWAInstall.js';

export function PWAInstallButton({ compact = false }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Edge / Android native flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-xs hover:from-blue-700 hover:to-indigo-700 transition ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="Install EdgeLabel as Desktop/Mobile PWA for full offline access"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
            compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
          }`}
          title="Install on iOS Home Screen"
        >
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0-12l4 4m-4-4L8 8m-4 8v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={(e) => e.target === e.currentTarget && setShowIOSGuide(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#2563eb"/><path d="M8 10a2 2 0 0 1 2-2h6.586a2 2 0 0 1 1.414.586l5.828 5.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L10.586 17.4A2 2 0 0 1 10 16V10z" fill="white"/><circle cx="13" cy="13" r="1.5" fill="#2563eb"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Install EdgeLabel on iOS</h3>
                  <p className="text-xs text-gray-500">Air-gapped offline data labeling</p>
                </div>
              </div>
              <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-2.5 my-4 bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Tap the <strong className="text-gray-900 dark:text-white">Share</strong> button in Safari's bottom toolbar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Scroll down and select <strong className="text-gray-900 dark:text-white">Add to Home Screen</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Launch from your home screen for full offline zero-telemetry use.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop / browser notice button if not yet triggered
  return (
    <button
      onClick={() => alert('To install EdgeLabel on desktop: click the install icon (computer with down arrow) in your browser address bar.')}
      className={`hidden md:flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
        compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      title="EdgeLabel can be installed for offline standalone use"
    >
      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>PWA Offline</span>
    </button>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-bounce">
      <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
      <span>Offline Air-Gapped Mode — 100% Client-Side Processing</span>
    </div>
  );
}
