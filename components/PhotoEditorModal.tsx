'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, RotateCw, ZoomIn, ZoomOut, Move, Sun, Contrast, 
  RefreshCw, Upload, Sparkles
} from 'lucide-react';

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
}

export default function PhotoEditorModal({
  isOpen,
  onClose,
  imageSrc: initialImageSrc,
  onSave,
}: PhotoEditorModalProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialImageSrc);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [filterMode, setFilterMode] = useState<'normal' | 'enhance' | 'bw' | 'warm'>('normal');

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Canvas dimensions: standard 3x4 portrait ratio (300px width x 400px height)
  const CANVAS_WIDTH = 300;
  const CANVAS_HEIGHT = 400;

  // Function to draw onto canvas
  const renderToCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = imageElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply color filters
    let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (filterMode === 'bw') {
      filterString += ' grayscale(100%)';
    } else if (filterMode === 'enhance') {
      filterString += ` saturate(130%) contrast(${Math.max(contrast, 110)}%)`;
    } else if (filterMode === 'warm') {
      filterString += ' sepia(20%) saturate(115%)';
    }
    ctx.filter = filterString;

    ctx.save();

    // Center origin and transform
    ctx.translate(CANVAS_WIDTH / 2 + offsetX, CANVAS_HEIGHT / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate base fit (cover 300x400)
    const imgAspect = img.width / img.height;
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

    let drawWidth = CANVAS_WIDTH;
    let drawHeight = CANVAS_HEIGHT;

    if (imgAspect > canvasAspect) {
      drawHeight = CANVAS_HEIGHT;
      drawWidth = CANVAS_HEIGHT * imgAspect;
    } else {
      drawWidth = CANVAS_WIDTH;
      drawHeight = CANVAS_WIDTH / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  }, [brightness, contrast, filterMode, offsetX, offsetY, rotation, zoom]);

  // Load image object whenever currentImageSrc changes
  useEffect(() => {
    if (!currentImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      renderToCanvas();
    };
    img.src = currentImageSrc;
  }, [currentImageSrc, renderToCanvas]);

  // Re-render whenever visual adjustments change
  useEffect(() => {
    renderToCanvas();
  }, [renderToCanvas]);

  // Mouse Dragging handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offsetX,
        y: e.touches[0].clientY - offsetY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  // Handle uploading a replacement photo inside the editor
  const handleNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setCurrentImageSrc(res);
        setZoom(1);
        setRotation(0);
        setOffsetX(0);
        setOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset to initial settings
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setBrightness(100);
    setContrast(100);
    setFilterMode('normal');
  };

  // Preset quick adjustments
  const handlePresetPortrait = () => {
    setZoom(1.25);
    setOffsetY(15);
    setOffsetX(0);
  };

  // Save the cropped canvas image
  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    // Export high-quality image at standard 3:4 ratio
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">កែសម្រួលរូបថត 3x4 (Photo Editor)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Main Visual Workspace: 3x4 Viewport */}
          <div className="flex flex-col items-center">
            <div className="relative group select-none">
              {/* Official 3x4 Framing Box */}
              <div className="relative w-[210px] h-[280px] sm:w-[240px] sm:h-[320px] rounded-lg border-2 border-emerald-500 overflow-hidden shadow-md bg-slate-900 flex items-center justify-center cursor-move">
                <canvas
                  ref={previewCanvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                  className="w-full h-full object-contain"
                />

                {/* 3x4 Guide Lines Overlay (Rule of Thirds / Face alignment guide) */}
                <div className="absolute inset-0 pointer-events-none border border-emerald-400/40">
                  {/* Horizontal Guide 1 (Eye level) */}
                  <div className="absolute top-[35%] left-0 right-0 border-t border-dashed border-white/40" />
                  {/* Horizontal Guide 2 (Chin level) */}
                  <div className="absolute top-[65%] left-0 right-0 border-t border-dashed border-white/40" />
                  {/* Vertical Guide (Center) */}
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-white/40" />
                </div>

                {/* Ratio Badge */}
                <div className="absolute top-2 left-2 pointer-events-none bg-black/70 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  សមាមាត្រ 3x4
                </div>

                {/* Drag Hint on hover */}
                <div className="absolute bottom-2 inset-x-0 mx-auto w-fit pointer-events-none bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full opacity-80 group-hover:opacity-100 flex items-center gap-1">
                  <Move className="w-2.5 h-2.5 text-amber-300" />
                  <span>ចុចអូសដើម្បីរំកិលទីតាំងរូប</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Under Canvas */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="បង្វិល 90 ដឺក្រេ"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>បង្វិល 90°</span>
              </button>

              <button
                type="button"
                onClick={handlePresetPortrait}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="តម្រឹមក្បាល/ដើមទ្រូងស្ដង់ដារ"
              >
                <span>តម្រឹមរូប 3x4</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="ជ្រើសរើសរូបថតផ្សេងទៀត"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>ប្តូររូបថតថ្មី</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="កំណត់ដើមឡើងវិញ"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>កំណត់ដើម</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleNewFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Adjustments Sliders */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ពង្រីក / បង្រួម (Zoom):</span>
                </span>
                <span className="font-mono text-emerald-700">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                  className="p-1 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
                  className="p-1 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Brightness & Contrast */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-600" />
                    <span>កែពន្លឺ (Brightness):</span>
                  </span>
                  <span className="font-mono text-slate-600">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="160"
                  step="2"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Contrast className="w-3 h-3 text-indigo-600" />
                    <span>កម្រិតច្បាស់ (Contrast):</span>
                  </span>
                  <span className="font-mono text-slate-600">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="160"
                  step="2"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="pt-1 border-t border-slate-200">
              <span className="block text-[11px] font-semibold text-slate-700 mb-1.5">តម្រងរូបភាព:</span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('normal')}
                  className={`py-1 px-2 rounded border text-center transition-colors cursor-pointer ${
                    filterMode === 'normal'
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ធម្មតា
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('enhance')}
                  className={`py-1 px-2 rounded border text-center transition-colors cursor-pointer ${
                    filterMode === 'enhance'
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  បង្កើនពណ៌
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('warm')}
                  className={`py-1 px-2 rounded border text-center transition-colors cursor-pointer ${
                    filterMode === 'warm'
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ពន្លឺកក់ក្តៅ
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('bw')}
                  className={`py-1 px-2 rounded border text-center transition-colors cursor-pointer ${
                    filterMode === 'bw'
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ស-ខ្មៅ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            បោះបង់
          </button>
          
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>រក្សាទុកការកែរូប 3x4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
