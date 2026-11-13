import React, { useState, useEffect } from 'react';
import { ArrowRight, Palette, Gem, Zap, Cat, Pin, Sticker, Shirt, Frame, Sparkles } from 'lucide-react';
import type { CustomizableCategory } from '../../types/types';
import { getCustomCategoriesData, subscribeToCustomStore } from '../../data/customStore';

import { CUSTOMIZABLE_CATEGORIES_DATA, type CustomizableProductCategoryInfo } from '../../data/customData';
export { CUSTOMIZABLE_CATEGORIES_DATA };
export type { CustomizableProductCategoryInfo };

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  COLLARES: Gem,
  ARITOS: Zap,
  'LLAVEROS / PELUCHES': Cat,
  PINES: Pin,
  STICKERS: Sticker,
  REMERAS: Shirt,
  POSTERS: Frame,
  PINTURAS: Palette,
};

export const CATEGORY_THUMBNAILS: Record<string, string> = {};

export const getCategoryThumbnail = (category: string, customImage?: string | null): string => {
  if (customImage && customImage.trim().length > 0) {
    return customImage;
  }
  const customItems = getCustomCategoriesData();
  const matched = customItems.find((c) => c.id === category);
  if (matched?.thumbnailUrl || matched?.baseImage) {
    return matched.thumbnailUrl || matched.baseImage || '';
  }
  return '';
};

interface CustomizerCatalogGridProps {
  onSelectCategory: (cat: CustomizableCategory) => void;
}

export const CustomizerCatalogGrid: React.FC<CustomizerCatalogGridProps> = ({
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<CustomizableProductCategoryInfo[]>(getCustomCategoriesData());

  useEffect(() => {
    setCategories(getCustomCategoriesData());
    return subscribeToCustomStore(() => {
      setCategories([...getCustomCategoriesData()]);
    });
  }, []);

  return (
    <div className="space-y-8 font-sans">
      
      {/* INTRO BANNER - CLEAN & INVITATIONAL */}
      <div className="border-4 border-black bg-brand-yellow p-6 sm:p-8 shadow-brutal-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
            <Palette className="w-4 h-4 text-brand-yellow" /> ESTUDIO DE CREACIÓN
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase text-black font-display tracking-tight">
            DISEÑA TU PRODUCTO ÚNICO
          </h1>
          <p className="text-sm font-bold text-black/90 leading-relaxed">
            Elige qué quieres crear y personalízalo paso a paso en tiempo real. Fácil, rápido y a tu estilo.
          </p>
        </div>
      </div>

      {/* GRID DE CATEGORÍAS */}
      {categories.length === 0 ? (
        <div className="border-3 border-black bg-white p-8 text-center shadow-brutal-md space-y-2">
          <p className="text-base font-black uppercase text-black font-display">
            NO HAY PRODUCTOS PERSONALIZABLES DISPONIBLES
          </p>
          <p className="text-xs font-bold text-gray-600">
            Estamos preparando nuevas opciones y diseños exclusivos. ¡Vuelve a consultar pronto!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className="border-3 border-black bg-white shadow-brutal-md p-5 flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {(() => {
                    const IconComp = CATEGORY_ICONS[item.id] || Sparkles;
                    return (
                      <div className="w-10 h-10 bg-brand-yellow border-2 border-black flex items-center justify-center shadow-brutal-sm group-hover:scale-110 transition-transform">
                        <IconComp className="w-5 h-5 text-black stroke-[2.5]" />
                      </div>
                    );
                  })()}
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5 border border-black">
                    {item.id === 'PINTURAS' ? 'A PRESUPUESTAR' : `DESDE $${item.basePrice.toLocaleString()}`}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase text-black font-display tracking-tight group-hover:text-brand-purple transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-full bg-brand-pink text-white border-2 border-black py-2.5 px-4 font-black text-xs uppercase shadow-brutal-sm group-hover:bg-brand-yellow group-hover:text-black transition-all flex items-center justify-center gap-2 active:translate-y-0.5 cursor-pointer"
              >
                DISEÑAR AHORA <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
