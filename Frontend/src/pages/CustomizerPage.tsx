import React, { useState } from 'react';
import type { CustomizableCategory, Product, CustomizationSpecs, SavedDesign, User } from '../types/types';
import { CustomizerCatalogGrid } from '../components/customizer/CustomizerCatalogGrid';
import { ProductCustomizerStudio } from '../components/customizer/ProductCustomizerStudio';

interface CustomizerPageProps {
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  userSavedDesigns?: SavedDesign[];
  onAddToCartCustomized: (product: Product, specs: CustomizationSpecs) => void;
  onSaveDesignCustomized?: (savedDesign: SavedDesign) => void;
  onDeleteSavedDesignCustomized?: (designId: string) => void;
  onNavigateToProfile?: (tab?: string) => void;
  initialDesignToEdit?: {
    category: CustomizableCategory;
    options?: Record<string, string>;
    customImage?: string | null;
  } | null;
}

export const CustomizerPage: React.FC<CustomizerPageProps> = ({
  currentUser,
  onOpenAuthModal,
  userSavedDesigns,
  onAddToCartCustomized,
  onSaveDesignCustomized,
  onDeleteSavedDesignCustomized,
  onNavigateToProfile,
  initialDesignToEdit,
}) => {
  const [activeCategory, setActiveCategory] = useState<CustomizableCategory | null>(
    initialDesignToEdit?.category || null
  );

  React.useEffect(() => {
    if (initialDesignToEdit?.category) {
      setActiveCategory(initialDesignToEdit.category);
    }
  }, [initialDesignToEdit]);

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
          initialOptions={initialDesignToEdit?.options}
          initialCustomImage={initialDesignToEdit?.customImage}
          currentUser={currentUser}
          onOpenAuthModal={onOpenAuthModal}
          userSavedDesigns={userSavedDesigns}
          onBackToCatalog={() => setActiveCategory(null)}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          onAddToCartCustomized={onAddToCartCustomized}
          onSaveDesignCustomized={onSaveDesignCustomized}
          onDeleteSavedDesignCustomized={onDeleteSavedDesignCustomized}
          onNavigateToProfile={onNavigateToProfile}
        />
      )}

    </div>
  );
};
