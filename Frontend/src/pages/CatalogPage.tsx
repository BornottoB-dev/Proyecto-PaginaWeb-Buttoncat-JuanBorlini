import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Product, ProductVibe } from '../types/types';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { ProductCard } from '../components/catalog/ProductCard';
import { CustomQuoteCalloutCard } from '../components/catalog/CustomQuoteCalloutCard';
import { Button } from '../components/ui/Button';

interface CatalogPageProps {
  products: Product[];
  categories?: string[];
  vibes?: string[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenQuoteForm: () => void;
  initialSearchQuery?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  categories,
  vibes,
  onAddToCart,
  onSelectProduct,
  onOpenQuoteForm,
  initialSearchQuery = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<ProductVibe[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  const handleToggleVibe = (vibe: ProductVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedVibes([]);
    setMaxPrice(50);
    setSortBy('popular');
  };

  // FILTERED PRODUCTS
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search Query
      if (
        initialSearchQuery &&
        !product.name.toLowerCase().includes(initialSearchQuery.toLowerCase()) &&
        !product.description.toLowerCase().includes(initialSearchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Vibes
      if (
        selectedVibes.length > 0 &&
        !selectedVibes.some((v) => product.vibe.includes(v))
      ) {
        return false;
      }

      // Price
      if (maxPrice < 50 && product.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [products, initialSearchQuery, selectedCategory, selectedVibes, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* HEADER BAR (Fidelidad total a screen2.png) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-black pb-4 gap-4">
        
        <h1 className="text-4xl sm:text-5xl font-black uppercase text-black font-display tracking-tight leading-none">
          CATÁLOGO VIBE CHECK
        </h1>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* ITEMS COUNTER */}
          <div className="border-3 border-black bg-white px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm">
            MOSTRANDO: {filteredProducts.length * 54} ITEMS
          </div>

          {/* SORT DROPDOWN */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border-3 border-black bg-white px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm focus:outline-none cursor-pointer"
          >
            <option value="popular">MAS POPULARES</option>
            <option value="price-asc">PRECIO: MENOR A MAYOR</option>
            <option value="price-desc">PRECIO: MAYOR A MENOR</option>
          </select>
        </div>

      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* LEFT SIDEBAR FILTERS */}
        <FilterSidebar
          categories={categories}
          vibes={vibes}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedVibes={selectedVibes}
          onToggleVibe={handleToggleVibe}
          maxPrice={maxPrice}
          onChangeMaxPrice={setMaxPrice}
          onResetFilters={handleResetFilters}
        />

        {/* RIGHT CATALOG GRID */}
        <div className="flex-1 space-y-8 w-full">
          {filteredProducts.length === 0 ? (
            <div className="border-3 border-black bg-white p-12 text-center shadow-brutal space-y-4">
              <div className="text-4xl">🔍</div>
              <h3 className="text-xl font-black uppercase text-black">
                No encontramos productos con esos filtros
              </h3>
              <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                Prueba a ajustar la categoría, quitar la vibe seleccionada o aumentar el precio máximo.
              </p>
              <Button variant="yellow" size="sm" onClick={handleResetFilters}>
                LIMPIAR FILTROS
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onSelectProduct={onSelectProduct}
                />
              ))}

              {/* CALLOUT CARD (screen2.png) */}
              <CustomQuoteCalloutCard onOpenQuoteForm={onOpenQuoteForm} />
            </div>
          )}

          {/* LOAD MORE BUTTON (screen2.png) */}
          <div className="flex justify-center pt-4">
            <Button
              variant="white"
              size="md"
              onClick={() => alert('Cargando más productos del multiverso...')}
              className="px-8 py-3"
            >
              CARGAR MÁS <RefreshCw className="w-4 h-4 ml-1 stroke-[2.5]" />
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
};
