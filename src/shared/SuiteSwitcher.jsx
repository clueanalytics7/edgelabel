import { useState, useRef, useEffect } from 'react';

export const SUITE_PRODUCTS = [
  {
    id: 'edgelabel',
    name: 'EdgeLabel',
    badge: 'Active Tool',
    tagline: 'Privacy-first text & tabular CSV annotation',
    href: './annotation.html',
    icon: (
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#2563eb" />
        <path d="M8 10a2 2 0 0 1 2-2h6.586a2 2 0 0 1 1.414.586l5.828 5.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L10.586 17.4A2 2 0 0 1 10 16V10z" fill="white" />
        <circle cx="13" cy="13" r="1.5" fill="#2563eb" />
      </svg>
    ),
  },
  {
    id: 'edgevision',
    name: 'EdgeVision',
    badge: 'Computer Vision',
    tagline: 'Client-side bounding box & object detection labeling',
    href: './image-annotation.html',
    icon: (
      <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'edgetranslate',
    name: 'EdgeTranslate',
    badge: 'Translation',
    tagline: 'Row-by-row dataset translation & review',
    href: './translation.html',
    icon: (
      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    id: 'edgechart',
    name: 'EdgeChart',
    badge: 'Data Viz',
    tagline: 'In-browser visualization & exploratory data analysis',
    href: 'https://clue-analytics.web.app/',
    external: true,
    icon: (
      <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'clueanalytics',
    name: 'Clue Analytics',
    badge: 'Hub',
    tagline: 'Parent analytics platform & data intelligence hub',
    href: 'https://clue-analytics.web.app/',
    external: true,
    icon: (
      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export function SuiteSwitcher({ activeProductId = 'edgelabel' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const activeProduct = SUITE_PRODUCTS.find((p) => p.id === activeProductId) || SUITE_PRODUCTS[0];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-xs"
        aria-label="Clue Analytics Product Suite"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline">Suite</span>
        </span>
        <span className="text-gray-400 dark:text-gray-500">|</span>
        <span className="truncate max-w-[90px]">{activeProduct.name}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 p-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Clue Analytics Suite
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">100% Local</span>
          </div>

          <div className="space-y-1">
            {SUITE_PRODUCTS.map((prod) => {
              const isActive = prod.id === activeProductId;
              return (
                <a
                  key={prod.id}
                  href={prod.href}
                  target={prod.external ? '_blank' : '_self'}
                  rel={prod.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                    {prod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white">
                        {prod.name}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-medium">
                          Active
                        </span>
                      ) : prod.external ? (
                        <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                          ↗
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {prod.tagline}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 px-3 py-1 flex items-center justify-between text-[11px] text-gray-400">
            <span>Client-side Privacy Protected</span>
            <span className="text-emerald-500 font-medium">● Edge Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
