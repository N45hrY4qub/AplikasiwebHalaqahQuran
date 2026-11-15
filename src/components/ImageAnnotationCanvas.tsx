import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Eraser, Minimize2, Maximize2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}
interface Stroke {
  points: Point[];
  color: string;
  brushSize: number;
  mode: 'draw' | 'erase';
  isLine?: boolean;
  isHighlighter?: boolean;
}

interface PageNotePin {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  text: string;
}

interface ImageAnnotationCanvasProps {
  imageSrc: string;
  pageNumber: number;
  readOnlyStrokes?: string;
  readOnlyPins?: string;
  readOnly?: boolean;
}

export const ImageAnnotationCanvas: React.FC<ImageAnnotationCanvasProps> = ({ 
  imageSrc, 
  pageNumber, 
  readOnlyStrokes, 
  readOnlyPins, 
  readOnly = false 
}) => {
  const { whiteboardCanvas, saveWhiteboardCanvas, whiteboardPins, saveWhiteboardPins } = useApp();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444'); // Default red pen
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState<'draw' | 'highlighter' | 'line' | 'pin-note' | 'erase' | 'none'>('none');
  const [isEnlarged, setIsEnlarged] = useState(false); // To scale the display larger

  // For sticky annotation pins
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [pinInputText, setPinInputText] = useState('');

  // Sourced in real-time from AppContext or passed read-only parameters
  const canvasCache = React.useMemo(() => {
    try {
      const source = readOnly ? readOnlyStrokes : whiteboardCanvas;
      return source ? JSON.parse(source) : {};
    } catch {
      return {};
    }
  }, [whiteboardCanvas, readOnlyStrokes, readOnly]);

  const pinsCache = React.useMemo(() => {
    try {
      if (readOnly) {
        return readOnlyPins ? JSON.parse(readOnlyPins) : {};
      }
      return whiteboardPins && whiteboardPins.length > 0 ? whiteboardPins[0] || {} : {};
    } catch {
      return {};
    }
  }, [whiteboardPins, readOnlyPins, readOnly]);

  const cacheKey = `${imageSrc}_${pageNumber}`;
  const strokes = canvasCache[cacheKey] || [];
  const pins = pinsCache[cacheKey] || [];

  const setStrokes = (newStrokes: Stroke[] | ((prev: Stroke[]) => Stroke[])) => {
    const current = canvasCache[cacheKey] || [];
    const updated = typeof newStrokes === 'function' ? newStrokes(current) : newStrokes;
    const nextCache = {
      ...canvasCache,
      [cacheKey]: updated
    };
    saveWhiteboardCanvas(JSON.stringify(nextCache));
  };

  const setPins = (newPins: PageNotePin[] | ((prev: PageNotePin[]) => PageNotePin[])) => {
    const current = pinsCache[cacheKey] || [];
    const updated = typeof newPins === 'function' ? newPins(current) : newPins;
    const nextCache = {
      ...pinsCache,
      [cacheKey]: updated
    };
    saveWhiteboardPins([nextCache]); // Save inside single-item list
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokes.forEach(stroke => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (stroke.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.brushSize * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#facc15'; // Highlighter Yellow (Stabilo Kuning)
        ctx.lineWidth = stroke.brushSize * 3.5;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
      }

      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      stroke.points.forEach((point, pIdx) => {
        if (pIdx > 0) {
          ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
        }
      });
      ctx.stroke();
    });
    
    // Reset canvas alpha & composition to defaults
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };

  // Redraw when strokes or cache changes
  useEffect(() => {
    redrawCanvas();
  }, [canvasCache, cacheKey]);

  // Resize listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => {
      redrawCanvas();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [canvasCache, cacheKey, isEnlarged]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode === 'none' || mode === 'pin-note') return;
    e.preventDefault();
    
    const coord = getCoordinates(e);
    if (!coord) return;
    
    setIsDrawing(true);

    if (mode === 'line') {
      // Line drawing starts with starting point and ending point set to the starting position
      setStrokes(prev => [
        ...prev,
        {
          points: [coord, coord],
          color,
          brushSize,
          mode: 'draw',
          isLine: true
        }
      ]);
    } else if (mode === 'highlighter') {
      // Yellow Translucent Highlighter brush
      setStrokes(prev => [
        ...prev,
        {
          points: [coord],
          color: '#facc15',
          brushSize: 18,
          mode: 'draw',
          isHighlighter: true
        }
      ]);
    } else {
      // Free Brush Draw / Erase
      setStrokes(prev => [
        ...prev,
        {
          points: [coord],
          color: mode === 'erase' ? 'rgba(0,0,0,1)' : color,
          brushSize,
          mode: mode === 'erase' ? 'erase' : 'draw'
        }
      ]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === 'none' || mode === 'pin-note') return;
    e.preventDefault();
    
    const coord = getCoordinates(e);
    if (!coord) return;

    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedStrokes = [...prev];

      if (last.isLine) {
        // In line mode, we update the secondary point to create a straight line preview
        updatedStrokes[updatedStrokes.length - 1] = {
          ...last,
          points: [last.points[0], coord]
        };
      } else {
        // Otherwise append points continuously for free path
        const updatedPoints = [...last.points, coord];
        updatedStrokes[updatedStrokes.length - 1] = {
          ...last,
          points: updatedPoints
        };
      }
      return updatedStrokes;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coord = getCoordinates(e);
    if (!coord) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (mode === 'erase') {
      // 1. Check if user clicked near a saved comment PIN to delete it
      const percentageX = coord.x * 100;
      const percentageY = coord.y * 100;

      const pinIndex = pins.findIndex(p => {
        const dist = Math.sqrt(Math.pow(p.x - percentageX, 2) + Math.pow(p.y - percentageY, 2));
        return dist < 6.0; // Within 6% radius
      });

      if (pinIndex !== -1) {
        const pinToRemove = pins[pinIndex];
        setPins(prev => prev.filter(p => p.id !== pinToRemove.id));
        return;
      }

      // 2. Check closeness to strokes
      const distanceToSegment = (p: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}) => {
        const l2 = (b.x - a.x)**2 + (b.y - a.y)**2;
        if (l2 === 0) return Math.sqrt((p.x - a.x)**2 + (p.y - a.y)**2);
        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (a.x + t * (b.x - a.x)))**2 + (p.y - (a.y + t * (b.y - a.y)))**2);
      };

      const isCloseToStroke = (ptCoord: { x: number; y: number }, stroke: Stroke) => {
        if (stroke.points.length === 0) return false;
        
        // Convert input coordinates and stroke points to pixel space for reliable hit testing
        const pxCoord = { x: ptCoord.x * canvas.width, y: ptCoord.y * canvas.height };
        const pxPoints = stroke.points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height }));

        if (pxPoints.length === 1) {
          const dx = pxPoints[0].x - pxCoord.x;
          const dy = pxPoints[0].y - pxCoord.y;
          return Math.sqrt(dx * dx + dy * dy) < 25;
        }
        for (let i = 0; i < pxPoints.length - 1; i++) {
          const dist = distanceToSegment(pxCoord, pxPoints[i], pxPoints[i+1]);
          if (dist < 25) return true;
        }
        return false;
      };

      let closestStrokeIndex = -1;
      strokes.forEach((stroke, strokeIdx) => {
        if (isCloseToStroke(coord, stroke)) {
          closestStrokeIndex = strokeIdx;
        }
      });

      if (closestStrokeIndex !== -1) {
        setStrokes(prev => prev.filter((_, idx) => idx !== closestStrokeIndex));
      }
      return;
    }

    if (mode === 'pin-note') {
      const percentageX = coord.x * 100;
      const percentageY = coord.y * 100;

      setPendingPin({ x: percentageX, y: percentageY });
      setPinInputText('');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coord = getCoordinates(e);
    if (!coord) return;

    // 1. Check if user double-clicked near a saved comment PIN first to delete it
    const canvas = canvasRef.current;
    if (canvas) {
      const percentageX = coord.x * 100;
      const percentageY = coord.y * 100;

      const pinIndex = pins.findIndex(p => {
        const dist = Math.sqrt(Math.pow(p.x - percentageX, 2) + Math.pow(p.y - percentageY, 2));
        return dist < 4.0; // Within 4% radius
      });

      if (pinIndex !== -1) {
        const pinToRemove = pins[pinIndex];
        setPins(prev => prev.filter(p => p.id !== pinToRemove.id));
        alert('📌 Catatan pin berhasil dihapus!');
        return;
      }
    }

    // 2. Otherwise, check if user double-clicked near a free stroke / line highlight to delete it
    let closestStrokeIndex = -1;
    let minDistance = 35; // 35px radius distance threshold

    if (canvas) {
      const pxCoord = { x: coord.x * canvas.width, y: coord.y * canvas.height };
      strokes.forEach((stroke, strokeIdx) => {
        stroke.points.forEach(pt => {
          const pxPt = { x: pt.x * canvas.width, y: pt.y * canvas.height };
          const dist = Math.sqrt(Math.pow(pxPt.x - pxCoord.x, 2) + Math.pow(pxPt.y - pxCoord.y, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestStrokeIndex = strokeIdx;
          }
        });
      });
    }

    if (closestStrokeIndex !== -1) {
      setStrokes(prev => prev.filter((_, idx) => idx !== closestStrokeIndex));
    }
  };

  const [confirmClearAction, setConfirmClearAction] = useState<'strokes' | 'pins' | null>(null);

  const clearCanvas = () => {
    setConfirmClearAction('strokes');
  };

  const clearPins = () => {
    setConfirmClearAction('pins');
  };

  const executeClearAction = () => {
    if (confirmClearAction === 'strokes') {
      setStrokes([]);
    } else if (confirmClearAction === 'pins') {
      setPins([]);
    }
    setConfirmClearAction(null);
  };

  const undoLast = () => {
    setStrokes(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col space-y-3.5 w-full">
      {/* Visual Annotation Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-2.5 rounded-xl flex-wrap gap-2 animate-fade-in shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pencil Free Brush Draw */}
          <button
            type="button"
            onClick={() => setMode(prev => prev === 'draw' ? 'none' : 'draw')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              mode === 'draw' 
                ? 'bg-emerald-600 text-white shadow-md scale-102 ring-2 ring-emerald-300' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="Coret / gambar bebas pada halaman (Klik untuk aktif/nonaktif)"
          >
            <span>✏️ Coret Bebas {mode === 'draw' && '● (Aktif)'}</span>
          </button>

          {/* Highlighter brush */}
          <button
            type="button"
            onClick={() => setMode(prev => prev === 'highlighter' ? 'none' : 'highlighter')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              mode === 'highlighter' 
                ? 'bg-amber-500 text-white shadow-md scale-102 ring-2 ring-amber-300' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="Gunakan stabilo kuning transparan untuk menandai teks (Klik untuk aktif/nonaktif)"
          >
            <span>🖍️ Stabilo Kuning {mode === 'highlighter' && '● (Aktif)'}</span>
          </button>

          {/* Underline Straight Line */}
          <button
            type="button"
            onClick={() => setMode(prev => prev === 'line' ? 'none' : 'line')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              mode === 'line' 
                ? 'bg-blue-600 text-white shadow-md scale-102 ring-2 ring-blue-300' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="Tarik garis lurus mendatar untuk menggarisbawahi gambar (Klik untuk aktif/nonaktif)"
          >
            <span>📏 Garis {mode === 'line' && '● (Aktif)'}</span>
          </button>

          {/* Sticky Pin Notes */}
          <button
            type="button"
            onClick={() => setMode(prev => prev === 'pin-note' ? 'none' : 'pin-note')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              mode === 'pin-note' 
                ? 'bg-rose-600 text-white shadow-md scale-102 ring-2 ring-rose-300' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-905 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="Klik area gambar untuk meletakkan Pin Catatan (Klik untuk aktif/nonaktif)"
          >
            <span>📌 Tambah Catatan {mode === 'pin-note' && '● (Aktif)'}</span>
          </button>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setMode(prev => prev === 'erase' ? 'none' : 'erase')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              mode === 'erase' 
                ? 'bg-slate-700 text-white shadow-md scale-102 ring-2 ring-slate-400' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
            title="Klik pada garis atau pin catatan untuk menghapusnya (Klik untuk aktif/nonaktif)"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Penghapus {mode === 'erase' && '● (Aktif)'}</span>
          </button>
        </div>

        {/* Action Controls & Size togglers */}
        <div className="flex items-center gap-2">
          {/* Display size expander */}
          <button
            type="button"
            onClick={() => setIsEnlarged(!isEnlarged)}
            className="p-1.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-slate-830 transition flex items-center space-x-1 cursor-pointer"
            title="Besarkan halaman agar isinya dapat terbaca jelas"
          >
            {isEnlarged ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isEnlarged ? "Kecilkan Tampilan" : "🔍 PERBESAR TAMPILAN MODUL"}</span>
          </button>

          {/* Color palette for fine pen */}
          {mode === 'draw' && (
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {[
                { hex: '#ef4444', name: 'Merah' },
                { hex: '#10b981', name: 'Hijau' },
                { hex: '#3b82f6', name: 'Biru' }
              ].map(col => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setColor(col.hex)}
                  className={`w-4 h-4 rounded-full border transition cursor-pointer ${color === col.hex ? 'scale-110 ring-2 ring-indigo-400' : 'hover:scale-110 opacity-70'}`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          )}

          {/* Eraser and Undo controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={undoLast}
              disabled={strokes.length === 0}
              className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 dark:bg-slate-950 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-850 disabled:opacity-40 transition cursor-pointer"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              disabled={strokes.length === 0}
              className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-955/10 text-rose-600 border border-rose-200 dark:border-rose-900/30 hover:bg-rose-100 disabled:opacity-40 transition cursor-pointer"
              title="Hapus coretan pen"
            >
              Coretan []
            </button>
            <button
              type="button"
              onClick={clearPins}
              disabled={pins.length === 0}
              className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-955/10 text-red-600 border border-red-200 dark:border-red-900/30 hover:bg-red-100 disabled:opacity-40 transition cursor-pointer"
              title="Hapus pin catatan"
            >
              Catatan []
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Help tooltip tip */}
      {!readOnly && (
        <div className="text-[10px] text-slate-450 dark:text-slate-500 font-mono flex items-center space-x-1 px-1 bg-slate-50/50 dark:bg-slate-900/20 p-1.5 border border-dashed rounded-lg">
          <span>💡</span>
          <span><b>Tips:</b> Klik pada garis atau PIN catatan 📌 saat Penghapus aktif untuk langsung menghapusnya.</span>
        </div>
      )}

      {/* Immersive Responsive Render Area with Dynamic Height */}
      <div 
        className={`relative overflow-hidden rounded-2xl bg-slate-850 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 flex items-center justify-center select-none transition-all duration-300 w-full ${
          isEnlarged 
            ? 'h-[850px] min-h-[700px] max-h-[1100px] max-w-5xl mx-auto shadow-2xl' 
            : 'h-[500px] min-h-[400px] max-h-[650px] shadow-sm'
        }`}
      >
        {/* Inner Wrapper wrapping both image and drawing canvas to fit exactly */}
        <div 
          ref={containerRef}
          className="relative max-h-full max-w-full flex items-center justify-center shrink-0 h-auto w-auto"
        >
          {/* Module Image asset */}
          <img 
            src={imageSrc} 
            alt={`Halaman ${pageNumber}`} 
            className="max-h-[470px] sm:max-h-full max-w-full block select-none rounded-xl"
            style={{ maxHeight: isEnlarged ? '820px' : '470px' }}
            referrerPolicy="no-referrer"
            onLoad={redrawCanvas}
          />

          {/* Main Canvas Overlay with interactive triggers */}
          <canvas
            ref={canvasRef}
            onMouseDown={readOnly ? undefined : startDrawing}
            onMouseMove={readOnly ? undefined : draw}
            onMouseUp={readOnly ? undefined : stopDrawing}
            onMouseLeave={readOnly ? undefined : stopDrawing}
            onClick={readOnly ? undefined : handleCanvasClick}
            onDoubleClick={readOnly ? undefined : handleDoubleClick}
            onTouchStart={readOnly ? undefined : startDrawing}
            onTouchMove={readOnly ? undefined : draw}
            onTouchEnd={readOnly ? undefined : stopDrawing}
            className={`absolute inset-0 w-full h-full ${readOnly || mode === 'none' ? 'pointer-events-none bg-transparent' : 'pointer-events-auto touch-none bg-transparent'}`}
            style={{ cursor: readOnly ? 'default' : (mode === 'draw' || mode === 'highlighter' ? 'crosshair' : mode === 'line' ? 'cell' : mode === 'pin-note' ? 'copy' : mode === 'erase' ? 'pointer' : 'default') }}
          />

          {/* Contextual commentary tooltip pin points */}
          {pins.map(pin => (
            <div 
              key={pin.id}
              className="absolute group z-20 cursor-pointer"
              style={{ 
                left: `${pin.x}%`, 
                top: `${pin.y}%`, 
                transform: 'translate(-50%, -100%)' 
              }}
            >
              {/* Pulsating pin visual */}
              <div className="relative flex items-center justify-center w-7 h-7 bg-red-650 hover:bg-red-700 border-2 border-white text-white rounded-full font-bold text-xs shadow-lg transform hover:scale-125 active:scale-95 transition-all">
                📌
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-red-400 opacity-20" />
              </div>
              
              {/* Popover Hover tooltip display context */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white text-[11px] p-2.5 rounded-lg whitespace-normal shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-52 leading-relaxed font-sans z-30 font-semibold text-slate-100 italic">
                <div className="font-bold border-b border-white/10 pb-1 mb-1 text-[9px] font-mono tracking-wider uppercase text-rose-450 italic font-semibold">Catatan Pin:</div>
                <p className="font-medium text-slate-100 leading-normal not-italic">{pin.text}</p>
                {!readOnly && (
                  <p className="text-[8px] text-slate-400 mt-1.5 font-mono italic">(Aktifkan penghapus &amp; klik untuk menghapus)</p>
                )}
              </div>
            </div>
          ))}

          {/* Pending input popup drop editor context form */}
          {pendingPin && (
            <div className="absolute bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-3.5 rounded-xl shadow-2xl z-30 space-y-2 text-left top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider font-mono">📝 Pin Catatan Baru 📌</span>
                <button type="button" onClick={() => setPendingPin(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>
              <textarea
                value={pinInputText}
                onChange={(e) => setPinInputText(e.target.value)}
                placeholder="Contoh: Harap mematangkan kembali makhraj huruf hijaiyah Dzhal pada baris ini..."
                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-rose-400 placeholder-slate-400"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end space-x-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingPin(null)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-650 dark:text-slate-305 font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!pinInputText.trim()) return;
                    const newPin: PageNotePin = {
                      id: Date.now().toString(),
                      x: pendingPin.x,
                      y: pendingPin.y,
                      text: pinInputText.trim()
                    };
                    setPins(prev => [...prev, newPin]);
                    setPendingPin(null);
                    setPinInputText('');
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-xs"
                >
                  Simpan Pin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Note List Summary (Double productivity) */}
      {pins.length > 0 && (
        <div className="bg-rose-50/20 dark:bg-slate-950 p-3.5 rounded-xl border border-rose-200/50 dark:border-slate-850 animate-fade-in text-left">
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest font-mono block mb-2">📋 Daftar Pin Catatan Evaluasi ({pins.length}):</span>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 flex flex-col">
            {pins.map((pin, index) => (
              <div key={pin.id} className="text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-lg flex items-start justify-between">
                <p className="text-slate-700 dark:text-slate-300 font-semibold"><span className="text-rose-500 font-mono">Pin #{index + 1}:</span> {pin.text}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPins(prev => prev.filter(p => p.id !== pin.id));
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 ml-2"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Clear Coretan / PIN */}
      {confirmClearAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                <Eraser className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {confirmClearAction === 'strokes' ? 'Hapus Semua Coretan' : 'Hapus Semua PIN'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pembersihan anotasi halaman
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmClearAction === 'strokes'
                ? 'Apakah Anda yakin ingin menghapus seluruh garis coretan & highlight pada halaman ini?'
                : 'Apakah Anda yakin ingin menghapus seluruh PIN catatan evaluasi pada halaman ini?'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmClearAction(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeClearAction}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help helper for format Arabic Font Clean