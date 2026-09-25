import React from 'react';
import { Dices, Move, RotateCcw } from 'lucide-react';
import type { CustomizableCategory } from '../../types/types';

interface CustomProductPreviewProps {
  category: CustomizableCategory;
  options: Record<string, string>;
  customImage?: string | null;
  imageTransforms?: {
    zoom: number;
    posX: number;
    posY: number;
    rotate: number;
  };
  onRandomize?: () => void;
  onReset?: () => void;
  onUpdateTransforms?: (newTransforms: { zoom: number; posX: number; posY: number; rotate: number }) => void;
}

export const CustomProductPreview: React.FC<CustomProductPreviewProps> = ({
  category,
  options,
  customImage,
  imageTransforms = { zoom: 100, posX: 0, posY: 0, rotate: 0 },
  onRandomize,
  onReset,
  onUpdateTransforms,
}) => {
  // Metal Color Helper
  const getMetalColor = (metalOpt: string) => {
    if (metalOpt?.includes('Negro')) return '#27272A';
    if (metalOpt?.includes('Bronce') || metalOpt?.includes('Dorado')) return '#D97706';
    if (metalOpt?.includes('Titanio')) return '#06B6D4';
    return '#E5E7EB'; // Silver / Default
  };

  const getMetalBorder = (metalOpt: string) => {
    if (metalOpt?.includes('Negro')) return '#000000';
    if (metalOpt?.includes('Bronce') || metalOpt?.includes('Dorado')) return '#78350F';
    return '#4B5563';
  };

  // Plush Body Color Helper
  const getPlushColor = (colorOpt: string) => {
    if (colorOpt?.includes('Violeta')) return '#7E22CE';
    if (colorOpt?.includes('Rosa')) return '#FF007F';
    if (colorOpt?.includes('Rojo')) return '#B91C1C';
    if (colorOpt?.includes('Verde')) return '#65A30D';
    return '#18181B'; // Negro Azabache default
  };

  // T-Shirt Color Helper
  const getTshirtColor = (colorOpt?: string) => {
    if (colorOpt?.includes('Blanco')) return '#FFFFFF';
    if (colorOpt?.includes('Violeta')) return '#7E22CE';
    if (colorOpt?.includes('Rosa')) return '#FF007F';
    if (colorOpt?.includes('Rojo')) return '#B91C1C';
    if (colorOpt?.includes('Gris')) return '#9CA3AF';
    return '#18181B'; // Negro Azabache default
  };

  // CSS transform string for custom image alignment
  const imageTransformStyle: React.CSSProperties = {
    transform: `translate(${imageTransforms.posX}px, ${imageTransforms.posY}px) scale(${imageTransforms.zoom / 100}) rotate(${imageTransforms.rotate}deg)`,
    transition: 'transform 0.1s ease-out',
  };

  const supportsRandomize = category === 'ARITOS' || category === 'COLLARES' || category === 'LLAVEROS / PELUCHES' || (category as any) === 'AROS' || (category as any) === 'PELUCHES';

  return (
    <div className="relative w-full aspect-square max-w-[260px] xs:max-w-[290px] sm:max-w-[360px] lg:max-w-[420px] mx-auto bg-gradient-to-b from-yellow-50 via-white to-pink-50 border-4 border-black shadow-brutal-lg rounded-xl overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 transition-all duration-300">
      
      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute top-3 left-3 bg-brand-yellow text-black border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-brutal-sm z-10">
        VISTA PREVIA EN VIVO
      </div>

      {/* TOP-RIGHT QUICK CONTROLS (RANDOMIZE & RESET) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {supportsRandomize && onRandomize && (
          <button
            type="button"
            onClick={onRandomize}
            className="bg-brand-yellow hover:bg-brand-pink text-black hover:text-white border-2 border-black p-1.5 sm:p-2 shadow-brutal-sm transition-all cursor-pointer flex items-center justify-center active:scale-95"
            title="Aleatorizar combinaciones 🎲"
          >
            <Dices className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="bg-white hover:bg-red-100 text-black border-2 border-black p-1.5 sm:p-2 shadow-brutal-sm transition-all cursor-pointer flex items-center justify-center active:scale-95"
            title="Reiniciar opciones por defecto 🔄"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      <div className="absolute bottom-3 right-3 bg-brand-yellow text-black border-2 border-black px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-brutal-md z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
        BUTTONCAT STUDIO
      </div>

      {/* ON-PREVIEW IMAGE ALIGNMENT OVERLAY CONTROLS */}
      {customImage && onUpdateTransforms && (
        <div className="absolute bottom-3 left-3 z-30 flex flex-col gap-1.5 bg-black/85 backdrop-blur-md text-white border-2 border-white p-2 shadow-brutal-md rounded-lg">
          <div className="flex items-center justify-between gap-2 border-b border-gray-600 pb-1">
            <span className="text-[10px] font-black uppercase text-brand-yellow flex items-center gap-1">
              <Move className="w-3 h-3" /> AJUSTAR IMAGEN
            </span>
            <button
              type="button"
              onClick={() => onUpdateTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 })}
              className="text-[9px] font-black bg-brand-pink text-white px-1.5 py-0.5 rounded border border-white hover:bg-yellow-400 hover:text-black transition-colors cursor-pointer uppercase flex items-center gap-0.5"
              title="Recentrar imagen al centro"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Recentrar
            </button>
          </div>

          {/* DIRECTIONAL ARROWS D-PAD */}
          <div className="flex items-center justify-between gap-2">
            <div className="grid grid-cols-3 gap-1 w-20">
              <div />
              <button
                type="button"
                onClick={() => onUpdateTransforms({ ...imageTransforms, posY: imageTransforms.posY - 10 })}
                className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center border border-black hover:bg-brand-yellow cursor-pointer active:scale-95 shadow-sm"
                title="Mover Arriba"
              >
                ↑
              </button>
              <div />
              <button
                type="button"
                onClick={() => onUpdateTransforms({ ...imageTransforms, posX: imageTransforms.posX - 10 })}
                className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center border border-black hover:bg-brand-yellow cursor-pointer active:scale-95 shadow-sm"
                title="Mover Izquierda"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onUpdateTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 })}
                className="w-6 h-6 bg-brand-yellow text-black font-black text-[10px] flex items-center justify-center border border-black hover:bg-white cursor-pointer active:scale-95 shadow-sm"
                title="Centrar"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => onUpdateTransforms({ ...imageTransforms, posX: imageTransforms.posX + 10 })}
                className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center border border-black hover:bg-brand-yellow cursor-pointer active:scale-95 shadow-sm"
                title="Mover Derecha"
              >
                →
              </button>
              <div />
              <button
                type="button"
                onClick={() => onUpdateTransforms({ ...imageTransforms, posY: imageTransforms.posY + 10 })}
                className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center border border-black hover:bg-brand-yellow cursor-pointer active:scale-95 shadow-sm"
                title="Mover Abajo"
              >
                ↓
              </button>
              <div />
            </div>

            {/* QUICK ZOOM AND ROTATE */}
            <div className="flex flex-col gap-1 text-[10px] font-black">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateTransforms({ ...imageTransforms, zoom: Math.max(30, imageTransforms.zoom - 15) })}
                  className="w-6 h-6 bg-white text-black font-black flex items-center justify-center border border-black hover:bg-brand-cyan cursor-pointer shadow-sm"
                  title="Alejar (Zoom Out)"
                >
                  -
                </button>
                <span className="w-9 text-center font-mono text-[10px]">{imageTransforms.zoom}%</span>
                <button
                  type="button"
                  onClick={() => onUpdateTransforms({ ...imageTransforms, zoom: Math.min(250, imageTransforms.zoom + 15) })}
                  className="w-6 h-6 bg-white text-black font-black flex items-center justify-center border border-black hover:bg-brand-cyan cursor-pointer shadow-sm"
                  title="Acercar (Zoom In)"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateTransforms({ ...imageTransforms, rotate: (imageTransforms.rotate - 15 + 360) % 360 })}
                  className="w-6 h-6 bg-white text-black font-black flex items-center justify-center border border-black hover:bg-brand-purple hover:text-white cursor-pointer shadow-sm"
                  title="Girar 15° Izquierda"
                >
                  ↺
                </button>
                <span className="w-9 text-center font-mono text-[10px]">{imageTransforms.rotate}°</span>
                <button
                  type="button"
                  onClick={() => onUpdateTransforms({ ...imageTransforms, rotate: (imageTransforms.rotate + 15) % 360 })}
                  className="w-6 h-6 bg-white text-black font-black flex items-center justify-center border border-black hover:bg-brand-purple hover:text-white cursor-pointer shadow-sm"
                  title="Girar 15° Derecha"
                >
                  ↻
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER COLLARES */}
      {category === 'COLLARES' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[280px]">
            {/* Neck silhouette */}
            <path
              d="M 90 20 C 90 100 210 100 210 20"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="40"
              strokeLinecap="round"
            />

            {/* Chain Type */}
            {options.cadena?.includes('Gargantilla') ? (
              <path
                d="M 90 80 Q 150 120 210 80"
                fill="none"
                stroke="#18181B"
                strokeWidth="14"
                strokeLinecap="round"
              />
            ) : options.cadena?.includes('Cuero') ? (
              <path
                d="M 80 50 Q 150 170 220 50"
                fill="none"
                stroke="#27272A"
                strokeWidth="7"
                strokeDasharray="4,2"
              />
            ) : options.cadena?.includes('Eslabón') ? (
              <path
                d="M 75 45 Q 150 180 225 45"
                fill="none"
                stroke={getMetalColor(options.metal)}
                strokeWidth="9"
                strokeDasharray="6,4"
              />
            ) : (
              // Fine Chain
              <path
                d="M 80 50 Q 150 170 220 50"
                fill="none"
                stroke={getMetalColor(options.metal)}
                strokeWidth="4"
              />
            )}

            {/* Main Pendant hanging at center (150, 155) */}
            <g transform="translate(150, 155)">
              <circle cx="0" cy="-18" r="5" fill="none" stroke={getMetalBorder(options.metal)} strokeWidth="3" />

              {options.dije?.includes('Gatito') && (
                <g>
                  <polygon points="0,-15 -20,-3" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <polygon points="0,-15 20,-3" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <rect x="-18" y="-12" width="36" height="30" rx="8" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <circle cx="-7" cy="-2" r="3.5" fill="#FFE600" stroke="#000" strokeWidth="1.5" />
                  <circle cx="7" cy="-2" r="3.5" fill="#FFE600" stroke="#000" strokeWidth="1.5" />
                  <polygon points="0,3 -3,7 3,7" fill="#FF007F" />
                </g>
              )}

              {options.dije?.includes('Cruz') && (
                <g>
                  <rect x="-6" y="-20" width="12" height="42" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <rect x="-18" y="-10" width="36" height="12" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <circle cx="0" cy="-4" r="4" fill="#FF007F" stroke="#000" strokeWidth="1.5" />
                </g>
              )}

              {options.dije?.includes('Corazón') && (
                <g>
                  <path
                    d="M 0 -5 C -15 -25 -30 0 0 20 C 30 0 15 -25 0 -5 Z"
                    fill="#FF007F"
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <path d="M -12 -5 L -20 -8 M 12 -5 L 20 -8 M 0 10 L 5 18" stroke="#000" strokeWidth="2.5" />
                </g>
              )}

              {options.dije?.includes('Ojo') && (
                <g>
                  <path
                    d="M -22 0 Q 0 -18 22 0 Q 0 18 -22 0 Z"
                    fill={getMetalColor(options.metal)}
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <circle cx="0" cy="0" r="7" fill="#00F0FF" stroke="#000" strokeWidth="2" />
                  <circle cx="0" cy="0" r="3" fill="#000" />
                </g>
              )}

              {options.dije?.includes('Luna') && (
                <g>
                  <path
                    d="M 8 -20 A 18 18 0 1 0 8 20 A 13 13 0 1 1 8 -20 Z"
                    fill={getMetalColor(options.metal)}
                    stroke="#000"
                    strokeWidth="3"
                  />
                  <circle cx="-5" cy="0" r="3" fill="#FF007F" />
                </g>
              )}

              {options.dije?.includes('Calavera') && (
                <g>
                  <circle cx="0" cy="-6" r="14" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <rect x="-7" y="5" width="14" height="10" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="3" />
                  <circle cx="-5" cy="-7" r="3.5" fill="#000" />
                  <circle cx="5" cy="-7" r="3.5" fill="#000" />
                  <path d="M -4 9 L -4 14 M 0 9 L 0 14 M 4 9 L 4 14" stroke="#000" strokeWidth="2" />
                </g>
              )}

              {/* Mini Extra Detail */}
              {options.detalle?.includes('Cascabel') && (
                <circle cx="16" cy="12" r="6" fill="#FFE600" stroke="#000" strokeWidth="2" />
              )}
              {options.detalle?.includes('Estrellita') && (
                <polygon points="16,8 18,14 24,14 19,18 21,24 16,20 11,24 13,18 8,14 14,14" fill="#00F0FF" stroke="#000" strokeWidth="1" />
              )}
            </g>
          </svg>
        </div>
      )}

      {/* RENDER ARITOS / AROS */}
      {(category === 'ARITOS' || (category as any) === 'AROS') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[280px]">
            <rect x="50" y="240" width="200" height="12" rx="4" fill="#18181B" stroke="#000" strokeWidth="2" />
            <line x1="150" y1="240" x2="150" y2="40" stroke="#18181B" strokeWidth="4" />
            <line x1="90" y1="50" x2="210" y2="50" stroke="#18181B" strokeWidth="4" />

            {/* Left Earring */}
            <g transform="translate(100, 50)">
              {options.anzuelo?.includes('Clip') ? (
                <rect x="-8" y="0" width="16" height="12" rx="3" fill="#FFE600" stroke="#000" strokeWidth="2" />
              ) : (
                <path d="M 0 0 C 0 -20 12 -20 12 -5 C 12 0 0 5 0 15" fill="none" stroke={getMetalColor(options.metal)} strokeWidth="3" />
              )}

              <g transform="translate(0, 35)">
                {options.dije?.includes('Gatito') && (
                  <g>
                    <polygon points="0,-12 -14,0 14,0" fill="#7E22CE" stroke="#000" strokeWidth="2.5" />
                    <rect x="-12" y="-4" width="24" height="24" rx="5" fill="#FFE600" stroke="#000" strokeWidth="2.5" />
                    <circle cx="-5" cy="5" r="3" fill="#000" />
                    <circle cx="5" cy="5" r="3" fill="#000" />
                  </g>
                )}
                {options.dije?.includes('Murciélago') && (
                  <g>
                    <path d="M 0 -5 C -15 -18 -25 0 0 12 C 25 0 15 -18 0 -5 Z" fill="#18181B" stroke="#000" strokeWidth="2.5" />
                    <circle cx="-4" cy="-2" r="2" fill="#FF007F" />
                    <circle cx="4" cy="-2" r="2" fill="#FF007F" />
                  </g>
                )}
                {options.dije?.includes('Corazón') && (
                  <g>
                    <path d="M 0 -5 C -12 -20 -24 0 0 18 C 24 0 12 -20 0 -5 Z" fill="#FF007F" stroke="#000" strokeWidth="2.5" />
                    <circle cx="0" cy="18" r="3" fill="#B91C1C" />
                  </g>
                )}
                {options.dije?.includes('Imperdible') && (
                  <g>
                    <rect x="-4" y="-10" width="8" height="30" rx="4" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="2" />
                    <circle cx="0" cy="15" r="6" fill="#FFF" stroke="#000" strokeWidth="2" />
                  </g>
                )}
                {options.dije?.includes('Telaraña') && (
                  <g>
                    <polygon points="0,-15 15,-5 10,12 -10,12 -15,-5" fill="none" stroke="#000" strokeWidth="2" />
                    <line x1="0" y1="-15" x2="0" y2="12" stroke="#000" strokeWidth="1.5" />
                    <line x1="-15" y1="-5" x2="15" y2="-5" stroke="#000" strokeWidth="1.5" />
                  </g>
                )}
              </g>
            </g>

            {/* Right Earring */}
            {!options.estilo?.includes('Individual') && (
              <g transform="translate(200, 50)">
                {options.anzuelo?.includes('Clip') ? (
                  <rect x="-8" y="0" width="16" height="12" rx="3" fill="#FFE600" stroke="#000" strokeWidth="2" />
                ) : (
                  <path d="M 0 0 C 0 -20 12 -20 12 -5 C 12 0 0 5 0 15" fill="none" stroke={getMetalColor(options.metal)} strokeWidth="3" />
                )}

                <g transform="translate(0, 35)">
                  {options.dije?.includes('Gatito') && (
                    <g>
                      <polygon points="0,-12 -14,0 14,0" fill="#7E22CE" stroke="#000" strokeWidth="2.5" />
                      <rect x="-12" y="-4" width="24" height="24" rx="5" fill="#FFE600" stroke="#000" strokeWidth="2.5" />
                      <circle cx="-5" cy="5" r="3" fill="#000" />
                      <circle cx="5" cy="5" r="3" fill="#000" />
                    </g>
                  )}
                  {options.dije?.includes('Murciélago') && (
                    <g>
                      <path d="M 0 -5 C -15 -18 -25 0 0 12 C 25 0 15 -18 0 -5 Z" fill="#18181B" stroke="#000" strokeWidth="2.5" />
                      <circle cx="-4" cy="-2" r="2" fill="#FF007F" />
                      <circle cx="4" cy="-2" r="2" fill="#FF007F" />
                    </g>
                  )}
                  {options.dije?.includes('Corazón') && (
                    <g>
                      <path d="M 0 -5 C -12 -20 -24 0 0 18 C 24 0 12 -20 0 -5 Z" fill="#FF007F" stroke="#000" strokeWidth="2.5" />
                      <circle cx="0" cy="18" r="3" fill="#B91C1C" />
                    </g>
                  )}
                  {options.dije?.includes('Imperdible') && (
                    <g>
                      <rect x="-4" y="-10" width="8" height="30" rx="4" fill={getMetalColor(options.metal)} stroke="#000" strokeWidth="2" />
                      <circle cx="0" cy="15" r="6" fill="#FFF" stroke="#000" strokeWidth="2" />
                    </g>
                  )}
                  {options.dije?.includes('Telaraña') && (
                    <g>
                      <polygon points="0,-15 15,-5 10,12 -10,12 -15,-5" fill="none" stroke="#000" strokeWidth="2" />
                      <line x1="0" y1="-15" x2="0" y2="12" stroke="#000" strokeWidth="1.5" />
                      <line x1="-15" y1="-5" x2="15" y2="-5" stroke="#000" strokeWidth="1.5" />
                    </g>
                  )}
                </g>
              </g>
            )}
          </svg>
        </div>
      )}

      {/* RENDER LLAVEROS / PELUCHES */}
      {(category === 'LLAVEROS / PELUCHES' || (category as any) === 'PELUCHES') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 -25 300 340" className="w-full h-full max-h-[290px]">
            {/* Keychain ring on top */}
            <circle cx="150" cy="25" r="14" fill="none" stroke="#D97706" strokeWidth="4" />
            <line x1="150" y1="39" x2="150" y2="60" stroke="#D97706" strokeWidth="4" />

            <g transform="translate(150, 145)">
              {/* Ears / Head Features */}
              {options.forma?.includes('Gato') && (
                <g>
                  <polygon points="-50,-50 -60,-90 -15,-60" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <polygon points="50,-50 60,-90 15,-60" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              )}
              {options.forma?.includes('Murciélago') && (
                <g>
                  <path d="M -40,-30 Q -110,-70 -90,10 Q -50,0 -40,-10 Z" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <path d="M 40,-30 Q 110,-70 90,10 Q 50,0 40,-10 Z" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              )}
              {options.forma?.includes('Conejito') && (
                <g>
                  <rect x="-45" y="-120" width="25" height="75" rx="12" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <rect x="20" y="-120" width="25" height="75" rx="12" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              )}

              {/* BODY SILHOUETTES & LIMBS */}
              {options.cuerpo?.includes('De Pie') ? (
                // Chibi Standing Body
                <g>
                  <rect x="-35" y="30" width="70" height="75" rx="20" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <rect x="-30" y="95" width="22" height="35" rx="10" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <rect x="8" y="95" width="22" height="35" rx="10" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <ellipse cx="-45" cy="55" rx="12" ry="25" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <ellipse cx="45" cy="55" rx="12" ry="25" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              ) : options.cuerpo?.includes('Vudú') ? (
                // Voodoo Elongated Body
                <g>
                  <path d="M -25 30 L -35 110 L 35 110 L 25 30 Z" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <circle cx="-15" cy="110" r="10" fill="#000" stroke="#FFF" strokeWidth="2" />
                  <circle cx="15" cy="110" r="10" fill="#000" stroke="#FFF" strokeWidth="2" />
                </g>
              ) : options.cuerpo?.includes('Fantasma') ? (
                // Floating Ghost Body
                <g>
                  <path d="M -45 30 C -50 90 -30 115 0 90 C 30 115 50 90 45 30 Z" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              ) : (
                // Seated Classic (Round belly + paws)
                <g>
                  <ellipse cx="0" cy="50" rx="52" ry="45" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <circle cx="-38" cy="75" r="16" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                  <circle cx="38" cy="75" r="16" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />
                </g>
              )}

              {/* Head Circle */}
              <circle cx="0" cy="0" r="55" fill={getPlushColor(options.color)} stroke="#000" strokeWidth="4" />

              {/* Stitches and Scars */}
              {options.costuras?.includes('Zigzag') && (
                <path d="M -30,-20 L -20,-10 L -10,-20 L 0,-10 M -25,-15 L -15,-25 M -5,-15 L 5,-25" stroke="#FFFFFF" strokeWidth="3" fill="none" />
              )}
              {options.costuras?.includes('Escocesa') && (
                <rect x="-40" y="25" width="28" height="22" fill="#DC2626" stroke="#000" strokeWidth="2.5" />
              )}
              {options.costuras?.includes('Magenta') && (
                <path d="M 15,-25 L 35,5 M 18,-15 L 28,-10 M 22,-5 L 32,0" stroke="#FF007F" strokeWidth="3.5" fill="none" />
              )}

              {/* Button Eyes */}
              <g>
                {options.ojos?.includes('Amarillos') ? (
                  <>
                    <circle cx="-22" cy="-10" r="11" fill="#FFE600" stroke="#000" strokeWidth="3" />
                    <line x1="-25" y1="-10" x2="-19" y2="-10" stroke="#000" strokeWidth="2.5" />
                    <circle cx="22" cy="-10" r="11" fill="#FFE600" stroke="#000" strokeWidth="3" />
                    <line x1="19" y1="-10" x2="25" y2="-10" stroke="#000" strokeWidth="2.5" />
                  </>
                ) : options.ojos?.includes('Cruz') ? (
                  <>
                    <circle cx="-22" cy="-10" r="11" fill="#18181B" stroke="#000" strokeWidth="3" />
                    <path d="M -26,-14 L -18,-6 M -26,-6 L -18,-14" stroke="#FFF" strokeWidth="2.5" />
                    <circle cx="22" cy="-10" r="11" fill="#18181B" stroke="#000" strokeWidth="3" />
                    <path d="M 18,-14 L 26,-6 M 18,-6 L 26,-14" stroke="#FFF" strokeWidth="2.5" />
                  </>
                ) : options.ojos?.includes('Desparejos') ? (
                  <>
                    <circle cx="-22" cy="-10" r="14" fill="#FF007F" stroke="#000" strokeWidth="3" />
                    <circle cx="22" cy="-10" r="8" fill="#00F0FF" stroke="#000" strokeWidth="3" />
                  </>
                ) : (
                  <>
                    <circle cx="-22" cy="-10" r="11" fill="#FF007F" stroke="#000" strokeWidth="3" />
                    <circle cx="22" cy="-10" r="11" fill="#FF007F" stroke="#000" strokeWidth="3" />
                  </>
                )}
              </g>

              {/* Nose & Mouth */}
              <polygon points="0,5 -5,12 5,12" fill="#FF007F" stroke="#000" strokeWidth="2" />
              <path d="M 0,12 L 0,22 M -8,20 C -4,26 0,22 0,22 C 0,22 4,26 8,20" stroke="#000" strokeWidth="3" fill="none" />

              {/* Accessories */}
              {options.accesorio?.includes('Picos') && (
                <g>
                  <rect x="-40" y="32" width="80" height="12" rx="4" fill="#000" />
                  <polygon points="-30,32 -25,24 -20,32" fill="#E5E7EB" />
                  <polygon points="-5,32 0,24 5,32" fill="#E5E7EB" />
                  <polygon points="20,32 25,24 30,32" fill="#E5E7EB" />
                </g>
              )}
              {options.accesorio?.includes('Parche') && (
                <g>
                  <rect x="-32" y="-20" width="20" height="20" rx="3" fill="#18181B" stroke="#000" strokeWidth="2" />
                  <line x1="-50" y1="-25" x2="0" y2="5" stroke="#000" strokeWidth="2" />
                </g>
              )}
              {options.accesorio?.includes('Corazón') && (
                <path d="M 0 45 C -8 35 -16 45 0 55 C 16 45 8 35 0 45 Z" fill="#FF007F" stroke="#000" strokeWidth="2" />
              )}
            </g>
          </svg>
        </div>
      )}

      {/* RENDER PINES */}
      {category === 'PINES' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div
            className={`relative rounded-full border-4 border-black drop-shadow-md overflow-hidden flex items-center justify-center transition-all duration-300 ${
              options.tamano?.includes('75mm')
                ? 'w-76 h-76 sm:w-80 sm:h-80 ring-4 ring-yellow-400'
                : options.tamano?.includes('55mm')
                ? 'w-64 h-64 sm:w-68 sm:h-68'
                : 'w-52 h-52 sm:w-56 sm:h-56'
            } ${
              options.acabado?.includes('Holográfico')
                ? 'bg-gradient-to-tr from-pink-400 via-purple-300 to-cyan-300'
                : options.acabado?.includes('Glitter')
                ? 'bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500'
                : options.acabado?.includes('Mate')
                ? 'bg-zinc-900 text-white'
                : 'bg-brand-yellow'
            }`}
          >
            {customImage ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative bg-white/10">
                <img
                  src={customImage}
                  alt="Custom Art"
                  style={imageTransformStyle}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-center p-3 z-10">
                <div className="font-black text-sm uppercase tracking-wider text-black bg-white px-3 py-1.5 border-2 border-black inline-block shadow-brutal-sm">
                  TU DISEÑO AQUÍ
                </div>
              </div>
            )}

            {/* Gloss / Matte Overlay */}
            {options.acabado?.includes('Brillante') && (
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
            )}
            {options.acabado?.includes('Holográfico') && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-300/40 via-pink-400/40 to-yellow-300/40 pointer-events-none mix-blend-overlay" />
            )}
          </div>
        </div>
      )}

      {/* RENDER STICKERS */}
      {category === 'STICKERS' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div
            className={`p-2 border-4 border-black bg-white drop-shadow-md flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
              options.tamano?.includes('12cm')
                ? 'w-76 h-76 sm:w-80 sm:h-80'
                : options.tamano?.includes('8cm')
                ? 'w-64 h-64 sm:w-68 sm:h-68'
                : 'w-52 h-52 sm:w-56 sm:h-56'
            } ${
              options.corte?.includes('Circular')
                ? 'rounded-full'
                : options.corte?.includes('Rectangular')
                ? 'rounded-lg'
                : 'rounded-3xl border-dashed' // Die-Cut
            } ${
              options.material?.includes('Holográfico')
                ? 'bg-gradient-to-r from-purple-200 via-cyan-200 to-pink-200'
                : options.material?.includes('Metalizado')
                ? 'bg-gradient-to-br from-gray-200 via-gray-400 to-gray-100'
                : 'bg-yellow-50'
            }`}
          >
            {customImage ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                <img
                  src={customImage}
                  alt="Custom Sticker Art"
                  style={imageTransformStyle}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-center p-3 z-10">
                <div className="font-black text-sm uppercase tracking-wider text-black bg-brand-yellow px-3 py-1.5 border-2 border-black inline-block shadow-brutal-sm">
                  TU STICKER AQUÍ
                </div>
              </div>
            )}

            {/* Sticker Laminate overlay */}
            {options.laminado?.includes('Glitter') && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-300/30 via-pink-400/30 to-purple-400/30 pointer-events-none mix-blend-color-dodge" />
            )}
          </div>
        </div>
      )}

      {/* RENDER REMERAS */}
      {category === 'REMERAS' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[280px]">
            {/* T-Shirt Silhouette Vector */}
            <g transform="translate(150, 140)">
              {/* Sleeves */}
              <path
                d="M -60 -90 L -125 -40 L -95 -5 L -60 -40 Z"
                fill={getTshirtColor(options.color)}
                stroke="#000000"
                strokeWidth="4"
              />
              <path
                d="M 60 -90 L 125 -40 L 95 -5 L 60 -40 Z"
                fill={getTshirtColor(options.color)}
                stroke="#000000"
                strokeWidth="4"
              />

              {/* Main Torso */}
              <path
                d="M -60 -90 L -30 -115 Q 0 -95 30 -115 L 60 -90 L 65 110 L -65 110 Z"
                fill={getTshirtColor(options.color)}
                stroke="#000000"
                strokeWidth="4"
              />

              {/* Neck Collar */}
              <path
                d="M -30 -115 Q 0 -85 30 -115 Q 0 -100 -30 -115 Z"
                fill={options.color?.includes('Blanco') ? '#E5E7EB' : '#18181B'}
                stroke="#000000"
                strokeWidth="3"
              />
              {options.ubicacion?.includes('Espalda') && (
                <path
                  d="M -30 -115 Q 0 -105 30 -115 Z"
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth="2"
                />
              )}
            </g>
          </svg>

          {/* PRINT CONTAINER OVERLAY */}
          <div
            className={`absolute border-2 border-dashed border-black/40 flex items-center justify-center overflow-hidden transition-all duration-300 ${
              options.ubicacion?.includes('Espalda') ? 'top-[22%]' : 'top-[26%]'
            } ${
              options.tamano_estampa?.includes('Pechera')
                ? 'w-16 h-16 left-[56%]'
                : options.tamano_estampa?.includes('A3')
                ? 'w-44 h-52 left-[28%]'
                : 'w-36 h-40 left-[31%]'
            }`}
          >
            {customImage ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                <img
                  src={customImage}
                  alt="T-Shirt Print Art"
                  style={imageTransformStyle}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-center p-1.5 bg-white/90 border border-black text-[9px] font-black uppercase shadow-brutal-sm text-black">
                TU ESTAMPA AQUÍ
              </div>
            )}
          </div>

          <div className="absolute bottom-1 bg-white border-2 border-black px-2.5 py-0.5 text-[10px] font-black uppercase text-black shadow-brutal-sm">
            VISTA: {options.ubicacion?.includes('Espalda') ? 'ESPALDA' : 'FRENTE (PECHO)'} • TALLE: {options.talle || 'M'}
          </div>
        </div>
      )}

      {/* RENDER POSTERS (WITH USER UPLOADED IMAGE OR DEFAULT ARTWORK) */}
      {category === 'POSTERS' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div
            className={`relative border-4 border-black bg-white shadow-brutal-xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
              options.tamano?.includes('A2')
                ? 'w-68 h-84'
                : options.tamano?.includes('A3')
                ? 'w-60 h-76'
                : 'w-50 h-64'
            } ${
              options.marco?.includes('Negro')
                ? 'ring-8 ring-black'
                : options.marco?.includes('Natural')
                ? 'ring-8 ring-amber-800'
                : ''
            }`}
          >
            {customImage ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative bg-white">
                <img
                  src={customImage}
                  alt="Poster Art"
                  style={imageTransformStyle}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-center p-4 z-10 space-y-2">
                <div className="text-4xl">🖼️</div>
                <div className="font-black text-xs uppercase tracking-wider text-black bg-brand-yellow px-3 py-1.5 border-2 border-black inline-block shadow-brutal-sm">
                  SUBE TU POSTER O ILUSTRACIÓN
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">
                  PAPEL {options.papel || 'MATTE 300G'}
                </div>
              </div>
            )}

            {/* Holographic paper effect */}
            {options.papel?.includes('Holográfico') && (
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-300/30 via-cyan-300/30 to-yellow-200/30 pointer-events-none mix-blend-overlay" />
            )}
          </div>
        </div>
      )}

      {/* RENDER PINTURAS (ART CANVAS WITH CUSTOM SPECS & BUDGET BADGE) */}
      {category === 'PINTURAS' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div
            className={`relative border-4 border-black bg-amber-50 shadow-brutal-xl overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-300 ${
              options.lienzo?.includes('70x100')
                ? 'w-72 h-84'
                : options.lienzo?.includes('50x70')
                ? 'w-60 h-76'
                : 'w-52 h-64'
            }`}
          >
            {customImage ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative bg-white">
                <img
                  src={customImage}
                  alt="Custom Canvas Art"
                  style={imageTransformStyle}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <>
                {/* Canvas Wooden Texture and Paint Strokes Vector */}
                <svg viewBox="0 0 200 240" className="w-full h-full absolute inset-0 opacity-80">
                  <rect x="0" y="0" width="200" height="240" fill="#FFFBEB" stroke="#000" strokeWidth="4" />
                  <path
                    d="M 20 40 Q 60 10 120 50 Q 180 90 140 160 Q 90 200 40 150 Z"
                    fill={options.estilo_pintura?.includes('Gothic') ? '#B91C1C' : options.estilo_pintura?.includes('Kawaii') ? '#FF007F' : '#00F0FF'}
                    opacity="0.6"
                  />
                  <circle cx="150" cy="60" r="25" fill="#FFE600" opacity="0.7" />
                  <path d="M 50 120 C 80 80 140 180 170 120" fill="none" stroke="#18181B" strokeWidth="8" strokeLinecap="round" />
                  <text x="110" y="225" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#000">Buttoncat Studio</text>
                </svg>

                <div className="relative z-10 text-center space-y-2 bg-white/90 border-2 border-black p-3 shadow-brutal-sm">
                  <div className="bg-brand-pink text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black inline-block shadow-brutal-sm">
                    SUBE TU IMAGEN / REFERENCIA
                  </div>
                  <div className="font-black text-xs uppercase tracking-tight text-black">
                    OBRA ORIGINAL EN LIENZO
                  </div>
                  <div className="text-[9px] font-extrabold text-gray-700 uppercase">
                    {options.lienzo || 'LIENZO 30x40'} • {options.estilo_pintura || 'ACRÍLICOS NEÓN'}
                  </div>
                </div>
              </>
            )}

            <div className="absolute bottom-2 right-2 z-20 bg-brand-pink text-white text-[9px] font-black uppercase px-2 py-0.5 border border-black shadow-brutal-sm">
              A PRESUPUESTAR
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
