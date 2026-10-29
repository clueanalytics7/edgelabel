import { useMemo } from 'react';

export function ImageQaModal({
  show,
  onClose,
  images = [],
  classes = [],
  onSelectImage,
  onToast,
}) {
  const qaStats = useMemo(() => {
    if (!show || !images.length) return null;

    let totalBoxes = 0;
    const boxClassCounts = {};
    const boundaryViolations = [];
    const tinyBoxes = [];
    const unlabelledImages = [];

    images.forEach((img, imgIdx) => {
      const boxes = img.boxes || [];
      if (!boxes.length && !img.classification) {
        unlabelledImages.push({ imgIdx, name: img.name });
      }

      boxes.forEach((b) => {
        totalBoxes++;
        boxClassCounts[b.label] = (boxClassCounts[b.label] || 0) + 1;

        // Check boundary limits
        if (
          b.x < 0 ||
          b.y < 0 ||
          b.x + b.width > (img.width || 800) ||
          b.y + b.height > (img.height || 600)
        ) {
          boundaryViolations.push({ imgIdx, boxId: b.id, label: b.label, imgName: img.name });
        }

        // Check microscopic boxes
        if (b.width < 15 || b.height < 15) {
          tinyBoxes.push({ imgIdx, boxId: b.id, label: b.label, imgName: img.name, w: b.width, h: b.height });
        }
      });
    });

    // Score calculation
    let healthScore = 100;
    if (boundaryViolations.length > 0) healthScore -= 25;
    if (unlabelledImages.length > 0) healthScore -= 15;
    if (tinyBoxes.length > 0) healthScore -= 10;
    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      totalImages: images.length,
      annotatedImages: images.length - unlabelledImages.length,
      totalBoxes,
      boxClassCounts,
      boundaryViolations,
      tinyBoxes,
      unlabelledImages,
      healthScore,
    };
  }, [show, images]);

  if (!show || !qaStats) return null;

  const {
    totalImages,
    annotatedImages,
    totalBoxes,
    boxClassCounts,
    boundaryViolations,
    tinyBoxes,
    unlabelledImages,
    healthScore,
  } = qaStats;

  const handleDownloadImageQaReport = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let md = `# EdgeVision Computer Vision Dataset QA & Deterministic Integrity Report\n\n`;
    md += `**Audit Date:** ${dateStr}\n`;
    md += `**Total Image Assets:** ${totalImages}\n`;
    md += `**Annotated Images:** ${annotatedImages} (${((annotatedImages / (totalImages || 1)) * 100).toFixed(1)}%)\n`;
    md += `**Total Bounding Boxes:** ${totalBoxes}\n\n`;

    md += `> ### ⚠️ Scope of Verification & Objective Assessment Notice\n`;
    md += `> This report describes **only programmatic and structural bounding box checks**: boundary coordinate containment, minimum dimension thresholds, class distribution balance, and image annotation coverage.\n`;
    md += `> \n`;
    md += `> **Important Notice:** This report is an objective audit of structural bounding box integrity. **It must NOT be marketed or relied upon as a guarantee that annotations are clinically accurate, dermatologically correct, unbiased, or suitable for any particular machine learning architecture.**\n\n`;

    md += `## 1. Executive Summary\n\n`;
    md += `- **Structural Quality Score:** **${healthScore}/100**\n`;
    md += `- **Out-of-Bounds Coordinate Violations:** ${boundaryViolations.length}\n`;
    md += `- **Microscopic Boxes (<15px):** ${tinyBoxes.length}\n`;
    md += `- **Unlabelled Images:** ${unlabelledImages.length}\n\n`;

    md += `## 2. Class Distribution & Box Counts\n\n`;
    md += `| Class Label | Bounding Boxes | Percentage |\n|---|---|---|\n`;
    Object.entries(boxClassCounts).forEach(([lbl, count]) => {
      const pct = ((count / (totalBoxes || 1)) * 100).toFixed(1);
      md += `| ${lbl} | ${count} | ${pct}% |\n`;
    });
    md += `\n`;

    if (boundaryViolations.length > 0) {
      md += `## 3. Boundary Coordinate Violations\n\n`;
      boundaryViolations.forEach((v, i) => {
        md += `- **${i + 1}. Image ${v.imgName}:** Box "${v.label}" exceeds image pixel bounds.\n`;
      });
      md += `\n`;
    }

    md += `## 4. Privacy & Execution Model\n`;
    md += `All image coordinates, aspect ratios, and annotations were inspected 100% locally in browser memory. Zero image pixels were uploaded to any remote server or external cloud API.\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edgevision_qa_report_${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded Image Dataset QA Report (.md)', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-600/20 text-violet-400 text-lg">🛡️</span>
            <div>
              <h3 className="font-bold text-base text-white">Image Dataset Quality &amp; Boundary Audit</h3>
              <p className="text-xs text-gray-400">Deterministic check for clipping, class distribution, and microscopic bounding boxes.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        {/* Objective Scope Notice */}
        <div className="p-3.5 rounded-xl border border-blue-900/40 bg-blue-950/20 text-[11px] text-blue-200/90 leading-relaxed">
          <strong>⚠️ Scope Notice:</strong> This audit verifies programmatic coordinate bounds, minimum box thresholds, and class balance. It does NOT guarantee that labels are clinically true, dermatologically verified, or suitable for any specific model.
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-gray-850 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Health Score</span>
            <div className={`text-2xl font-black mt-1 ${healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {healthScore}/100
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-850 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Images</span>
            <div className="text-2xl font-black text-gray-200 mt-1">{totalImages}</div>
            <span className="text-[10px] text-gray-500">{annotatedImages} annotated</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-850 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Boxes</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{totalBoxes}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-850 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Clipping Errors</span>
            <div className={`text-2xl font-black mt-1 ${boundaryViolations.length ? 'text-rose-400' : 'text-emerald-400'}`}>
              {boundaryViolations.length}
            </div>
          </div>
        </div>

        {/* Class Distribution Breakdown */}
        {Object.keys(boxClassCounts).length > 0 && (
          <div className="p-4 rounded-xl bg-gray-850 border border-gray-800 space-y-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Bounding Box Class Balance
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(boxClassCounts).map(([label, count]) => {
                const pct = ((count / (totalBoxes || 1)) * 100).toFixed(1);
                return (
                  <div key={label} className="p-2 rounded-lg bg-gray-800/60 border border-gray-750 text-xs">
                    <div className="flex justify-between text-gray-300 font-semibold mb-1">
                      <span className="truncate">{label}</span>
                      <span className="font-mono text-gray-400">{count}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">{pct}% of boxes</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actionable Review Queue Links */}
        {unlabelledImages.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">⚠️ {unlabelledImages.length} Images Missing Annotations</span>
              <span className="text-[10px] text-gray-400">Click to jump &amp; label:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unlabelledImages.slice(0, 10).map((u) => (
                <button
                  key={u.imgIdx}
                  onClick={() => {
                    if (onSelectImage) onSelectImage(u.imgIdx);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded bg-gray-800 hover:bg-amber-900/40 text-gray-300 text-[11px] font-mono border border-gray-700"
                >
                  #{u.imgIdx + 1} {u.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-xs text-gray-500 font-mono">100% In-Browser Inspection</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImageQaReport}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <span>Export QA Report (.md)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
