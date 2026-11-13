import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Sparkles, ChevronLeft, ChevronRight, AlertTriangle, Minus, Square, X } from 'lucide-react';
import type { Product, CartItem } from '../types/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductCard } from '../components/catalog/ProductCard';
import { ValidationModal } from '../components/ui/ValidationModal';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  featuredProducts: Product[];
  wishlist?: Product[];
  cartItems?: CartItem[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

const HERO_COLORS = [
  { id: 'pink', name: 'ROSA NEÓN', bg: '#FF007F', thread: '#FFFFFF' },
  { id: 'cyan', name: 'CYAN', bg: '#06B6D4', thread: '#000000' },
  { id: 'yellow', name: 'AMARILLO', bg: '#FACC15', thread: '#000000' },
  { id: 'purple', name: 'VIOLETA', bg: '#7E22CE', thread: '#FFFFFF' },
  { id: 'black', name: 'DARK', bg: '#18181B', thread: '#FACC15' },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  featuredProducts,
  wishlist = [],
  cartItems = [],
  onAddToCart,
  onSelectProduct,
  onToggleFavorite,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(1);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [modalData, setModalData] = useState<{ title?: string; message: string } | null>(null);

  // HERO INTERACTIVE BUTTON MAKER STATE
  const [heroColorId, setHeroColorId] = useState<string>('pink');
  const [isHeroSpinning, setIsHeroSpinning] = useState<boolean>(false);

  const heroColorConfig = HERO_COLORS.find((c) => c.id === heroColorId) || HERO_COLORS[0];

  const handleSpinHeroButton = () => {
    setIsHeroSpinning(true);
    setTimeout(() => setIsHeroSpinning(false), 700);
  };

  // TOUCH SWIPE STATES FOR MOBILE CAROUSEL DRAGGING
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // TOP FEATURED ITEMS FOR CAROUSEL (MAX 12 FOR CLEAN SPACING & INDICATORS)
  const displayProducts = featuredProducts.length > 0 ? featuredProducts.slice(0, 12) : [];
  const totalItems = displayProducts.length;
  const centerIndex = totalItems > 0 ? ((activeIndex % totalItems) + totalItems) % totalItems : 0;

  // AUTO-PLAY TIMER (RESETS ON EVERY MANUAL STEP WITH ZERO LOCKING OR PAUSE STATE)
  useEffect(() => {
    if (totalItems === 0) return;
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }, 5000);
    return () => clearTimeout(timer);
  }, [totalItems, activeIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalItems);
  };

  // TOUCH SWIPE HANDLERS FOR MOBILE DEVICES
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const distance = touchStartX - touchEndX;
      if (distance > 40) {
        handleNext(); // Deslizó hacia la izquierda -> Siguiente producto
      } else if (distance < -40) {
        handlePrev(); // Deslizó hacia la derecha -> Producto anterior
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div className="space-y-10 sm:space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative w-full bg-brand-yellow border-b-3 border-black p-4 sm:p-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* LEFT COLUMN: TEXT CONTENT */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 z-10 text-center sm:text-left">
            
            {/* BADGE */}
            <div className="inline-block">
              <Badge variant="orange" className="text-xs sm:text-sm py-1 px-3 sm:px-4 shadow-brutal-sm">
                LA REVOLUCIÓN DEL BOTÓN HA LLEGADO
              </Badge>
            </div>

            {/* HEADLINE */}
            <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-black font-display leading-[1.05]">
              BOTONES CON <br className="hidden xs:inline" />
              <span className="inline-block bg-brand-yellowLight border-3 border-black px-2.5 sm:px-3 py-1 shadow-brutal mt-1">
                ACTITUD.
              </span>
            </h1>

            {/* DESCRIPTION BOX */}
            <div className="border-3 border-black bg-white p-3.5 sm:p-5 shadow-brutal max-w-md mx-auto sm:mx-0">
              <p className="text-xs sm:text-base font-extrabold text-black leading-relaxed">
                Olvida lo aburrido. Tenemos la mercería más chillona, ruidosa y espectacular del multiverso. Botones, pines y actitud a raudales.
              </p>
            </div>

            {/* CTA BUTTONS (DUAL CALL TO ACTION) */}
            <div className="pt-1 flex flex-col xs:flex-row gap-2 justify-center sm:justify-start">
              <Button
                variant="purple"
                size="lg"
                onClick={() => onNavigate('catalogo')}
                className="w-full xs:w-auto text-xs xs:text-sm sm:text-base px-5 sm:px-8 py-3.5 sm:py-4 shadow-brutal-md sm:shadow-brutal-lg font-black"
              >
                COMPRAR AHORA <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5" />
              </Button>
              <Button
                variant="pink"
                size="lg"
                onClick={() => onNavigate('personalizar')}
                className="w-full xs:w-auto text-xs xs:text-sm sm:text-base px-5 sm:px-8 py-3.5 sm:py-4 shadow-brutal-md sm:shadow-brutal-lg font-black"
              >
                CREAR EN STUDIO <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5" />
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: COLLAGE / PHOTO FRAMES */}
          <div className="lg:col-span-6 relative flex justify-center items-center mt-2 lg:mt-0">
            {/* MOBILE INNOVATIVE INTERACTIVE BUTTON MAKER WIDGET */}
            <div className="sm:hidden w-full max-w-sm mx-auto my-2 border-3 border-black bg-white shadow-brutal-lg overflow-hidden font-sans">
              
              {/* RETRO WINDOW TITLE BAR */}
              <div className="bg-brand-purple text-white px-3 py-1.5 flex items-center justify-between border-b-3 border-black select-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-brand-yellow shrink-0 stroke-[2.5]" />
                  <span className="text-[10px] font-mono font-black tracking-wider uppercase truncate">
                    BUTTONCAT_STUDIO_MINI.EXE
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-3.5 h-3.5 bg-brand-yellow border border-black flex items-center justify-center text-[8px] font-black text-black">_</div>
                  <div className="w-3.5 h-3.5 bg-brand-yellow border border-black flex items-center justify-center text-[8px] font-black text-black">□</div>
                  <div className="w-3.5 h-3.5 bg-brand-pink border border-black flex items-center justify-center text-[8px] font-black text-white">✕</div>
                </div>
              </div>

              {/* INTERACTIVE WORKSPACE */}
              <div className="p-3 bg-yellow-50/70 flex flex-col items-center space-y-2.5">
                
                {/* STATUS BAR */}
                <div className="flex items-center justify-between w-full text-[9px] font-black uppercase">
                  <span className="bg-brand-yellow text-black px-2 py-0.5 border border-black shadow-brutal-xs">
                    ✦ PROBADOR INTERACTIVO
                  </span>
                  <span className="text-gray-600 font-mono">
                    TOCA PARA GIRAR
                  </span>
                </div>

                {/* TAPPABLE ROTATABLE BUTTONCAT PIN */}
                <div 
                  onClick={handleSpinHeroButton}
                  className="relative cursor-pointer group py-0.5 active:scale-95 transition-transform"
                  title="¡Toca para girar el botón!"
                >
                  <div className={`w-24 h-24 xs:w-26 xs:h-26 flex items-center justify-center drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-transform duration-700 ease-in-out ${isHeroSpinning ? 'rotate-360 scale-105' : 'hover:rotate-12'}`}>
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      {/* Outer Rim */}
                      <circle cx="18" cy="18" r="16" fill={heroColorConfig.bg} stroke="#000" strokeWidth="2.5" />
                      {/* Inner Groove */}
                      <circle cx="18" cy="18" r="10.5" fill="#000" fillOpacity="0.14" stroke="#000" strokeWidth="1.2" strokeOpacity="0.35" />
                      {/* 4 Holes */}
                      <circle cx="13.5" cy="13.5" r="2.2" fill="#000" />
                      <circle cx="22.5" cy="13.5" r="2.2" fill="#000" />
                      <circle cx="13.5" cy="22.5" r="2.2" fill="#000" />
                      <circle cx="22.5" cy="22.5" r="2.2" fill="#000" />
                      {/* Thread Stitches (+) */}
                      <line x1="13.5" y1="13.5" x2="22.5" y2="22.5" stroke={heroColorConfig.thread} strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="22.5" y1="13.5" x2="13.5" y2="22.5" stroke={heroColorConfig.thread} strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="absolute -bottom-1 -right-2 bg-brand-yellow text-black border-2 border-black px-1.5 py-0.5 text-[8px] font-black uppercase shadow-brutal-xs flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> {heroColorConfig.name}
                  </div>
                </div>

                {/* COLOR PICKER CHIPS */}
                <div className="w-full space-y-1">
                  <span className="text-[9px] font-black uppercase text-black block text-center">
                    COLOR DE TU BOTÓN:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {HERO_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setHeroColorId(c.id);
                          setIsHeroSpinning(true);
                          setTimeout(() => setIsHeroSpinning(false), 500);
                        }}
                        className={`w-6 h-6 xs:w-7 xs:h-7 border-2 border-black transition-all shadow-brutal-xs cursor-pointer ${
                          heroColorId === c.id ? 'ring-2 ring-black scale-110 shadow-brutal-sm' : 'hover:scale-105 opacity-90'
                        }`}
                        style={{ backgroundColor: c.bg }}
                        title={`Color ${c.name}`}
                      />
                    ))}
                  </div>
                </div>

                {/* QUICK CATEGORY SHORTCUTS */}
                <div className="w-full pt-1.5 border-t border-black/15 flex items-center justify-center gap-1.5 flex-wrap">
                  {['PINES', 'STICKERS', 'PARCHES', 'AROS'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onNavigate('catalogo')}
                      className="bg-white hover:bg-brand-yellow text-black text-[9px] font-black uppercase px-2 py-0.5 border border-black shadow-brutal-xs cursor-pointer transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* DESKTOP/TABLET MULTI-FRAME COLLAGE */}
            <div className="hidden sm:flex relative justify-center items-center min-h-95 w-full">
              {/* PURPLE BACKDROP PANEL */}
              <div className="absolute right-0 top-6 w-4/5 h-4/5 bg-brand-purple border-3 border-black shadow-brutal-xl" />

              {/* MAIN PHOTO FRAME */}
              <div className="relative z-10 w-72 sm:w-80 h-64 sm:h-72 border-3 border-black bg-white shadow-brutal overflow-hidden transform hover:rotate-1 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop"
                  alt="Chicos vistiendo pines y actitud"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>

              {/* TILTED SECONDARY PHOTO FRAME */}
              <div className="absolute left-2 sm:left-6 bottom-0 z-20 w-48 sm:w-56 h-40 sm:h-48 border-3 border-black bg-white shadow-brutal overflow-hidden transform -rotate-6 hover:rotate-0 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop"
                  alt="Detalle de pines y parches"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* FLOATING STAR BADGE */}
              <div className="absolute top-0 right-2 z-30 w-14 h-14 bg-brand-cyan border-3 border-black rounded-full shadow-brutal flex items-center justify-center animate-bounce">
                <Star className="w-8 h-8 text-black fill-black" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MUST HAVES SECTION */}
      <section className="max-w-7xl mx-auto px-4">
        
        {/* HEADER BAR */}
        <div className="flex flex-wrap items-end justify-between border-b-4 border-black pb-4 mb-8 gap-4">
          <div>
            <span className="bg-black text-white text-xs font-black uppercase px-2.5 py-1 tracking-widest inline-block mb-2">
              (ﾐ^ᆽ^ﾐ)
            </span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase text-black font-display tracking-tight leading-none">
              PRODUCTOS DESTACADOS
            </h2>
          </div>

          <button
            onClick={() => onNavigate('catalogo')}
            className="group flex items-center gap-2 font-black uppercase text-sm border-b-2 border-black pb-0.5 hover:text-brand-purple transition-colors cursor-pointer"
          >
            VER TODO EL CATÁLOGO{' '}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* RETRO WINDOWS WINDOW CONTAINER FOR FEATURED PRODUCTS */}
        <div className="border-4 border-black bg-white shadow-brutal-xl overflow-hidden font-sans">
          
          {/* WINDOW TITLE BAR */}
          <div className="bg-brand-purple text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center justify-between border-b-4 border-black select-none gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-yellow shrink-0 stroke-2.5" />
              <span className="text-[10px] xs:text-xs sm:text-sm font-black tracking-wider uppercase font-mono truncate max-w-37.5 xs:max-w-55 sm:max-w-none">
                C:\BUTTONCAT\PRODUCTOS_DESTACADOS.EXE
              </span>
            </div>

            {/* RETRO WINDOW CONTROLS (_ [] X) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                className="w-5 h-5 sm:w-6 sm:h-6 bg-brand-yellow border-2 border-black text-black font-black text-[10px] sm:text-xs flex items-center justify-center hover:bg-white transition-colors shadow-brutal-sm cursor-pointer active:scale-95"
                title="Minimizar"
              >
                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-3" />
              </button>
              <button
                type="button"
                className="w-5 h-5 sm:w-6 sm:h-6 bg-brand-yellow border-2 border-black text-black font-black text-[10px] sm:text-xs flex items-center justify-center hover:bg-white transition-colors shadow-brutal-sm cursor-pointer active:scale-95"
                title="Maximizar"
              >
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-2.5" />
              </button>
              <button
                type="button"
                className="w-5 h-5 sm:w-6 sm:h-6 bg-brand-pink border-2 border-black text-white font-black text-[10px] sm:text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-brutal-sm cursor-pointer active:scale-95"
                title="Cerrar"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-3" />
              </button>
            </div>
          </div>

          {/* WINDOW MENU & DYNAMIC STATUS BAR */}
          <div className="bg-gray-100 px-2.5 sm:px-3.5 py-1 sm:py-1.5 border-b-3 border-black flex items-center justify-between text-[10px] sm:text-xs font-bold text-black font-mono flex-wrap gap-1.5 sm:gap-2 select-none">
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <span className="hover:bg-brand-purple hover:text-white px-1 sm:px-1.5 py-0.5 transition-colors cursor-pointer"><u>A</u>rchivo</span>
              <span className="hover:bg-brand-purple hover:text-white px-1 sm:px-1.5 py-0.5 transition-colors cursor-pointer"><u>E</u>dición</span>
              <span className="hover:bg-brand-purple hover:text-white px-1 sm:px-1.5 py-0.5 transition-colors cursor-pointer"><u>V</u>er</span>
              <span className="hover:bg-brand-purple hover:text-white px-1 sm:px-1.5 py-0.5 transition-colors cursor-pointer"><u>A</u>yuda</span>
            </div>
            <div className="sm:hidden text-[10px] font-mono font-bold text-gray-700">
              CATÁLOGO VIRTUAL
            </div>

            {/* DYNAMIC PRODUCT STATUS BADGE (GREEN WHEN HAS PRODUCTS, RED WHEN 0 PRODUCTS) */}
            {totalItems > 0 ? (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[11px] font-mono font-extrabold bg-emerald-100 text-emerald-950 px-2 sm:px-3 py-0.5 sm:py-1 border-2 border-black shadow-brutal-sm">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse shrink-0" />
                <span>ESTADO: ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[11px] font-mono font-black bg-red-100 text-red-900 px-2 sm:px-3 py-0.5 sm:py-1 border-2 border-black shadow-brutal-sm">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-600 rounded-full inline-block animate-ping shrink-0" />
                <span>ESTADO: SIN PRODUCTOS</span>
              </div>
            )}
          </div>

          {/* WINDOW MAIN BODY / CAROUSEL CANVAS */}
          <div className="p-2.5 sm:p-5 bg-brand-yellowLight">
            {totalItems === 0 ? (
              <div className="bg-white border-3 border-black p-6 sm:p-10 text-center shadow-brutal space-y-3">
                <div className="w-14 h-14 bg-red-100 border-2 border-black rounded-full flex items-center justify-center mx-auto shadow-brutal-sm">
                  <AlertTriangle className="w-7 h-7 text-red-600 stroke-2" />
                </div>
                <h5 className="text-base font-black uppercase text-black font-display tracking-tight">
                  NO HAY PRODUCTOS DESTACADOS PARA MOSTRAR
                </h5>
                <p className="text-xs font-bold text-gray-600 max-w-md mx-auto leading-relaxed">
                  Visita el catálogo completo para explorar todos nuestros pines, parches, accesorios y botones.
                </p>
              </div>
            ) : (
              /* 3D FISHEYE CAROUSEL CONTAINER */
              <div 
                className="relative px-1 sm:px-12 py-3 sm:py-4 overflow-hidden min-h-95 sm:min-h-125 flex flex-col items-center justify-center select-none bg-white border-3 border-black shadow-brutal"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* LEFT NAVIGATION ARROW */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-3.5 bg-brand-yellow text-black border-2 sm:border-3 border-black shadow-brutal hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Producto anterior"
                  aria-label="Producto anterior"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 stroke-3" />
                </button>

                {/* FISHEYE CAROUSEL TRACK */}
                <div className="relative w-full max-w-5xl h-97.5 sm:h-115 flex items-center justify-center">
                  {displayProducts.map((product, idx) => {
                    let diff = idx - centerIndex;
                    if (diff > totalItems / 2) diff -= totalItems;
                    if (diff < -totalItems / 2) diff += totalItems;

                    const isCenter = diff === 0;
                    const isLeft = diff === -1;
                    const isRight = diff === 1;
                    const isVisible = isCenter || isLeft || isRight;

                    let translateX = '-50%';
                    let scale = 1;
                    let opacity = 1;
                    let zIndex = 10;
                    let pointerEvents: 'auto' | 'none' = 'none';

                    if (isCenter) {
                      translateX = '-50%';
                      scale = 1.02;
                      opacity = 1;
                      zIndex = 30;
                      pointerEvents = 'auto';
                    } else if (isLeft) {
                      translateX = 'calc(-50% - 105%)';
                      scale = 0.82;
                      opacity = 0.5;
                      zIndex = 20;
                      pointerEvents = 'auto';
                    } else if (isRight) {
                      translateX = 'calc(-50% + 105%)';
                      scale = 0.82;
                      opacity = 0.5;
                      zIndex = 20;
                      pointerEvents = 'auto';
                    } else {
                      translateX = diff > 0 ? 'calc(-50% + 180%)' : 'calc(-50% - 180%)';
                      scale = 0.7;
                      opacity = 0;
                      zIndex = 0;
                      pointerEvents = 'none';
                    }

                    return (
                      <div
                        key={product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isVisible) {
                            onSelectProduct(product);
                          }
                        }}
                        style={{
                          transform: `translate3d(${translateX}, -50%, 0) scale(${scale})`,
                          opacity: opacity,
                          zIndex: zIndex,
                          pointerEvents: pointerEvents,
                          transition: 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 500ms ease',
                        }}
                        className={`absolute w-55 xs:w-65 sm:w-77.5 md:w-82.5 top-1/2 left-1/2 ${
                          isVisible ? 'cursor-pointer hover:opacity-100' : ''
                        }`}
                      >
                        <ProductCard
                          product={product}
                          cartItems={cartItems}
                          isFavorite={wishlist.some((w) => w.id === product.id)}
                          onAddToCart={onAddToCart}
                          onSelectProduct={onSelectProduct}
                          onToggleFavorite={onToggleFavorite}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT NAVIGATION ARROW */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-0.5 sm:right-3 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-3.5 bg-brand-yellow text-black border-2 sm:border-3 border-black shadow-brutal hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Producto siguiente"
                  aria-label="Producto siguiente"
                >
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 stroke-3" />
                </button>

                {/* DOT INDICATORS FOR DIRECT NAVIGATION & VISUAL FEEDBACK */}
                <div className="mt-4 sm:mt-8 z-40 flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap">
                  {displayProducts.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(i);
                      }}
                      className={`h-2.5 sm:h-3 transition-all border-2 border-black cursor-pointer shadow-brutal-sm ${
                        i === centerIndex
                          ? 'w-6 sm:w-10 bg-brand-yellow'
                          : 'w-2.5 sm:w-4 bg-white hover:bg-yellow-200'
                      }`}
                      title={`Ir al producto ${i + 1}`}
                      aria-label={`Ir al producto ${i + 1}`}
                    />
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* WINDOW FOOTER / STATUS BAR */}
          <div className="bg-gray-100 px-2.5 sm:px-3.5 py-1.5 border-t-3 border-black flex items-center justify-between text-[9px] xs:text-[10px] sm:text-[11px] font-mono text-black font-extrabold select-none flex-wrap gap-1">
            <span>TOTAL: {totalItems} PRODUCTOS DESTACADOS</span>
            <span>BUTTONCAT OS</span>
          </div>

        </div>

      </section>

      {/* ÚNETE AL CAOS BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border-3 border-black bg-brand-yellow p-5 sm:p-12 shadow-brutal-lg sm:shadow-brutal-xl relative overflow-hidden">
          
          <div className="max-w-2xl space-y-3 sm:space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-6xl font-black uppercase text-black font-display tracking-tight leading-none">
              ÚNETE AL CAOS
            </h2>

            <div className="border-l-4 border-black pl-3 sm:pl-4">
              <p className="text-xs sm:text-base font-extrabold text-black leading-relaxed">
                Recibe drops exclusivos, descuentos ilegales y novedades directamente en tu bandeja de entrada. Cero spam, solo puras vibras.
              </p>
            </div>

            {/* FORM */}
            <form 
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!newsletterEmail.trim()) {
                  setModalData({ title: 'CAMPO OBLIGATORIO REQUERIDO', message: 'Por favor, ingresa tu correo electrónico para suscribirte.' });
                } else {
                  setModalData({ title: '¡BIENVENIDO AL CAOS!', message: '¡Te has suscrito exitosamente a la newsletter de Buttoncat! Te enviamos una confirmación.' });
                  setNewsletterEmail('');
                }
              }}
              className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-4 max-w-lg"
            >
              <input
                id="home-newsletter-email"
                name="newsletterEmail"
                aria-label="Correo electrónico para boletín de novedades"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 border-3 border-black px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none shadow-brutal-sm"
              />
              <Button variant="purple" size="md" type="submit" className="px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-black">
                ENTRAR
              </Button>
            </form>

            

            <p className="text-[10px] sm:text-xs font-black text-black pt-1 sm:pt-2 tracking-wide uppercase">
              * PROMETEMOS NO VENDER TUS DATOS A ALIENÍGENAS.
            </p>
          </div>

          <Sparkles className="hidden sm:block absolute right-6 bottom-6 w-32 h-32 text-black/10 pointer-events-none" />

        </div>

        {/* VALIDATION / NOTIFICATION MODAL */}
        <ValidationModal
          isOpen={!!modalData}
          title={modalData?.title}
          message={modalData?.message || ''}
          onClose={() => setModalData(null)}
        />
      </section>

    </div>
  );
};
