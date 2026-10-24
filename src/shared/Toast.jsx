import { useEffect } from 'react';

/**
 * Toast — non-blocking notification, auto-dismisses after 3.5 s.
 * @param {{ message: string, type: 'success'|'error'|'warning'|'info', onClose: () => void }} props
 */
export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    warning: 'bg-yellow-500',
    info:    'bg-blue-600',
  };

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-[2000] flex items-center gap-3 px-5 py-3 rounded-lg text-white shadow-xl text-sm max-w-sm ${bg[type] ?? bg.info}`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-75 hover:opacity-100 text-lg leading-none" aria-label="Dismiss">✕</button>
    </div>
  );
}
