import React, { useState } from 'react';
import type { CustomizableCategory, Product, CustomizationSpecs } from '../types/types';
import { CustomizerCatalogGrid } from '../components/customizer/CustomizerCatalogGrid';
import { ProductCustomizerStudio } from '../components/customizer/ProductCustomizerStudio';

interface CustomizerPageProps {
  onAddToCartCustomized: (product: Product, specs: CustomizationSpecs) => void;
}

export const CustomizerPage: React.FC<CustomizerPageProps> = ({
  onAddToCartCustomized,
}) => {
  const [activeCategory, setActiveCategory] = useState<CustomizableCategory | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* RENDER HUB OR STUDIO */}
      {!activeCategory ? (
        <CustomizerCatalogGrid
          onSelectCategory={(cat) => setActiveCategory(cat)}
        />
      ) : (
        <ProductCustomizerStudio
          category={activeCategory}
          onBackToCatalog={() => setActiveCategory(null)}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          onAddToCartCustomized={onAddToCartCustomized}
        />
      )}

    </div>
  );
};
