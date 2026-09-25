import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, Truck, RefreshCw, Star, SlidersHorizontal, Check, Heart } from 'lucide-react';
import type { Product, CustomizableCategory } from '../types/types';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/catalog/ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  wishlist?: Product[];
  onBackToCatalog: () => void;
  onAddToCart: (product: Product, quantity?: number, selectedOptions?: Record<string, string>) => void;
  onOpenCustomizerStudio: (category: CustomizableCategory) => void;
  onSelectProduct: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  wishlist = [],
  onBackToCatalog,
  onAddToCart,
  onOpenCustomizerStudio,
  onSelectProduct,
  onToggleFavorite,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Standard variation choices based on product category
  const getStandardVariationGroups = () => {
    const cat = product.category;
    if (cat === 'COLLARES') {
      return [
        {
          key: 'largo',
          label: 'LARGO DE LA CADENA',
          options: ['40 cm (Choker)', '45 cm (Standard)', '50 cm (Largo)', '60 cm (XL)'],
        },
        {
          key: 'metal',
          label: 'ACABADO DEL METAL',
          options: ['Plateado Brillante', 'Negro Mate Oxidado', 'Bronce Antique'],
        },
      ];
    }
    if (cat === 'AROS') {
      return [
        {
          key: 'anzuelo',
          label: 'MATERIAL DEL ANZUELO',
          options: ['Acero Quirúrgico 316L', 'Plata 925', 'Clip (Sin Perforación)'],
        },
        {
          key: 'estilo',
          label: 'CONFIGURACIÓN',
          options: ['Par Simétrico (2 iguales)', 'Par Asimétrico', 'Aro Individual'],
        },
      ];
    }
    if (cat === 'REMERAS') {
      return [
        {
          key: 'talle',
          label: 'TALLE DE PRENDA',
          options: ['S', 'M', 'L', 'XL', 'XXL'],
        },
        {
          key: 'color',
          label: 'COLOR DE REMERA',
          options: ['Negro Azabache', 'Blanco Puro', 'Rosa Neobrutal', 'Violeta Neón'],
        },
      ];
    }
    if (cat === 'PINES METÁLICOS') {
      return [
        {
          key: 'tamano',
          label: 'DIÁMETRO DEL PIN',
          options: ['38 mm (Standard)', '55 mm (Grande)', '75 mm (XL Max)'],
        },
        {
          key: 'acabado',
          label: 'ACABADO SUPERFICIAL',
          options: ['Brillante Clásico', 'Mate Soft-Touch', 'Holográfico'],
        },
      ];
    }
    if (cat === 'STICKERS') {
      return [
        {
          key: 'material',
          label: 'MATERIAL',
          options: ['Vinilo Impermeable', 'Holográfico Estelar', 'Metalizado Espejo'],
        },
        {
          key: 'tamano',
          label: 'TAMAÑO',
          options: ['Mini (5 cm)', 'Standard (8 cm)', 'Max XL (12 cm)'],
        },
      ];
    }
    return [
      {
        key: 'variante',
        label: 'OPCIÓN DE EDICIÓN',
        options: ['Edición Standard', 'Edición Limitada Dark'],
      },
    ];
  };

  const variationGroups = getStandardVariationGroups();
  
  // Selected variations state
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variationGroups.forEach((g) => {
      initial[g.key] = g.options[0];
    });
    return initial;
  });

  const handleVariationSelect = (groupKey: string, optionValue: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [groupKey]: optionValue,
    }));
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
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop',
  ];

  // Related products
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const totalPrice = product.price * quantity;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between gap-4 border-b-4 border-black pb-4 flex-wrap">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 bg-white border-3 border-black px-4 py-2 text-xs font-black uppercase text-black hover:bg-brand-yellow transition-all shadow-brutal-sm active:translate-y-0.5"
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
          
          {/* MAIN PHOTO BOX */}
          <div className="relative border-4 border-black bg-white shadow-brutal-xl overflow-hidden aspect-square flex items-center justify-center group">
            {product.badge && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-brand-pink text-white border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider shadow-brutal-sm">
                  {product.badge}
                </span>
              </div>
            )}

            <span className="absolute top-4 right-4 z-10 bg-brand-yellow text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase shadow-brutal-sm">
              STOCK DISPONIBLE
            </span>

            <img
              src={productImages[activeImageIndex] || product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* THUMBNAIL SELECTOR */}
          <div className="flex items-center gap-3">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-20 h-20 border-3 border-black bg-white overflow-hidden transition-all shadow-brutal-sm ${
                  activeImageIndex === idx
                    ? 'ring-4 ring-brand-purple scale-105 shadow-brutal'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
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

            {/* RATING */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-brand-orange">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-orange text-black" />
                ))}
              </div>
              <span className="text-xs font-black text-black">4.9 / 5.0 (124 valoraciones)</span>
            </div>
          </div>

          {/* PRICE DISPLAY */}
          <div className="bg-brand-yellow/30 border-3 border-black p-4 shadow-brutal-sm flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-600 block">
                {product.originalPrice && product.originalPrice > product.price ? '¡OFERTA DESTACADA!' : 'PRECIO UNITARIO'}
              </span>
              {product.originalPrice && product.originalPrice > product.price ? (
                <div className="flex items-baseline gap-3 flex-wrap">
                  {/* PRECIO SIN DESCUENTO TACHADO */}
                  <span className="text-xl font-extrabold text-gray-400 line-through">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                  {/* PRECIO CON DESCUENTO DESTACADO */}
                  <span className="text-4xl font-black text-black font-display bg-brand-yellow px-2 py-0.5 border-2 border-black shadow-brutal-sm">
                    ${product.price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-black text-black font-display">${product.price.toLocaleString()}</span>
              )}
            </div>

            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="bg-brand-pink text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
                ¡OFF -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%!
              </span>
            ) : (
              <span className="bg-brand-pink text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm">
                NEOBRUTAL EDITION
              </span>
            )}
          </div>

          {/* STANDARD VARIATIONS SELECTOR */}
          <div className="space-y-5 border-3 border-black bg-white p-5 shadow-brutal-md">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 text-xs font-black uppercase">
              <SlidersHorizontal className="w-4 h-4 text-brand-purple" />
              <span>SELECCIONAR VARIACIONES ESTÁNDAR</span>
            </div>

            {variationGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <label className="text-xs font-black uppercase text-black block">
                  {group.label}: <span className="text-brand-purple">{selectedVariations[group.key]}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const isSelected = selectedVariations[group.key] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleVariationSelect(group.key, opt)}
                        className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all shadow-brutal-sm ${
                          isSelected
                            ? 'bg-brand-yellow text-black ring-2 ring-black font-black shadow-brutal'
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1 stroke-[3]" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* QUANTITY SELECTOR */}
            <div className="pt-3 border-t-2 border-black space-y-2">
              <label className="text-xs font-black uppercase text-black block">CANTIDAD:</label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border-3 border-black bg-white shadow-brutal-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 bg-gray-100 hover:bg-yellow-200 border-r-2 border-black font-black text-lg text-black transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-black text-base text-black">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 bg-gray-100 hover:bg-yellow-200 border-l-2 border-black font-black text-lg text-black transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-black uppercase text-gray-500">
                  TOTAL: <strong className="text-black font-display text-base">${totalPrice.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* ADD TO CART & FAVORITE ACTIONS */}
            <div className="flex gap-3">
              <Button
                variant="pink"
                size="lg"
                onClick={() => onAddToCart(product, quantity, selectedVariations)}
                className="flex-1 py-4 text-sm tracking-wider"
              >
                <ShoppingBag className="w-5 h-5 mr-2 stroke-[2.5]" />
                AÑADIR AL CARRITO (${totalPrice.toLocaleString()})
              </Button>

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

          {/* DESCRIPTION BOX */}
          <div className="border-3 border-black bg-white p-5 shadow-brutal-md space-y-2">
            <h4 className="text-sm font-black uppercase text-black font-display border-b-2 border-black pb-1">
              DESCRIPCIÓN DEL PRODUCTO
            </h4>
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              {product.description} Confeccionado con los estándares artesanales de Buttoncat, combinando materiales de alta resistencia y acabados metálicos probados. Ideal para regalar o complementar tu outfit neobrutalista cotidiano.
            </p>
          </div>

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
