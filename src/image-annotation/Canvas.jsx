import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Interactive Computer Vision Bounding Box Canvas Overlay
 * Uses an SVG overlay over the scaled natural image.
 */
export function BoundingBoxCanvas({
  image,
  classes,
  activeClass,
  boxes,
  onChangeBoxes,
  zoom = 1,
  showLabels = true,
  onToast,
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [drawingBox, setDrawingBox] = useState(null);
  const [dragAction, setDragAction] = useState(null); // { type: 'move'|'resize', handle: string, startX, startY, origBox }
  const [imgDimensions, setImgDimensions] = useState({ width: 800, height: 600 });
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturate: 100, invert: false });
  const [showFilterBar, setShowFilterBar] = useState(false);

  const applyFilterPreset = (preset) => {
    if (preset === 'erythema') {
      setFilters({ brightness: 105, contrast: 135, saturate: 175, invert: false });
      if (onToast) onToast('Applied Erythema & Vascular Contrast Preset', 'info');
    } else if (preset === 'slough') {
      setFilters({ brightness: 115, contrast: 160, saturate: 110, invert: false });
      if (onToast) onToast('Applied Slough & Necrotic Tissue Depth Preset', 'info');
    } else if (preset === 'edges') {
      setFilters({ brightness: 100, contrast: 180, saturate: 80, invert: true });
      if (onToast) onToast('Applied Edge & Border Inversion Preset', 'info');
    } else {
      setFilters({ brightness: 100, contrast: 100, saturate: 100, invert: false });
      if (onToast) onToast('Reset clinical filters to normal', 'info');
    }
  };

  // On image load, read natural width/height
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setImgDimensions({ width: naturalWidth, height: naturalHeight });
    }
  };

  // Convert client pointer event coordinates to natural image coordinates
  const getImageCoords = useCallback(
    (e) => {
      if (!imgRef.current) return { x: 0, y: 0 };
      const rect = imgRef.current.getBoundingClientRect();
      const scaleX = imgDimensions.width / rect.width;
      const scaleY = imgDimensions.height / rect.height;

      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

      const x = Math.max(0, Math.min(imgDimensions.width, (clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(imgDimensions.height, (clientY - rect.top) * scaleY));

      return { x, y };
    },
    [imgDimensions]
  );

  // Start drawing new box or start drag
  const handleMouseDown = (e) => {
    // If clicked on resize handle or box body, handled by element handlers
    if (e.target.dataset.handle || e.target.dataset.box) return;

    // Clicked on background: start drawing a new bounding box
    const coords = getImageCoords(e);
    setDrawingBox({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });
    setSelectedBoxId(null);
  };

  const handleMouseMove = (e) => {
    const coords = getImageCoords(e);

    // Case 1: Currently drawing a new box
    if (drawingBox) {
      setDrawingBox((prev) => ({
        ...prev,
        currentX: coords.x,
        currentY: coords.y,
      }));
      return;
    }

    // Case 2: Moving an existing box
    if (dragAction?.type === 'move') {
      const dx = coords.x - dragAction.startX;
      const dy = coords.y - dragAction.startY;
      const orig = dragAction.origBox;

      const newX = Math.max(0, Math.min(imgDimensions.width - orig.width, orig.x + dx));
      const newY = Math.max(0, Math.min(imgDimensions.height - orig.height, orig.y + dy));

      onChangeBoxes(
        boxes.map((b) => (b.id === orig.id ? { ...b, x: newX, y: newY } : b))
      );
      return;
    }

    // Case 3: Resizing an existing box
    if (dragAction?.type === 'resize') {
      const orig = dragAction.origBox;
      const handle = dragAction.handle;
      let { x, y, width, height } = orig;

      if (handle.includes('e')) {
        width = Math.max(10, coords.x - x);
      }
      if (handle.includes('s')) {
        height = Math.max(10, coords.y - y);
      }
      if (handle.includes('w')) {
        const right = x + width;
        const newX = Math.min(coords.x, right - 10);
        x = Math.max(0, newX);
        width = right - x;
      }
      if (handle.includes('n')) {
        const bottom = y + height;
        const newY = Math.min(coords.y, bottom - 10);
        y = Math.max(0, newY);
        height = bottom - y;
      }

      onChangeBoxes(
        boxes.map((b) => (b.id === orig.id ? { ...b, x, y, width, height } : b))
      );
    }
  };

  const handleMouseUp = () => {
    // Finalize drawing box
    if (drawingBox) {
      const x1 = Math.min(drawingBox.startX, drawingBox.currentX);
      const y1 = Math.min(drawingBox.startY, drawingBox.currentY);
      const x2 = Math.max(drawingBox.startX, drawingBox.currentX);
      const y2 = Math.max(drawingBox.startY, drawingBox.currentY);
      const width = x2 - x1;
      const height = y2 - y1;

      // Only save if box has a minimum size of 12x12
      if (width >= 12 && height >= 12) {
        const newBox = {
          id: `box_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          label: activeClass.name,
          color: activeClass.color,
          x: Math.round(x1),
          y: Math.round(y1),
          width: Math.round(width),
          height: Math.round(height),
        };
        onChangeBoxes([...boxes, newBox]);
        setSelectedBoxId(newBox.id);
        if (onToast) onToast(`Created box: ${newBox.label}`, 'info');
      }
      setDrawingBox(null);
    }

    if (dragAction) {
      setDragAction(null);
    }
  };

  // Keyboard controls for box management
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedBoxId) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onChangeBoxes(boxes.filter((b) => b.id !== selectedBoxId));
        setSelectedBoxId(null);
        if (onToast) onToast('Deleted bounding box', 'info');
      } else if (e.key === 'Escape') {
        setSelectedBoxId(null);
      } else {
        // Numbers 1-9 to re-classify selected box
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= classes.length) {
          const targetClass = classes[num - 1];
          onChangeBoxes(
            boxes.map((b) =>
              b.id === selectedBoxId
                ? { ...b, label: targetClass.name, color: targetClass.color }
                : b
            )
          );
          if (onToast) onToast(`Labeled as ${targetClass.name}`, 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, boxes, classes, onChangeBoxes, onToast]);

  const selectedBox = boxes.find((b) => b.id === selectedBoxId);

  return (
    <div
      ref={containerRef}
      className="relative select-none flex items-center justify-center p-4 min-h-[460px] max-h-[75vh] overflow-auto bg-gray-900/90 rounded-2xl border border-gray-800"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative inline-block transition-transform duration-100 ease-out shadow-2xl"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* Underlay Image */}
        <img
          ref={imgRef}
          src={image.src}
          alt={image.name}
          onLoad={handleImageLoad}
          className="max-w-none block rounded-lg pointer-events-none transition-[filter] duration-150"
          style={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '68vh',
            objectFit: 'contain',
            filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) ${filters.invert ? 'invert(100%)' : ''}`,
          }}
          draggable={false}
        />

        {/* SVG Bounding Boxes Overlay */}
        <svg
          className="absolute inset-0 w-full h-full cursor-crosshair overflow-visible"
          viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
        >
          {/* Render Saved Boxes */}
          {boxes.map((b) => {
            const isSelected = b.id === selectedBoxId;
            const strokeColor = b.color || '#3b82f6';

            return (
              <g key={b.id} className="group">
                {/* Box Rectangle */}
                <rect
                  data-box={b.id}
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={strokeColor}
                  fillOpacity={isSelected ? '0.25' : '0.12'}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '3' : '2'}
                  strokeDasharray={isSelected ? '6 3' : 'none'}
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedBoxId(b.id);
                    const coords = getImageCoords(e);
                    setDragAction({
                      type: 'move',
                      startX: coords.x,
                      startY: coords.y,
                      origBox: { ...b },
                    });
                  }}
                />

                {/* Label Pill */}
                {showLabels && (
                  <g
                    transform={`translate(${b.x}, ${Math.max(16, b.y - 6)})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBoxId(b.id);
                    }}
                  >
                    <rect
                      x="0"
                      y="-16"
                      width={b.label.length * 8 + 36}
                      height="20"
                      rx="4"
                      fill={strokeColor}
                    />
                    <text
                      x="6"
                      y="-3"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {b.label}
                    </text>
                    {/* Delete cross inside label */}
                    <text
                      x={b.label.length * 8 + 20}
                      y="-3"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      className="hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeBoxes(boxes.filter((item) => item.id !== b.id));
                      }}
                    >
                      ×
                    </text>
                  </g>
                )}

                {/* Resize Handles (shown when selected) */}
                {isSelected && (
                  <>
                    {[
                      { handle: 'nw', cx: b.x, cy: b.y, cursor: 'nwse-resize' },
                      { handle: 'ne', cx: b.x + b.width, cy: b.y, cursor: 'nesw-resize' },
                      { handle: 'se', cx: b.x + b.width, cy: b.y + b.height, cursor: 'nwse-resize' },
                      { handle: 'sw', cx: b.x, cy: b.y + b.height, cursor: 'nesw-resize' },
                    ].map((h) => (
                      <circle
                        key={h.handle}
                        data-handle={h.handle}
                        cx={h.cx}
                        cy={h.cy}
                        r="6"
                        fill="#ffffff"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        style={{ cursor: h.cursor }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const coords = getImageCoords(e);
                          setDragAction({
                            type: 'resize',
                            handle: h.handle,
                            startX: coords.x,
                            startY: coords.y,
                            origBox: { ...b },
                          });
                        }}
                      />
                    ))}
                  </>
                )}
              </g>
            );
          })}

          {/* Currently Drawing Box Preview */}
          {drawingBox && (
            <rect
              x={Math.min(drawingBox.startX, drawingBox.currentX)}
              y={Math.min(drawingBox.startY, drawingBox.currentY)}
              width={Math.abs(drawingBox.currentX - drawingBox.startX)}
              height={Math.abs(drawingBox.currentY - drawingBox.startY)}
              fill={activeClass.color}
              fillOpacity="0.2"
              stroke={activeClass.color}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}
        </svg>
      </div>

      {/* Clinical Wound & Tissue Inspection Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setShowFilterBar((p) => !p)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 ${
            showFilterBar
              ? 'bg-blue-600 text-white'
              : 'bg-gray-900/90 hover:bg-gray-800 text-gray-200 border border-gray-700'
          }`}
          title="Clinical contrast, saturation and edge inspection"
        >
          <span>🔬</span>
          <span>Wound &amp; Tissue Enhancer</span>
          <span className="text-[10px] opacity-70">{showFilterBar ? '▲' : '▼'}</span>
        </button>

        {showFilterBar && (
          <div className="bg-gray-950/95 backdrop-blur-md border border-gray-800 rounded-2xl p-3.5 shadow-2xl text-xs space-y-3 w-72 text-gray-200 animate-fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-800">
              <span className="font-bold text-[11px] uppercase tracking-wider text-blue-400">
                Clinical Presets
              </span>
              <button
                onClick={() => applyFilterPreset('default')}
                className="text-[10px] text-gray-400 hover:text-white underline"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => applyFilterPreset('erythema')}
                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 text-left transition font-semibold"
                title="Boost saturation to identify erythematous flare and cellulitis borders"
              >
                🔴 Erythema Focus
              </button>
              <button
                onClick={() => applyFilterPreset('slough')}
                className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-800/40 text-left transition font-semibold"
                title="Enhance contrast between devitalized slough and viable granulation tissue"
              >
                🟡 Slough Contrast
              </button>
              <button
                onClick={() => applyFilterPreset('edges')}
                className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 text-left transition font-semibold"
                title="Invert channels to assess advancing epithelial edge migration"
              >
                🟣 Edge Inversion
              </button>
              <button
                onClick={() => applyFilterPreset('default')}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-left transition"
              >
                ⚪ Standard View
              </button>
            </div>

            {/* Manual Sliders */}
            <div className="space-y-2 pt-1 border-t border-gray-800 text-[10px]">
              <div className="space-y-0.5">
                <div className="flex justify-between text-gray-400">
                  <span>Contrast</span>
                  <span>{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  value={filters.contrast}
                  onChange={(e) => setFilters((p) => ({ ...p, contrast: Number(e.target.value) }))}
                  className="w-full accent-blue-500 h-1 bg-gray-850 rounded"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-gray-400">
                  <span>Saturation (Erythema)</span>
                  <span>{filters.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250"
                  value={filters.saturate}
                  onChange={(e) => setFilters((p) => ({ ...p, saturate: Number(e.target.value) }))}
                  className="w-full accent-blue-500 h-1 bg-gray-850 rounded"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-gray-400">
                  <span>Brightness</span>
                  <span>{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) => setFilters((p) => ({ ...p, brightness: Number(e.target.value) }))}
                  className="w-full accent-blue-500 h-1 bg-gray-850 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Box Floating Info & Lesion Surface Metrics */}
      {selectedBox && (
        <div className="absolute top-4 right-4 bg-gray-950/95 backdrop-blur-md border border-gray-700 text-white px-3.5 py-2.5 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-xl z-20">
          <span className="font-bold flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedBox.color }}
            />
            {selectedBox.label}
          </span>

          <div className="flex items-center gap-2 text-gray-300 font-mono text-[11px] border-l border-gray-700 pl-2">
            <span>{Math.round(selectedBox.width)}×{Math.round(selectedBox.height)} px</span>
            <span className="text-gray-500">·</span>
            <span className="text-blue-400">
              {Math.round(selectedBox.width * selectedBox.height).toLocaleString()} px²
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-emerald-400 font-semibold" title="Percentage of image surface covered by lesion box">
              {(((selectedBox.width * selectedBox.height) / (imgDimensions.width * imgDimensions.height)) * 100).toFixed(1)}% field
            </span>
          </div>

          <button
            onClick={() => {
              onChangeBoxes(boxes.filter((b) => b.id !== selectedBox.id));
              setSelectedBoxId(null);
            }}
            className="text-red-400 hover:text-red-300 px-2 py-0.5 rounded-md hover:bg-red-950/50 text-[11px] font-semibold border border-red-900/40 ml-auto"
            title="Delete Selected Box (Del)"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
