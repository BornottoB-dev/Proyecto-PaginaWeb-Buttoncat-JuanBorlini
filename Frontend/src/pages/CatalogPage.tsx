import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Product, ProductVibe } from '../types/types';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { ProductCard } from '../components/catalog/ProductCard';
import { CustomQuoteCalloutCard } from '../components/catalog/CustomQuoteCalloutCard';
import { Button } from '../components/ui/Button';

interface CatalogPageProps {
  products: Product[];
  categories?: string[];
  vibes?: string[];
  wishlist?: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenQuoteForm: () => void;
  onToggleFavorite?: (product: Product) => void;
  initialSearchQuery?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  categories,
  vibes,
  wishlist = [],
  onAddToCart,
  onSelectProduct,
  onOpenQuoteForm,
  onToggleFavorite,
  initialSearchQuery = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<ProductVibe[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 12;

  const handleToggleVibe = (vibe: ProductVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedVibes([]);
    setMaxPrice(50);
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Reset page to 1 if search or main filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, maxPrice, sortBy, initialSearchQuery]);

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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, validCurrentPage]);

  const activeFiltersCount = (selectedCategory ? 1 : 0) + selectedVibes.length + (maxPrice < 50 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="border-3 sm:border-4 border-black bg-white p-4 shadow-brutal-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-black font-display tracking-tight leading-none">
              CATÁLOGO VIBE CHECK
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-1">
              Explora nuestros productos artesanales, calcos, accesorios y más.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="border-2 border-black bg-brand-yellow px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm">
              {filteredProducts.length} PRODUCTOS {totalPages > 1 && `(PÁG. ${validCurrentPage}/${totalPages})`}
            </div>

            {/* SORT DROPDOWN */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm focus:outline-none cursor-pointer"
            >
              <option value="popular">MÁS POPULARES</option>
              <option value="price-asc">PRECIO: MENOR</option>
              <option value="price-desc">PRECIO: MAYOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE FILTER TRIGGER BUTTON & ACTIVE BADGES BAR */}
      <div className="md:hidden flex items-center justify-between gap-2 bg-brand-purple border-2 border-black p-2.5 shadow-brutal-sm">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="inline-flex items-center gap-2 bg-brand-yellow text-black border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm cursor-pointer hover:bg-white transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
          <span>FILTRAR CATÁLOGO / VIBE</span>
          {activeFiltersCount > 0 && (
            <span className="bg-black text-white rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-black text-red-600 underline cursor-pointer uppercase"
          >
            LIMPIAR ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* MOBILE SLIDE-OVER FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in">
          <div className="w-full max-w-xs bg-white border-l-4 border-black p-5 shadow-brutal-xl overflow-y-auto space-y-4 h-full">
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <h3 className="text-base font-black uppercase text-black font-display flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> FILTROS DE CATÁLOGO
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 bg-yellow-200 border-2 border-black text-black cursor-pointer shadow-brutal-sm"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <FilterSidebar
              categories={categories}
              vibes={vibes}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => { setSelectedCategory(cat); setCurrentPage(1); }}
              selectedVibes={selectedVibes}
              onToggleVibe={handleToggleVibe}
              maxPrice={maxPrice}
              onChangeMaxPrice={(p) => { setMaxPrice(p); setCurrentPage(1); }}
              onResetFilters={handleResetFilters}
            />

            <Button
              variant="yellow"
              size="md"
              fullWidth
              onClick={() => setIsMobileFilterOpen(false)}
            >
              VER RESULTADOS ({filteredProducts.length})
            </Button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        
        {/* DESKTOP LEFT SIDEBAR FILTERS (HIDDEN ON MOBILE) */}
        <div className="hidden md:block shrink-0">
          <FilterSidebar
            categories={categories}
            vibes={vibes}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setCurrentPage(1); }}
            selectedVibes={selectedVibes}
            onToggleVibe={handleToggleVibe}
            maxPrice={maxPrice}
            onChangeMaxPrice={(p) => { setMaxPrice(p); setCurrentPage(1); }}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* RIGHT CATALOG GRID (2 COLUMNS ON MOBILE) */}
        <div className="flex-1 space-y-6 w-full">
          {filteredProducts.length === 0 ? (
            <div className="border-3 border-black bg-white p-8 sm:p-12 text-center shadow-brutal space-y-4">
              <div className="text-4xl">🔍</div>
              <h3 className="text-lg sm:text-xl font-black uppercase text-black">
                No encontramos productos con esos filtros
              </h3>
              <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                Prueba a cambiar la categoría, quitar las vibes seleccionadas o ajustar el precio máximo.
              </p>
              <Button variant="yellow" size="sm" onClick={handleResetFilters}>
                LIMPIAR FILTROS
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={wishlist.some((w) => w.id === product.id)}
                  onAddToCart={onAddToCart}
                  onSelectProduct={onSelectProduct}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}

              {/* CALLOUT CARD ONLY RENDERS IF IT DOES NOT SIT ALONE IN A ROW */}
              {paginatedProducts.length > 0 && paginatedProducts.length % 3 !== 0 && (
                <CustomQuoteCalloutCard onOpenQuoteForm={onOpenQuoteForm} />
              )}
            </div>
          )}

          {/* NUMBERED PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-6 border-t-3 border-black flex-wrap">
              {/* FIRST PAGE BUTTON */}
              <button
                disabled={validCurrentPage === 1}
                onClick={() => {
                  setCurrentPage(1);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                title="Primera página"
                aria-label="Primera página"
                className={`p-2 border-2 border-black font-black text-xs uppercase flex items-center justify-center transition-all ${
                  validCurrentPage === 1
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-brand-yellow cursor-pointer shadow-brutal-sm'
                }`}
              >
                <ChevronsLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* PREVIOUS PAGE BUTTON */}
              <button
                disabled={validCurrentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`px-3 py-2 border-2 border-black font-black text-xs uppercase flex items-center gap-1 transition-all ${
                  validCurrentPage === 1
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-brand-yellow cursor-pointer shadow-brutal-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" /> ANTERIOR
              </button>

              {/* PAGE NUMBERS */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === validCurrentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 border-2 border-black font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-yellow text-black shadow-brutal-sm scale-105 border-3'
                          : 'bg-white text-black hover:bg-yellow-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* NEXT PAGE BUTTON */}
              <button
                disabled={validCurrentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`px-3 py-2 border-2 border-black font-black text-xs uppercase flex items-center gap-1 transition-all ${
                  validCurrentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-brand-yellow cursor-pointer shadow-brutal-sm'
                }`}
              >
                SIGUIENTE <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* LAST PAGE BUTTON */}
              <button
                disabled={validCurrentPage === totalPages}
                onClick={() => {
                  setCurrentPage(totalPages);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                title="Última página"
                aria-label="Última página"
                className={`p-2 border-2 border-black font-black text-xs uppercase flex items-center justify-center transition-all ${
                  validCurrentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-brand-yellow cursor-pointer shadow-brutal-sm'
                }`}
              >
                <ChevronsRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
