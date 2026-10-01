import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, Truck, RefreshCw, Star, SlidersHorizontal, Check, Heart, ChevronLeft, ChevronRight, AlertTriangle, MessageSquare, X, CheckCircle } from 'lucide-react';
import type { Product, CustomizableCategory, CartItem, User } from '../types/types';
import { handleProductImageError, getDefaultVariationsForCategory, getOptionLabel, getOptionPriceDelta, getOptionStock, calculateEffectiveProductStock } from '../types/types';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/catalog/ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  wishlist?: Product[];
  cartItems?: CartItem[];
  currentUser?: User | null;
  onBackToCatalog: () => void;
  onAddToCart: (product: Product, quantity?: number, selectedOptions?: Record<string, string>) => void;
  onOpenCustomizerStudio: (category: CustomizableCategory) => void;
  onSelectProduct: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onAddReview?: (productId: string, newReview: { rating: number; comment: string; userName: string }) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  wishlist = [],
  cartItems = [],
  currentUser = null,
  onBackToCatalog,
  onAddToCart,
  onOpenCustomizerStudio,
  onSelectProduct,
  onToggleFavorite,
  onAddReview,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Review Form state
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newReviewName, setNewReviewName] = useState<string>(currentUser?.name || '');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name) {
      setNewReviewName(currentUser.name);
    }
  }, [currentUser]);

  // Standard or admin-customized variation choices
  const getStandardVariationGroups = () => {
    const rawVars = (product.variations && product.variations.length > 0)
      ? product.variations
      : getDefaultVariationsForCategory(product.category);

    return rawVars.map((v) => ({
      key: v.name,
      label: v.name,
      options: v.options.map((opt) => ({
        label: getOptionLabel(opt),
        priceDelta: getOptionPriceDelta(opt),
        stock: getOptionStock(opt),
      })),
    }));
  };

  const variationGroups = getStandardVariationGroups();
  
  // Selected variations state
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variationGroups.forEach((g) => {
      initial[g.key] = g.options[0]?.label || '';
    });
    return initial;
  });

  const handleVariationSelect = (groupKey: string, optionValue: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [groupKey]: optionValue,
    }));
  };

  // Calculate price deltas & effective stock from selected variations
  const calculateSelectedDeltas = () => {
    let sum = 0;
    variationGroups.forEach((g) => {
      const selectedLabel = selectedVariations[g.key];
      const foundOpt = g.options.find((o) => o.label === selectedLabel);
      if (foundOpt) {
        sum += foundOpt.priceDelta;
      }
    });
    return sum;
  };

  const additionalPrice = calculateSelectedDeltas();
  const effectiveUnitPrice = product.price + additionalPrice;
  const effectiveStock = calculateEffectiveProductStock(product, selectedVariations);

  const detailsStr = Object.keys(selectedVariations).length > 0
    ? Object.entries(selectedVariations).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ')
    : undefined;

  const existingCartItem = cartItems.find(
    (item) => item.product.id === product.id && (item.customizationDetails === detailsStr || (!detailsStr && !item.customizationDetails))
  );
  const existingQuantityInCart = existingCartItem ? existingCartItem.quantity : 0;
  const remainingStock = Math.max(0, effectiveStock - existingQuantityInCart);
  const isMaxCartReached = effectiveStock > 0 && remainingStock === 0;

  useEffect(() => {
    if (remainingStock > 0 && quantity > remainingStock) {
      setQuantity(remainingStock);
    } else if (remainingStock === 0) {
      setQuantity(0);
    } else if (quantity === 0 && remainingStock > 0) {
      setQuantity(1);
    }
  }, [selectedVariations, remainingStock]);

  const totalPrice = effectiveUnitPrice * (effectiveStock > 0 ? quantity : 0);

  // Dynamic reviews & ratings calculations
  const reviewsList = product.reviews || [];
  const reviewsCount = reviewsList.length;
  const hasReviews = reviewsCount > 0;
  
  const avgRating = hasReviews
    ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsCount)
    : 0;

  const displayRating = hasReviews ? avgRating.toFixed(1) : 'S/V';

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationModalMsg(null);
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
      return;
    }
    const authorName = newReviewName.trim() || (currentUser ? currentUser.name : 'Cliente Buttoncat');
    
    if (onAddReview) {
      onAddReview(product.id, {
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        userName: authorName,
      });
    }

    setReviewSuccessMsg('¡Muchas gracias! Tu valoración fue agregada exitosamente.');
    setNewReviewComment('');
    setIsReviewFormOpen(false);
    setTimeout(() => {
      setReviewSuccessMsg(null);
    }, 4500);
  };

  // Rating breakdown percentages
  const getRatingPercentage = (starNumber: number) => {
    if (!hasReviews) return 0;
    const count = reviewsList.filter((r) => Math.round(r.rating) === starNumber).length;
    return Math.round((count / reviewsCount) * 100);
  };

  // Map category string to customizable category enum if customizable
  const getCustomizableCategory = (): CustomizableCategory | null => {
    const cat = product.category;
    if (cat === 'COLLARES') return 'COLLARES';
    if (cat === 'ARITOS') return 'ARITOS';
    if (cat === 'LLAVEROS / PELUCHES') return 'LLAVEROS / PELUCHES';
    if (cat === 'PINES') return 'PINES';
    if (cat === 'STICKERS') return 'STICKERS';
    if (cat === 'REMERAS') return 'REMERAS';
    if (cat === 'POSTERS') return 'POSTERS';
    if (cat === 'PINTURAS') return 'PINTURAS';
    return null;
  };

  const customizableCat = getCustomizableCategory();

  // Mock product gallery images
  const productImages = [
    product.image,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
  ];

  // Related products
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between gap-4 border-b-4 border-black pb-4 flex-wrap">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 bg-white border-3 border-black px-4 py-2 text-xs font-black uppercase text-black hover:bg-brand-yellow transition-all shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> VOLVER AL CATÁLOGO
        </button>

        <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
          <span className="text-gray-400">INICIO</span> / <span className="text-gray-400">CATÁLOGO</span> / <span className="bg-brand-yellow text-black border border-black px-2 py-0.5">{product.name}</span>
        </div>
      </div>

      {/* MAIN PRODUCT DETAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: IMAGE GALLERY */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* MAIN PHOTO BOX WITH CAROUSEL BUTTONS */}
          <div className="relative border-4 border-black bg-white shadow-brutal-xl overflow-hidden aspect-square flex items-center justify-center group select-none">
            {(() => {
              const isRedundantBadge = product.badge && (
                (product.stock === 0 && (product.badge === 'AGOTADO' || product.badge === 'SIN STOCK')) ||
                (product.isUnique && (product.badge === 'PIEZA ÚNICA' || product.badge === 'OBRA ÚNICA'))
              );
              const showTopLeftBadge = product.badge && !isRedundantBadge;

              return showTopLeftBadge ? (
                <div className="absolute top-4 left-4 z-10">
                  <span className={`border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-brutal-sm ${product.badgeBg || 'bg-brand-pink text-white'}`}>
                    {product.badge}
                  </span>
                </div>
              ) : null;
            })()}

            <span className={`absolute top-4 right-4 z-10 border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm ${
              product.stock === 0
                ? 'bg-red-600 text-white'
                : product.isUnique
                ? 'bg-brand-purple text-white'
                : 'bg-emerald-400 text-black'
            }`}>
              {product.stock === 0
                ? 'AGOTADO / SIN STOCK'
                : product.isUnique
                ? 'PIEZA ÚNICA'
                : 'STOCK DISPONIBLE'}
            </span>

            <img
              src={productImages[activeImageIndex]}
              alt={product.name}
              onError={handleProductImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* CAROUSEL LEFT/RIGHT CHEVRONS */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-brand-yellow text-black border-2 border-black shadow-brutal-sm flex items-center justify-center cursor-pointer hover:bg-white active:translate-y-0.5 transition-all"
                  title="Imagen anterior"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % productImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-brand-yellow text-black border-2 border-black shadow-brutal-sm flex items-center justify-center cursor-pointer hover:bg-white active:translate-y-0.5 transition-all"
                  title="Imagen siguiente"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </button>
              </>
            )}
          </div>

          {/* THUMBNAIL SELECTOR */}
          <div className="flex items-center gap-3">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-20 h-20 border-3 border-black bg-white overflow-hidden transition-all shadow-brutal-sm cursor-pointer ${
                  activeImageIndex === idx
                    ? 'ring-4 ring-brand-purple scale-105 shadow-brutal'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Vista ${idx + 1}`}
                  onError={handleProductImageError}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: PRODUCT INFO & VARIATIONS */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* TITLE & VIBES */}
          <div className="space-y-2 border-b-4 border-black pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-0.5 tracking-widest">
                {product.category}
              </span>
              {product.vibe.map((v) => (
                <span key={v} className="bg-brand-yellowLight border border-black text-[10px] font-black uppercase px-2 py-0.5">
                  #{v}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase text-black font-display tracking-tight leading-none">
              {product.name}
            </h1>

            {/* DYNAMIC RATING LINK */}
            {hasReviews ? (
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-2 pt-1 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="flex text-brand-orange">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(avgRating)
                          ? 'fill-brand-orange text-black'
                          : 'fill-gray-200 text-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-black underline">
                  {displayRating} / 5.0 ({reviewsCount} {reviewsCount === 1 ? 'valoración' : 'valoraciones'})
                </span>
              </a>
            ) : (
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-2 pt-1 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="flex text-gray-300">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-gray-100 text-gray-400" />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-500 underline">
                  Sin valoraciones aún (0 valoraciones)
                </span>
              </a>
            )}
          </div>

          {/* PRICE DISPLAY */}
          <div className="bg-brand-yellow/30 border-3 border-black p-4 shadow-brutal-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <span className="text-[11px] font-extrabold uppercase text-gray-700 block mb-1.5 leading-tight">
                PRECIO FINAL UNITARIO {additionalPrice > 0 ? `(Base $${product.price.toLocaleString('es-AR')} + Adicionales $${additionalPrice.toLocaleString('es-AR')})` : ''}
              </span>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg sm:text-2xl font-extrabold text-gray-500 line-through decoration-2">
                    ${(product.originalPrice + additionalPrice).toLocaleString('es-AR')}
                  </span>
                )}
                <div className="inline-block bg-brand-yellow px-3 py-1 border-3 border-black shadow-brutal-sm">
                  <span className="text-3xl sm:text-4xl font-black text-black font-display leading-none">
                    ${effectiveUnitPrice.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="bg-brand-pink text-white border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm shrink-0">
                ¡OFF -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%!
              </span>
            ) : (
              <span className="bg-brand-pink text-white border-2 border-black px-3 py-1.5 text-xs font-black uppercase shadow-brutal-sm shrink-0">
                NEOBRUTAL EDITION
              </span>
            )}
          </div>

          {/* DESCRIPTION BOX */}
          <div className="border-3 border-black bg-white p-5 shadow-brutal-md space-y-2">
            <h4 className="text-sm font-black uppercase text-black font-display border-b-2 border-black pb-1">
              DESCRIPCIÓN DEL PRODUCTO
            </h4>
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              {product.description} Confeccionado con los estándares artesanales de Buttoncat, combinando materiales de alta resistencia y acabados metálicos probados. Ideal para regalar o complementar tu outfit neobrutalista cotidiano.
            </p>
          </div>

          {/* STANDARD VARIATIONS SELECTOR */}
          <div className="space-y-5 border-3 border-black bg-white p-5 shadow-brutal-md">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 text-xs font-black uppercase">
              <SlidersHorizontal className="w-4 h-4 text-brand-purple" />
              <span>SELECCIONAR VARIACIONES DEL PRODUCTO</span>
            </div>

            {variationGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <label className="text-xs font-black uppercase text-black flex items-center justify-between">
                  <span>{group.label}: <strong className="text-brand-purple">{selectedVariations[group.key]}</strong></span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const isSelected = selectedVariations[group.key] === opt.label;
                    const isOptOutOfStock = opt.stock === 0;

                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleVariationSelect(group.key, opt.label)}
                        className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all shadow-brutal-sm flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-brand-yellow text-black ring-2 ring-black font-black shadow-brutal'
                            : isOptOutOfStock
                            ? 'bg-gray-100 text-gray-400 border-gray-400 line-through'
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{opt.label}</span>
                        {opt.priceDelta > 0 && (
                          <span className="bg-brand-pink text-white text-[10px] px-1.5 py-0.5 border border-black font-extrabold shadow-brutal-sm">
                            (+${opt.priceDelta.toLocaleString('es-AR')})
                          </span>
                        )}
                        {isOptOutOfStock && (
                          <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 border border-black font-black uppercase shadow-brutal-sm">
                            SIN STOCK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* OUT OF STOCK OR MAX CART BANNER */}
            {effectiveStock === 0 ? (
              <div className="border-3 border-black bg-red-600 text-white p-4 shadow-brutal-md space-y-1">
                <div className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white" /> VARIANTE O PRODUCTO AGOTADO (SIN STOCK)
                </div>
                <p className="text-xs font-bold text-red-100">
                  La combinación de variaciones seleccionada no posee stock disponible por el momento. Selecciona otra variante para realizar tu compra.
                </p>
              </div>
            ) : isMaxCartReached && (
              <div className="border-3 border-black bg-amber-500 text-white p-4 shadow-brutal-md space-y-1">
                <div className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white" /> STOCK MÁXIMO ALCANZADO EN TU CARRITO
                </div>
                <p className="text-xs font-bold text-amber-100">
                  Ya tienes todas las unidades disponibles de esta variante ({existingQuantityInCart} de {effectiveStock}) agregadas a tu carrito.
                </p>
              </div>
            )}

            {/* QUANTITY SELECTOR */}
            <div className="pt-3 border-t-2 border-black space-y-2">
              <label className="text-xs font-black uppercase text-black block">CANTIDAD:</label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border-3 border-black bg-white shadow-brutal-sm">
                  <button
                    disabled={remainingStock === 0 || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-yellow-200 border-r-2 border-black font-black text-lg text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-black text-base text-black">{remainingStock > 0 ? quantity : 0}</span>
                  <button
                    disabled={remainingStock === 0 || quantity >= remainingStock}
                    onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-yellow-200 border-l-2 border-black font-black text-lg text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-black uppercase text-gray-500">
                  TOTAL: <strong className="text-black font-display text-base">${(remainingStock > 0 ? totalPrice : 0).toLocaleString('es-AR')}</strong>
                </span>
              </div>
            </div>

            {/* ADD TO CART & FAVORITE ACTIONS */}
            <div className="flex gap-3">
              {effectiveStock === 0 ? (
                <Button
                  variant="yellow"
                  size="lg"
                  disabled
                  className="flex-1 py-4 text-sm tracking-wider bg-gray-300 text-gray-500 border-3 border-black cursor-not-allowed shadow-none"
                >
                  VARIANTE AGOTADA (SIN STOCK)
                </Button>
              ) : isMaxCartReached ? (
                <Button
                  variant="yellow"
                  size="lg"
                  disabled
                  className="flex-1 py-4 text-sm tracking-wider bg-amber-100 text-amber-900 border-3 border-black cursor-not-allowed shadow-none font-black"
                >
                  MÁXIMO DE STOCK EN CARRITO ({existingQuantityInCart}/{effectiveStock})
                </Button>
              ) : (
                <Button
                  variant="pink"
                  size="lg"
                  onClick={() => {
                    const productToCart: Product = {
                      ...product,
                      price: effectiveUnitPrice,
                    };
                    onAddToCart(productToCart, quantity, selectedVariations);
                    setQuantity(1);
                  }}
                  className="flex-1 py-4 text-sm tracking-wider"
                >
                  <ShoppingBag className="w-5 h-5 mr-2 stroke-[2.5]" />
                  AÑADIR AL CARRITO (${totalPrice.toLocaleString('es-AR')})
                </Button>
              )}

              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(product)}
                  className={`w-14 h-14 border-3 border-black flex items-center justify-center shadow-brutal transition-all cursor-pointer ${
                    wishlist.some((w) => w.id === product.id)
                      ? 'bg-brand-pink text-white hover:bg-red-600'
                      : 'bg-white text-black hover:bg-pink-100'
                  }`}
                  title={wishlist.some((w) => w.id === product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Heart
                    className={`w-6 h-6 stroke-[2.5] ${
                      wishlist.some((w) => w.id === product.id) ? 'fill-white text-white' : 'text-black'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* QUICK STUDIO CUSTOMIZER LINK (IF CUSTOMIZABLE) */}
          {customizableCat && (
            <div className="border-3 border-black bg-brand-cyanLight p-4 shadow-brutal-md flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1 max-w-sm">
                <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase px-2 py-0.5">
                  <Sparkles className="w-3 h-3 text-brand-yellow" /> ¿BUSCAS DISEÑO 100% PROPIO?
                </span>
                <p className="text-xs font-extrabold text-black leading-tight">
                  Abre Buttoncat Studio para cambiar formas, dijes, colores y subir tus propias imágenes en tiempo real.
                </p>
              </div>

              <Button
                variant="yellow"
                size="sm"
                onClick={() => onOpenCustomizerStudio(customizableCat)}
                className="whitespace-nowrap font-black"
              >
                DISEÑAR EN STUDIO
              </Button>
            </div>
          )}

          {/* SPECS & GUARANTEES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border-2 border-black bg-white p-3 shadow-brutal-sm text-center space-y-1">
              <Truck className="w-5 h-5 mx-auto text-brand-purple stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase block">ENVÍOS A TODO EL PAÍS</span>
            </div>
            <div className="border-2 border-black bg-white p-3 shadow-brutal-sm text-center space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-brand-pink stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase block">GARANTÍA BUTTONCAT</span>
            </div>
            <div className="border-2 border-black bg-white p-3 shadow-brutal-sm text-center space-y-1">
              <RefreshCw className="w-5 h-5 mx-auto text-brand-yellow stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase block">CAMBIOS HASTA 30 DÍAS</span>
            </div>
          </div>

        </div>

      </div>

      {/* REVIEWS & RATINGS SECTION */}
      <div id="reviews-section" className="pt-8 border-t-4 border-black space-y-8">
        
        {/* SUCCESS NOTIFICATION */}
        {reviewSuccessMsg && (
          <div className="bg-emerald-400 text-black border-3 border-black p-4 font-black shadow-brutal-md flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <span>{reviewSuccessMsg}</span>
            </div>
            <button onClick={() => setReviewSuccessMsg(null)} className="p-1 hover:bg-black/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* SECTION HEADER & SUMMARY BAR */}
        <div className="bg-white border-4 border-black p-6 shadow-brutal-lg flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full md:w-auto">
            <div className={`border-3 border-black p-4 shadow-brutal text-center min-w-[140px] ${
              hasReviews ? 'bg-brand-yellow' : 'bg-gray-100'
            }`}>
              <span className={`text-5xl font-black font-display block leading-none ${
                hasReviews ? 'text-black' : 'text-gray-400'
              }`}>
                {displayRating}
              </span>
              <div className="flex justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      hasReviews && star <= Math.round(avgRating)
                        ? 'fill-brand-orange text-black'
                        : 'fill-gray-200 text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                {reviewsCount} {reviewsCount === 1 ? 'VALORACIÓN' : 'VALORACIONES'}
              </span>
            </div>

            {/* STAR RATING DISTRIBUTION BREAKDOWN */}
            <div className="space-y-1.5 w-full max-w-xs text-xs font-black">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = getRatingPercentage(star);
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-12 text-right text-gray-700 flex items-center justify-end gap-1">
                      {star} <Star className="w-3 h-3 fill-brand-orange text-black" />
                    </span>
                    <div className="flex-1 bg-gray-100 border border-black h-3 overflow-hidden shadow-brutal-sm">
                      <div
                        className="bg-brand-orange h-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-left text-[10px] text-gray-500 font-extrabold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTION TO WRITE A REVIEW */}
          <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right w-full md:w-auto border-t-2 md:border-t-0 md:border-l-2 border-black/20 pt-4 md:pt-0 md:pl-6">
            <h3 className="text-lg font-black uppercase text-black font-display">
              ¿COMPRASTE ESTE PRODUCTO?
            </h3>
            <p className="text-xs font-bold text-gray-600 max-w-xs">
              Comparte tu experiencia con la comunidad neobrutalista de Buttoncat.
            </p>
            <Button
              variant="pink"
              size="md"
              onClick={() => setIsReviewFormOpen((prev) => !prev)}
              className="font-black uppercase tracking-wider shadow-brutal"
            >
              {isReviewFormOpen ? (
                <>
                  <X className="w-4 h-4 mr-1.5 stroke-[3]" /> CANCELAR VALORACIÓN
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-1.5 stroke-[2.5]" /> CALIFICAR ESTE PRODUCTO
                </>
              )}
            </Button>
          </div>
        </div>

        {/* REVIEW SUBMISSION FORM / MODAL */}
        {isReviewFormOpen && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-brand-yellow/20 border-4 border-black p-6 shadow-brutal-lg space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-orange fill-brand-orange" />
                <h4 className="text-base font-black uppercase text-black font-display">
                  DEJAR UNA VALORACIÓN Y RESEÑA
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(false)}
                className="p-1 hover:bg-black/10 cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* ERROR MESSAGE BANNER */}
            {validationModalMsg && (
              <div className="bg-red-100 border-3 border-black text-red-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{validationModalMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* STAR SELECTOR */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  SELECCIONA TU CALIFICACIÓN (1 A 5 ESTRELLAS) *
                </label>
                <div className="flex items-center gap-1.5 bg-white border-3 border-black p-2.5 shadow-brutal-sm">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || newReviewRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        title={`Calificar ${star} estrellas`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'fill-brand-orange text-black'
                              : 'fill-gray-200 text-gray-400'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 font-black text-sm text-black">
                    {hoverRating || newReviewRating} / 5
                  </span>
                </div>
              </div>

              {/* USER NAME */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  TU NOMBRE O SEUDÓNIMO *
                </label>
                <input
                  type="text"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="Ej: Sofia Gómez"
                  className="w-full border-3 border-black p-2.5 bg-white font-bold text-black focus:outline-none shadow-brutal-sm text-xs"
                />
              </div>
            </div>

            {/* COMMENT TEXTAREA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-black">
                TU OPINIÓN SOBRE EL PRODUCTO *
              </label>
              <textarea
                rows={3}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Escribe aquí tu opinión sobre la calidad, confección, envío o terminaciones del producto..."
                className="w-full border-3 border-black p-3 bg-white font-bold text-black focus:outline-none shadow-brutal-sm text-xs resize-none"
              />
            </div>

            {/* FORM BUTTONS */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(false)}
                className="px-4 py-2 border-2 border-black bg-white text-black font-black uppercase text-xs hover:bg-gray-100 shadow-brutal-sm cursor-pointer"
              >
                CANCELAR
              </button>
              <Button variant="yellow" size="md" type="submit" className="font-black uppercase shadow-brutal">
                <Check className="w-4 h-4 mr-1 stroke-[3]" /> PUBLICAR VALORACIÓN
              </Button>
            </div>
          </form>
        )}

        {/* LIST OF REVIEWS */}
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-2 border-b-2 border-black pb-2">
            <MessageSquare className="w-4 h-4 text-brand-purple" />
            RESEÑAS PUBLICADAS DE ESTE PRODUCTO ({reviewsList.length})
          </h4>

          {reviewsList.length === 0 ? (
            <div className="bg-white border-3 border-black p-8 text-center shadow-brutal space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-gray-400 stroke-[1.5]" />
              <p className="text-sm font-black uppercase text-black">
                AÚN NO HAY VALORACIONES ESCRITAS PARA ESTE PRODUCTO
              </p>
              <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                Sé la primera persona en comprar este producto y dejar su opinión sobre los materiales y detalles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev) => {
                const initial = (rev.userName || 'C').charAt(0).toUpperCase();
                return (
                  <div
                    key={rev.id}
                    className="bg-white border-3 border-black p-5 shadow-brutal-md space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-purple border-2 border-black text-white font-black text-base flex items-center justify-center shadow-brutal-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-black text-xs uppercase text-black block leading-tight">
                              {rev.userName}
                            </span>
                            <span className="text-[10px] font-extrabold text-gray-500 block">
                              {rev.date}
                            </span>
                          </div>
                        </div>

                        <span className="bg-emerald-100 text-emerald-950 border border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-brutal-sm shrink-0">
                          COMPRA VERIFICADA
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-brand-orange pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? 'fill-brand-orange text-black'
                                : 'fill-gray-200 text-gray-400'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-black text-black ml-1">
                          {rev.rating}.0 / 5
                        </span>
                      </div>

                      <p className="text-xs font-bold text-gray-700 leading-relaxed pt-1">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-extrabold text-gray-400">
                      <span>BUTTONCAT VERIFIED REVIEW</span>
                      <span className="text-brand-purple font-black">✦ ✦ ✦</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t-4 border-black space-y-6">
          <h3 className="text-2xl font-black uppercase text-black font-display tracking-tight">
            TAMBIÉN TE PUEDE INTERESAR
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                cartItems={cartItems}
                isFavorite={wishlist.some((w) => w.id === rel.id)}
                onAddToCart={(p) => onAddToCart(p, 1)}
                onSelectProduct={onSelectProduct}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
