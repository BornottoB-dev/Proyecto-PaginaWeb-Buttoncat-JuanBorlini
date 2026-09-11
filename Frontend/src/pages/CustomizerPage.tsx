import React, { useState } from 'react';
import type { CustomizableCategory, Product, CustomizationSpecs } from '../types/types';
import { CustomizerCatalogGrid, CUSTOMIZABLE_CATEGORIES_DATA } from '../components/customizer/CustomizerCatalogGrid';
import { ProductCustomizerStudio } from '../components/customizer/ProductCustomizerStudio';

interface CustomizerPageProps {
  onAddToCartCustomized: (product: Product, specs: CustomizationSpecs) => void;
}

export const CustomizerPage: React.FC<CustomizerPageProps> = ({
  onAddToCartCustomized,
}) => {
  const [activeCategory, setActiveCategory] = useState<CustomizableCategory | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* QUICK CATEGORY SWITCHER BAR (if inside studio) */}
      {activeCategory && (
        <div className="bg-white border-3 border-black p-3 shadow-brutal-sm flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-black uppercase text-gray-500 shrink-0 px-2">
            CAMBIAR PRODUCTO:
          </span>
          {CUSTOMIZABLE_CATEGORIES_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 text-xs font-black uppercase border-2 border-black transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-brand-yellow text-black shadow-brutal-sm'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {cat.id}
            </button>
          ))}
        </div>
      )}

      {/* RENDER HUB OR STUDIO */}
      {!activeCategory ? (
        <CustomizerCatalogGrid
          onSelectCategory={(cat) => setActiveCategory(cat)}
        />
      ) : (
        <ProductCustomizerStudio
          category={activeCategory}
          onBackToCatalog={() => setActiveCategory(null)}
          onAddToCartCustomized={onAddToCartCustomized}
        />
      )}

    </div>
  );
};
