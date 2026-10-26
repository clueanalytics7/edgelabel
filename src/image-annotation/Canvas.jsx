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
          className="max-w-none block rounded-lg pointer-events-none"
          style={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '68vh',
            objectFit: 'contain',
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

      {/* Selected Box Floating Info */}
      {selectedBox && (
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-md border border-gray-700 text-white px-3 py-2 rounded-xl text-xs flex items-center gap-3 shadow-lg z-20">
          <span className="font-semibold flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedBox.color }}
            />
            {selectedBox.label}
          </span>
          <span className="text-gray-400 font-mono">
            {Math.round(selectedBox.width)}×{Math.round(selectedBox.height)} px
          </span>
          <button
            onClick={() => {
              onChangeBoxes(boxes.filter((b) => b.id !== selectedBox.id));
              setSelectedBoxId(null);
            }}
            className="text-red-400 hover:text-red-300 ml-1 px-1.5 py-0.5 rounded hover:bg-red-950/50"
            title="Delete Box (Del)"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
