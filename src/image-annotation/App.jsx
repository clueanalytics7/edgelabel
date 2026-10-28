import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme, savedTheme } from '../shared/theme.js';
import { Toast } from '../shared/Toast.jsx';
import { SuiteSwitcher } from '../shared/SuiteSwitcher.jsx';
import { PWAInstallButton, OfflineIndicator } from '../shared/PWAInstallButton.jsx';
import { BoundingBoxCanvas } from './Canvas.jsx';
import { getSampleCvDataset } from './sampleData.js';
import { exportCocoJson, exportYoloZip, exportClassificationCsv } from './cvExporters.js';
import { ImageAugmentModal } from './ImageAugmentModal.jsx';
import { TaxonomyCodebookModal } from '../shared/TaxonomyCodebookModal.jsx';

const DEFAULT_CV_CLASSES = [
  { id: 'c1', name: 'Person', color: '#10b981' },
  { id: 'c2', name: 'Vehicle', color: '#3b82f6' },
  { id: 'c3', name: 'Sign', color: '#ef4444' },
  { id: 'c4', name: 'Product', color: '#f59e0b' },
  { id: 'c5', name: 'Animal', color: '#8b5cf6' },
  { id: 'c6', name: 'Object', color: '#06b6d4' },
];

export default function App() {
  const [theme, setTheme] = useState(savedTheme);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('detection'); // 'detection' | 'classification'
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classes, setClasses] = useState(DEFAULT_CV_CLASSES);
  const [activeClassId, setActiveClassId] = useState('c1');
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState('#ec4899');
  const [showAugmentModal, setShowAugmentModal] = useState(false);
  const [showCodebookModal, setShowCodebookModal] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useTheme(theme);

  // Load sample dataset on initial mount if empty
  useEffect(() => {
    const saved = localStorage.getItem('edgevision_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.images && parsed.images.length) {
          setImages(parsed.images);
          if (parsed.classes) setClasses(parsed.classes);
          return;
        }
      } catch {
        // Fallback to sample
      }
    }
    // Load default sample CV dataset
    const sample = getSampleCvDataset();
    setImages(sample);
  }, []);

  // Autosave session to localStorage
  useEffect(() => {
    if (!images.length) return;
    const toSave = {
      images: images.map((img) => ({
        ...img,
        // Only keep data URL if reasonable or sample
        src: img.src.length > 300000 ? '' : img.src,
      })),
      classes,
    };
    try {
      localStorage.setItem('edgevision_session', JSON.stringify(toSave));
    } catch {
      // Storage quota exceeded on large data URLs
    }
  }, [images, classes]);

  const activeImage = images[currentIndex] || null;
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0] || DEFAULT_CV_CLASSES[0];

  const handleUpdateBoxes = useCallback(
    (newBoxes) => {
      if (!activeImage) return;
      setImages((prev) =>
        prev.map((img, i) => (i === currentIndex ? { ...img, boxes: newBoxes } : img))
      );
    },
    [activeImage, currentIndex]
  );

  const handleSetClassification = useCallback(
    (label) => {
      if (!activeImage) return;
      setImages((prev) =>
        prev.map((img, i) => (i === currentIndex ? { ...img, classification: label } : img))
      );
      showToast(`Classified as: ${label}`, 'success');
      // Advance to next image automatically in classification mode
      if (currentIndex < images.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    },
    [activeImage, currentIndex, images.length, showToast]
  );

  // File Upload Handling
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = [];
    let loadedCount = 0;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgObj = new Image();
        imgObj.onload = () => {
          newImages.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            src: event.target.result,
            width: imgObj.naturalWidth,
            height: imgObj.naturalHeight,
            boxes: [],
            classification: null,
          });
          loadedCount++;
          if (loadedCount === files.length) {
            setImages((prev) => [...prev, ...newImages]);
            showToast(`Loaded ${newImages.length} image(s)!`, 'success');
          }
        };
        imgObj.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if input is focused
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight') {
        if (currentIndex < images.length - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else {
        // Numbers 1-9
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= classes.length) {
          const selected = classes[num - 1];
          if (mode === 'classification') {
            handleSetClassification(selected.name);
          } else {
            setActiveClassId(selected.id);
            showToast(`Active drawing class: ${selected.name}`, 'info');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, classes, mode, handleSetClassification, showToast]);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newCls = {
      id: `c_${Date.now()}`,
      name: newClassName.trim(),
      color: newClassColor,
    };
    setClasses((prev) => [...prev, newCls]);
    setActiveClassId(newCls.id);
    setNewClassName('');
    setShowAddClass(false);
    showToast(`Added class: ${newCls.name}`, 'success');
  };

  // Exporters
  const handleExportYolo = async () => {
    setIsExporting(true);
    try {
      await exportYoloZip(images, classes);
      showToast('Exported YOLO archive (.zip)!', 'success');
    } catch {
      showToast('Error exporting YOLO archive', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCoco = () => {
    try {
      exportCocoJson(images, classes);
      showToast('Exported COCO JSON annotations!', 'success');
    } catch {
      showToast('Error exporting COCO JSON', 'error');
    }
  };

  const handleExportCsv = () => {
    try {
      exportClassificationCsv(images);
      showToast('Exported Classification CSV!', 'success');
    } catch {
      showToast('Error exporting CSV', 'error');
    }
  };

  const totalBoxesCount = useMemo(() => {
    return images.reduce((sum, img) => sum + (img.boxes?.length || 0), 0);
  }, [images]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      <OfflineIndicator />
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & Product Switcher */}
          <div className="flex items-center gap-3">
            <a href="./index.html" className="flex items-center gap-2 font-bold text-base text-violet-400 hover:text-violet-300 transition-colors">
              <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>EdgeVision</span>
            </a>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60 font-semibold hidden md:inline">
              Image Annotation
            </span>

            {/* Suite Switcher */}
            <SuiteSwitcher activeProductId="edgevision" />
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setMode('detection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'detection'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Bounding Boxes
            </button>
            <button
              onClick={() => setMode('classification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'classification'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Rapid Classification
            </button>
          </div>

          {/* Quick Actions & Nav */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Images
            </button>

            <button
              onClick={() => setImages(getSampleCvDataset())}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700 transition-colors hidden sm:block"
            >
              Load Samples
            </button>

            <PWAInstallButton compact />

            {/* Theme Toggle */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-xl px-2.5 py-1.5 outline-none"
              aria-label="Theme"
            >
              <option value="system">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        {/* Top Control Bar */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          {/* Active Image Title & Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex <= 0}
                className="p-1 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
                title="Previous Image (←)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-mono px-2 text-gray-300">
                {images.length ? `${currentIndex + 1} / ${images.length}` : '0 / 0'}
              </span>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(images.length - 1, i + 1))}
                disabled={currentIndex >= images.length - 1}
                className="p-1 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors"
                title="Next Image (→)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {activeImage && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate max-w-[220px]">
                  {activeImage.name}
                </p>
                <p className="text-[11px] text-gray-500 font-mono">
                  {activeImage.width}×{activeImage.height} px •{' '}
                  <span className="text-violet-400 font-medium">
                    {activeImage.boxes?.length || 0} boxes
                  </span>
                  {activeImage.classification && (
                    <span className="ml-1 text-emerald-400 font-medium">
                      • {activeImage.classification}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Canvas View Controls */}
          {mode === 'detection' && (
            <div className="flex items-center gap-1.5 bg-gray-800/70 p-1 rounded-xl border border-gray-700">
              <button
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                className="px-2 py-1 text-xs text-gray-300 hover:text-white rounded hover:bg-gray-700"
                title="Zoom Out"
              >
                −
              </button>
              <span className="text-[11px] font-mono px-1 text-gray-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                className="px-2 py-1 text-xs text-gray-300 hover:text-white rounded hover:bg-gray-700"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700 border-l border-gray-700 ml-1"
                title="Reset Zoom"
              >
                100%
              </button>
              <button
                onClick={() => setShowLabels((prev) => !prev)}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  showLabels ? 'text-violet-400 font-semibold' : 'text-gray-500'
                }`}
                title="Toggle Label Tags"
              >
                Tags
              </button>
            </div>
          )}

          {/* Export Dropdown Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportYolo}
              disabled={isExporting || !images.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              title="Download YOLO format labels (.txt) and dataset.yaml in a zip file"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              YOLO (.zip)
            </button>
            <button
              onClick={handleExportCoco}
              disabled={!images.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              title="Download standard COCO annotations (.json)"
            >
              COCO (.json)
            </button>
            <button
              onClick={() => setShowAugmentModal(true)}
              disabled={!images.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              title="Data Augmentation: Bounding Box Flips, Brightness & Contrast Shifts"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Augment
            </button>
            <button
              onClick={handleExportCsv}
              disabled={!images.length}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              title="Download classifications (.csv)"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
          {/* Center Canvas Area */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {activeImage ? (
              mode === 'detection' ? (
                <BoundingBoxCanvas
                  image={activeImage}
                  classes={classes}
                  activeClass={activeClass}
                  boxes={activeImage.boxes || []}
                  onChangeBoxes={handleUpdateBoxes}
                  zoom={zoom}
                  showLabels={showLabels}
                  onToast={showToast}
                />
              ) : (
                /* Rapid Image Classification Mode */
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col items-center justify-center min-h-[460px] gap-6">
                  <div className="relative max-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                    <img
                      src={activeImage.src}
                      alt={activeImage.name}
                      className="max-h-[50vh] max-w-full object-contain"
                    />
                    {activeImage.classification && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg">
                        ✓ {activeImage.classification}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-2">
                      Press keys <strong className="text-gray-200">1–{Math.min(9, classes.length)}</strong> on your keyboard to classify &amp; advance:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {classes.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => handleSetClassification(c.name)}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 text-white flex items-center gap-2"
                          style={{ backgroundColor: c.color }}
                        >
                          <span>{c.name}</span>
                          <span className="opacity-60 text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-base font-bold text-gray-300 mb-1">No Images Loaded</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  Upload your image dataset or click below to load the built-in sample computer vision dataset.
                </p>
                <button
                  onClick={() => setImages(getSampleCvDataset())}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold"
                >
                  Load Sample Dataset
                </button>
              </div>
            )}

            {/* Instructions Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 bg-gray-900/60 px-4 py-2.5 rounded-xl border border-gray-800/80">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">Click &amp; Drag</kbd> Draw box
                <span className="text-gray-700">•</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">Del / Backspace</kbd> Delete box
                <span className="text-gray-700">•</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">1–9</kbd> Label
                <span className="text-gray-700">•</span>
                <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">← →</kbd> Next / Prev image
              </span>
              <span className="text-emerald-500 font-medium">
                Total {totalBoxesCount} bounding box annotations across {images.length} images
              </span>
            </div>
          </div>

          {/* Right Sidebar: Categories & Gallery */}
          <div className="flex flex-col gap-4">
            {/* Class Taxonomy Manager */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Classes ({classes.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCodebookModal(true)}
                    className="text-xs text-gray-400 hover:text-white font-medium"
                    title="Import or Export Taxonomy Codebook JSON"
                  >
                    📋 Codebook
                  </button>
                  <button
                    onClick={() => setShowAddClass(true)}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
                  >
                    + Add Class
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {classes.map((cls, idx) => {
                  const isActive = cls.id === activeClassId;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setActiveClassId(cls.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-violet-950/60 border border-violet-700/60 text-white shadow-xs'
                          : 'bg-gray-800/60 border border-transparent text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cls.color }}
                        />
                        <span className="truncate">{cls.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono opacity-50">{idx + 1}</span>
                        {classes.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClasses(classes.filter((c) => c.id !== cls.id));
                            }}
                            className="text-gray-500 hover:text-red-400 p-0.5 rounded"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showAddClass && (
                <div className="mt-3 p-3 bg-gray-800/80 rounded-xl border border-gray-700 flex flex-col gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white outline-none focus:border-violet-500"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newClassColor}
                      onChange={(e) => setNewClassColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <div className="flex-1 flex justify-end gap-1.5">
                      <button
                        onClick={() => setShowAddClass(false)}
                        className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddClass}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Image Gallery List */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 shadow-sm flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Images ({images.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  {images.filter((img) => (img.boxes?.length || 0) > 0 || img.classification).length} labeled
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[380px]">
                {images.map((img, idx) => {
                  const isCurrent = idx === currentIndex;
                  const boxCount = img.boxes?.length || 0;
                  return (
                    <div
                      key={img.id || idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                        isCurrent
                          ? 'bg-violet-950/50 border-violet-600 shadow-xs'
                          : 'bg-gray-800/40 border-gray-800 hover:border-gray-700 hover:bg-gray-800/80'
                      }`}
                    >
                      <img
                        src={img.src}
                        alt=""
                        className="w-12 h-9 object-cover rounded-md bg-gray-950 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-violet-300' : 'text-gray-300'}`}>
                          {img.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {boxCount > 0 ? (
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                              {boxCount} {boxCount === 1 ? 'box' : 'boxes'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">No boxes</span>
                          )}
                          {img.classification && (
                            <span className="text-[10px] text-violet-300 bg-violet-950/60 px-1.5 py-0.2 rounded">
                              {img.classification}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-900 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            © 2025{' '}
            <a href="https://clue-analytics.web.app/" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400">
              Cueligence
            </a>{' '}
            — EdgeVision Image Annotation
          </span>
          <div className="flex items-center gap-4">
            <a href="./annotation.html" className="hover:text-violet-400">EdgeLabel CSV</a>
            <a href="./translation.html" className="hover:text-violet-400">EdgeTranslate</a>
            <a href="./guide.html" className="hover:text-violet-400">User Guide</a>
            <a href="./privacy.html" className="hover:text-violet-400">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* Image Augmentation Studio Modal */}
      <ImageAugmentModal
        show={showAugmentModal}
        onClose={() => setShowAugmentModal(false)}
        images={images}
        currentIndex={currentIndex}
        classes={classes}
        onAddAugmentedImage={(newImg) => {
          setImages((prev) => [...prev, newImg]);
          setCurrentIndex(images.length);
        }}
        onToast={showToast}
      />

      {/* Taxonomy Codebook Modal */}
      <TaxonomyCodebookModal
        show={showCodebookModal}
        onClose={() => setShowCodebookModal(false)}
        taskType="image_annotation"
        currentLabels={classes}
        currentGuidelines="Draw accurate bounding boxes around target objects. Ensure boundaries align tightly with visible object edges."
        currentQualityRules={{ minLength: 0, maxLength: 0 }}
        projectName="EdgeVision Object Detection"
        onApplyTaxonomy={(imported) => {
          if (imported.labels && imported.labels.length) {
            setClasses(
              imported.labels.map((l, i) => ({
                id: l.id || `c_${i + 1}`,
                name: l.name,
                color: l.color || '#3b82f6',
              }))
            );
            setActiveClassId(imported.labels[0].id || 'c_1');
          }
        }}
        onToast={showToast}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
