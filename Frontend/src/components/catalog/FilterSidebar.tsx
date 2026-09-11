import React from 'react';
import { X } from 'lucide-react';
import type { ProductVibe } from '../../types/types';

interface FilterSidebarProps {
  categories?: string[];
  vibes?: string[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  selectedVibes: ProductVibe[];
  onToggleVibe: (vibe: ProductVibe) => void;
  maxPrice: number;
  onChangeMaxPrice: (val: number) => void;
  onResetFilters: () => void;
}

const DEFAULT_CATEGORIES = [
  'LLAVEROS / PELUCHES',
  'STICKERS',
  'POSTERS',
  'PINES',
  'ARITOS',
  'COLLARES',
  'REMERAS',
  'PINTURAS',
];

const DEFAULT_VIBES = ['GOTH', 'Y2K', 'KAWAII', 'PUNK', 'ROCK', 'NEÓN'];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories = DEFAULT_CATEGORIES,
  vibes = DEFAULT_VIBES,
  selectedCategory,
  onSelectCategory,
  selectedVibes,
  onToggleVibe,
  maxPrice,
  onChangeMaxPrice,
  onResetFilters,
}) => {
  return (
    <aside className="w-full md:w-64 border-3 border-black bg-white p-5 shadow-brutal space-y-6 shrink-0 font-sans">
      
      {/* CATEGORÍAS */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <h3 className="text-base font-black uppercase tracking-wider text-black font-display">
            CATEGORÍAS
          </h3>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <li key={cat}>
                <button
                  onClick={() => onSelectCategory(isSelected ? null : cat)}
                  className={`w-full text-left font-black text-xs sm:text-sm tracking-wide transition-colors flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'text-black bg-brand-yellow px-2 py-1 border-2 border-black shadow-brutal-sm'
                      : 'text-gray-800 hover:text-brand-purple hover:pl-1'
                  }`}
                >
                  {isSelected && (
                    <span className="bg-black text-white w-4 h-4 rounded-none text-[10px] flex items-center justify-center font-bold">
                      ✕
                    </span>
                  )}
                  {cat}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* VIBE */}
      <div>
        <h3 className="text-base font-black uppercase tracking-wider text-black border-b-2 border-black pb-2 mb-3 font-display">
          VIBE
        </h3>

        <div className="flex flex-wrap gap-2">
          {vibes.map((vibe) => {
            const isSelected = selectedVibes.includes(vibe);
            return (
              <button
                key={vibe}
                onClick={() => onToggleVibe(vibe)}
                className={`
                  border-2 border-black px-2.5 py-1 text-xs font-extrabold transition-all shadow-brutal-sm cursor-pointer
                  ${
                    isSelected
                      ? 'bg-brand-cyan text-black'
                      : 'bg-white text-black hover:bg-gray-100'
                  }
                `}
              >
                {vibe}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRECIO MAX */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
          <h3 className="text-base font-black uppercase tracking-wider text-black font-display">
            PRECIO MAX
          </h3>
          <span className="text-sm font-black text-black">
            ${maxPrice >= 50 ? '50+' : maxPrice}
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={maxPrice}
          onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
          className="w-full accent-brand-purple cursor-pointer"
        />

        <div className="flex justify-between text-xs font-bold text-gray-500 mt-1">
          <span>$0</span>
          <span>$50+</span>
        </div>
      </div>

      {/* BOTÓN RESTABLECER */}
      <button
        onClick={onResetFilters}
        className="w-full text-xs font-black uppercase py-2 bg-gray-100 border-2 border-black hover:bg-brand-yellow transition-colors shadow-brutal-sm cursor-pointer active:translate-y-0.5"
      >
        RESTABLECER FILTROS
      </button>

    </aside>
  );
};
