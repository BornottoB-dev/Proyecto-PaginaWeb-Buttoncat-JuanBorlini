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
    <aside className="w-full md:w-64 border-3 border-black bg-brand-yellow p-4 sm:p-5 shadow-brutal space-y-5 shrink-0 font-sans">
      
      {/* CATEGORÍAS */}
      <div>
        <div className="flex items-center justify-between bg-brand-purple text-white border-2 border-black px-3 py-1.5 mb-3 shadow-brutal-sm">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-display text-brand-yellow">
            CATEGORÍAS
          </h3>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-[10px] font-black uppercase bg-brand-yellow text-black border border-black px-1.5 py-0.5 hover:bg-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> LIMPIAR
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
                  className={`w-full text-left font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-2 cursor-pointer p-2 border-2 border-black shadow-brutal-sm ${
                    isSelected
                      ? 'bg-brand-purple text-brand-yellow translate-x-1'
                      : 'bg-white text-black hover:bg-brand-purple hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <span className="bg-brand-yellow text-black w-4 h-4 text-[10px] flex items-center justify-center font-black shrink-0 border border-black">
                      ✓
                    </span>
                  )}
                  <span>{cat}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* VIBE */}
      <div>
        <div className="bg-brand-purple text-white border-2 border-black px-3 py-1.5 mb-3 shadow-brutal-sm">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-display text-brand-yellow">
            VIBE
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {vibes.map((vibe) => {
            const isSelected = selectedVibes.includes(vibe);
            return (
              <button
                key={vibe}
                onClick={() => onToggleVibe(vibe)}
                className={`
                  border-2 border-black px-2.5 py-1.5 text-xs font-black transition-all shadow-brutal-sm cursor-pointer
                  ${
                    isSelected
                      ? 'bg-brand-purple text-brand-yellow scale-105'
                      : 'bg-white text-black hover:bg-brand-purple hover:text-white'
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
        <div className="flex items-center justify-between bg-brand-purple text-white border-2 border-black px-3 py-1.5 mb-3 shadow-brutal-sm">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-display text-brand-yellow">
            PRECIO MAX
          </h3>
          <span className="text-xs font-black bg-brand-yellow text-black border border-black px-1.5 py-0.5">
            ${maxPrice >= 50 ? '50+' : maxPrice}
          </span>
        </div>

        <div className="bg-white border-2 border-black p-2.5 shadow-brutal-sm space-y-2">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={maxPrice}
            onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
            className="w-full accent-brand-purple cursor-pointer"
          />

          <div className="flex justify-between text-xs font-black text-black">
            <span>$0</span>
            <span>$50+</span>
          </div>
        </div>
      </div>

      {/* BOTÓN RESTABLECER */}
      <button
        onClick={onResetFilters}
        className="w-full text-xs font-black uppercase py-2.5 bg-brand-purple text-brand-yellow border-2 border-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer active:translate-y-0.5"
      >
        RESTABLECER FILTROS
      </button>

    </aside>
  );
};
