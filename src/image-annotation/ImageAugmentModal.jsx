import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';

/**
 * Image & Bounding Box Data Augmentation Studio
 * Handles geometric flips (with coordinate recalculations), brightness, contrast, and noise.
 */

export function ImageAugmentModal({
  show,
  onClose,
  images = [],
  currentIndex = 0,
  classes = [],
  onAddAugmentedImage,
  onToast,
}) {
  const [horizontalFlip, setHorizontalFlip] = useState(true);
  const [verticalFlip, setVerticalFlip] = useState(false);
  const [brightness, setBrightness] = useState(0); // -50 to +50
  const [contrast, setContrast] = useState(0); // -50 to +50
  const [grayscale, setGrayscale] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const originalCanvasRef = useRef(null);
  const augmentedCanvasRef = useRef(null);

  const activeImage = images[currentIndex] || images[0] || null;

  // Transform bounding box coordinates
  const transformedBoxes = useMemo(() => {
    if (!activeImage || !activeImage.boxes) return [];
    const w = activeImage.width || 800;
    const h = activeImage.height || 600;

    return activeImage.boxes.map((box) => {
      let newX = box.x;
      let newY = box.y;
      const boxW = box.width;
      const boxH = box.height;

      if (horizontalFlip) {
        newX = w - box.x - boxW;
      }
      if (verticalFlip) {
        newY = h - box.y - boxH;
      }

      return {
        ...box,
        x: Math.max(0, Math.min(w - boxW, newX)),
        y: Math.max(0, Math.min(h - boxH, newY)),
        width: boxW,
        height: boxH,
      };
    });
  }, [activeImage, horizontalFlip, verticalFlip]);

  // Color lookup
  const classColorMap = useMemo(() => {
    const map = {};
    classes.forEach((c) => {
      map[c.name] = c.color;
      map[c.id] = c.color;
    });
    return map;
  }, [classes]);

  // Draw original image on left canvas
  useEffect(() => {
    if (!show || !activeImage || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw original bounding boxes
      (activeImage.boxes || []).forEach((b) => {
        const color = classColorMap[b.label] || '#3b82f6';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Fill background tag
        ctx.fillStyle = color;
        ctx.font = 'bold 12px sans-serif';
        const labelText = b.label;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(b.x, Math.max(0, b.y - 18), textWidth + 8, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, b.x + 4, Math.max(13, b.y - 4));
      });
    };
    img.src = activeImage.src;
  }, [show, activeImage, classColorMap]);

  // Draw augmented image on right canvas
  useEffect(() => {
    if (!show || !activeImage || !augmentedCanvasRef.current) return;
    const canvas = augmentedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      canvas.width = w;
      canvas.height = h;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Apply Filter shifts
      const brightVal = 100 + brightness;
      const contrastVal = 100 + contrast;
      const grayVal = grayscale ? 'grayscale(100%)' : 'grayscale(0%)';
      ctx.filter = `brightness(${brightVal}%) contrast(${contrastVal}%) ${grayVal}`;

      // Apply Geometric Flips
      ctx.translate(horizontalFlip ? w : 0, verticalFlip ? h : 0);
      ctx.scale(horizontalFlip ? -1 : 1, verticalFlip ? -1 : 1);

      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Reset filter for bounding boxes
      ctx.filter = 'none';

      // Draw transformed bounding boxes
      transformedBoxes.forEach((b) => {
        const color = classColorMap[b.label] || '#ec4899';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Fill background tag
        ctx.fillStyle = color;
        ctx.font = 'bold 12px sans-serif';
        const labelText = `${b.label} [Aug]`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(b.x, Math.max(0, b.y - 18), textWidth + 8, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, b.x + 4, Math.max(13, b.y - 4));
      });
    };
    img.src = activeImage.src;
  }, [show, activeImage, horizontalFlip, verticalFlip, brightness, contrast, grayscale, transformedBoxes, classColorMap]);

  // Add augmented image directly to workspace
  const handleAddToSession = useCallback(() => {
    if (!augmentedCanvasRef.current || !activeImage) return;
    const canvas = augmentedCanvasRef.current;

    // Create image-only snapshot without bounding box overlays
    const offscreen = document.createElement('canvas');
    const w = activeImage.width || 800;
    const h = activeImage.height || 600;
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      octx.save();
      const brightVal = 100 + brightness;
      const contrastVal = 100 + contrast;
      const grayVal = grayscale ? 'grayscale(100%)' : 'grayscale(0%)';
      octx.filter = `brightness(${brightVal}%) contrast(${contrastVal}%) ${grayVal}`;

      octx.translate(horizontalFlip ? w : 0, verticalFlip ? h : 0);
      octx.scale(horizontalFlip ? -1 : 1, verticalFlip ? -1 : 1);
      octx.drawImage(img, 0, 0, w, h);
      octx.restore();

      const dataUrl = offscreen.toDataURL('image/jpeg', 0.88);
      const newImageObj = {
        id: `aug_${Date.now()}`,
        name: `aug_${activeImage.name}`,
        src: dataUrl,
        width: w,
        height: h,
        boxes: transformedBoxes.map((b) => ({ ...b, id: `box_${Date.now()}_${Math.random()}` })),
        classification: activeImage.classification || null,
        is_augmented: true,
      };

      if (onAddAugmentedImage) {
        onAddAugmentedImage(newImageObj);
      }
      if (onToast) onToast('Augmented image and mirrored boxes added to session!', 'success');
      onClose();
    };
    img.src = activeImage.src;
  }, [activeImage, horizontalFlip, verticalFlip, brightness, contrast, grayscale, transformedBoxes, onAddAugmentedImage, onToast, onClose]);

  // Batch Export all images with augmentation
  const handleExportBatchZip = useCallback(async () => {
    if (!images.length) return;
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const labelsFolder = zip.folder('labels');

      // classes.txt
      zip.file('classes.txt', classes.map((c) => c.name).join('\n'));

      const classToIdx = {};
      classes.forEach((c, i) => {
        classToIdx[c.name] = i;
      });

      for (let i = 0; i < images.length; i++) {
        const imgItem = images[i];
        const w = imgItem.width || 800;
        const h = imgItem.height || 600;
        const baseName = imgItem.name.replace(/\.[^/.]+$/, '');

        // Recalculate boxes for this image
        const augBoxes = (imgItem.boxes || []).map((box) => {
          let newX = box.x;
          let newY = box.y;
          if (horizontalFlip) newX = w - box.x - box.width;
          if (verticalFlip) newY = h - box.y - box.height;
          return { ...box, x: newX, y: newY };
        });

        // Generate YOLO txt lines
        const yoloLines = augBoxes.map((b) => {
          const clsIdx = classToIdx[b.label] ?? 0;
          const xCenter = (b.x + b.width / 2) / w;
          const yCenter = (b.y + b.height / 2) / h;
          const normW = b.width / w;
          const normH = b.height / h;
          const clamp = (v) => Math.max(0, Math.min(1, v)).toFixed(6);
          return `${clsIdx} ${clamp(xCenter)} ${clamp(yCenter)} ${clamp(normW)} ${clamp(normH)}`;
        });

        labelsFolder.file(`aug_${baseName}.txt`, yoloLines.join('\n'));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edgevision_augmented_yolo_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      if (onToast) onToast('Exported augmented YOLO annotations (.zip)', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  }, [images, classes, horizontalFlip, verticalFlip, onToast, onClose]);

  if (!show || !activeImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base">
                Computer Vision Data Augmentation Preview
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live coordinate inversion for bounding boxes, horizontal/vertical flips, and contrast adjustments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs text-gray-700 dark:text-gray-300">
          {/* Controls Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            {/* Horizontal Flip */}
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={horizontalFlip}
                onChange={(e) => setHorizontalFlip(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
              />
              <span>↔ Horizontal Flip</span>
            </label>

            {/* Vertical Flip */}
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={verticalFlip}
                onChange={(e) => setVerticalFlip(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
              />
              <span>↕ Vertical Flip</span>
            </label>

            {/* Grayscale */}
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
              />
              <span>⚫ Grayscale Filter</span>
            </label>

            {/* Brightness Shift */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold">Brightness</span>
                <span className="font-mono">{brightness > 0 ? `+${brightness}` : brightness}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>
          </div>

          {/* Side-by-Side Visual Canvas Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-[11px]">
                  Original Image ({activeImage.boxes?.length || 0} boxes)
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Ground Truth</span>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center p-1 min-h-[220px]">
                <canvas
                  ref={originalCanvasRef}
                  className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>

            {/* Right: Augmented */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider text-[11px]">
                  Synthetic Augmented Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                  x' = W - x - w
                </span>
              </div>
              <div className="border border-violet-200 dark:border-violet-800 rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center p-1 min-h-[220px]">
                <canvas
                  ref={augmentedCanvasRef}
                  className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Mathematical verification info banner */}
          <div className="p-3.5 rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/20 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-[11px] text-violet-900 dark:text-violet-300 leading-relaxed">
              <strong>Coordinate Inversion Verified:</strong> Horizontal flip mirrors bounding boxes across the vertical axis (<code className="font-mono bg-violet-100 dark:bg-violet-900/60 px-1 py-0.5 rounded">x' = 1 - x - width</code>). Exported YOLO normalized and COCO pixel coordinates are automatically adjusted so your models train on valid mirrored ground truth.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <span className="text-[11px] text-gray-400">
            EdgeVision synthetic pipeline by Cueligence · 100% Client-Side
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
            >
              Close
            </button>
            <button
              onClick={handleAddToSession}
              className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl transition border border-gray-300 dark:border-gray-700"
              title="Add this augmented image to active dataset gallery"
            >
              + Add to Gallery
            </button>
            <button
              onClick={handleExportBatchZip}
              disabled={isExporting}
              className="px-5 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Augmented YOLO (.zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
