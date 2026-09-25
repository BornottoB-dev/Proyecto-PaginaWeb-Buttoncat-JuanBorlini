import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductCard } from '../components/catalog/ProductCard';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  featuredProducts: Product[];
  wishlist?: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  featuredProducts,
  wishlist = [],
  onAddToCart,
  onSelectProduct,
  onToggleFavorite,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [userInteractionCount, setUserInteractionCount] = useState<number>(0);

  // TOUCH SWIPE STATES FOR MOBILE CAROUSEL DRAGGING
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // TOP FEATURED ITEMS FOR CAROUSEL (MAX 12 FOR CLEAN SPACING & INDICATORS)
  const displayProducts = featuredProducts.length > 0 ? featuredProducts.slice(0, 12) : [];
  const totalItems = displayProducts.length;
  const centerIndex = totalItems > 0 ? ((activeIndex % totalItems) + totalItems) % totalItems : 0;

  // AUTO-PLAY TIMER (RESETS ON EVERY MANUAL STEP OR INTERACTION TO PREVENT CONFLICTS)
  useEffect(() => {
    if (isPaused || totalItems === 0) return;
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isPaused, totalItems, activeIndex, userInteractionCount]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setUserInteractionCount((c) => c + 1);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % totalItems);
    setUserInteractionCount((c) => c + 1);
  };

  // TOUCH SWIPE HANDLERS FOR MOBILE DEVICES
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
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
    <div className="space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative w-full bg-brand-yellow border-b-3 border-black p-6 sm:p-12 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT COLUMN: TEXT CONTENT */}
          <div className="lg:col-span-6 space-y-6 z-10">
            
            {/* BADGE */}
            <div className="inline-block">
              <Badge variant="orange" className="text-sm py-1 px-4 shadow-brutal-sm">
                LA REVOLUCIÓN DEL BOTÓN HA LLEGADO
              </Badge>
            </div>

            {/* HEADLINE */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-black font-display leading-none">
              BOTONES CON <br />
              <span className="inline-block bg-brand-yellowLight border-3 border-black px-3 py-1 shadow-brutal mt-1">
                ACTITUD.
              </span>
            </h1>

            {/* DESCRIPTION BOX */}
            <div className="border-3 border-black bg-white p-5 shadow-brutal max-w-md">
              <p className="text-sm sm:text-base font-extrabold text-black leading-relaxed">
                Olvida lo aburrido. Tenemos la mercería más chillona, ruidosa y espectacular del multiverso. Botones, pines y actitud a raudales.
              </p>
            </div>

            {/* CTA BUTTON */}
            <div>
              <Button
                variant="purple"
                size="lg"
                onClick={() => onNavigate('catalogo')}
                className="text-base px-8 py-4 shadow-brutal-lg"
              >
                COMPRAR AHORA
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: COLLAGE / PHOTO FRAMES */}
          <div className="lg:col-span-6 relative flex justify-center items-center min-h-[380px] mt-6 lg:mt-0">
            
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

        {/* 3D FISHEYE CAROUSEL CONTAINER (WITH TOUCH SWIPE FOR MOBILE) */}
        <div 
          className="relative px-2 sm:px-12 py-4 overflow-hidden min-h-[480px] sm:min-h-[500px] flex flex-col items-center justify-center select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* LEFT NAVIGATION ARROW */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3.5 bg-brand-yellow text-black border-3 border-black shadow-brutal hover:bg-white hover:scale-110 active:translate-y-0.5 transition-all cursor-pointer"
            title="Producto anterior"
            aria-label="Producto anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </button>

          {/* FISHEYE CAROUSEL TRACK */}
          {totalItems > 0 && (
            <div className="relative w-full max-w-5xl h-[420px] sm:h-[460px] flex items-center justify-center">
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
                  scale = 1.05;
                  opacity = 1;
                  zIndex = 30;
                  pointerEvents = 'auto';
                } else if (isLeft) {
                  translateX = 'calc(-50% - 105%)';
                  scale = 0.88;
                  opacity = 0.75;
                  zIndex = 20;
                  pointerEvents = 'auto';
                } else if (isRight) {
                  translateX = 'calc(-50% + 105%)';
                  scale = 0.88;
                  opacity = 0.75;
                  zIndex = 20;
                  pointerEvents = 'auto';
                } else {
                  translateX = diff > 0 ? 'calc(-50% + 190%)' : 'calc(-50% - 190%)';
                  scale = 0.75;
                  opacity = 0;
                  zIndex = 0;
                  pointerEvents = 'none';
                }

                return (
                  <div
                    key={product.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCenter && isVisible) {
                        setActiveIndex(idx);
                        setUserInteractionCount((c) => c + 1);
                      }
                    }}
                    style={{
                      transform: `translate3d(${translateX}, -50%, 0) scale(${scale})`,
                      opacity: opacity,
                      zIndex: zIndex,
                      pointerEvents: pointerEvents,
                      transition: 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 500ms ease',
                    }}
                    className={`absolute w-[260px] sm:w-[310px] md:w-[330px] top-1/2 left-1/2 ${
                      !isCenter && isVisible ? 'cursor-pointer hover:opacity-100' : ''
                    }`}
                  >
                    <ProductCard
                      product={product}
                      isFavorite={wishlist.some((w) => w.id === product.id)}
                      onAddToCart={onAddToCart}
                      onSelectProduct={
                        isCenter
                          ? onSelectProduct
                          : () => {
                              setActiveIndex(idx);
                              setUserInteractionCount((c) => c + 1);
                            }
                      }
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* RIGHT NAVIGATION ARROW */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3.5 bg-brand-yellow text-black border-3 border-black shadow-brutal hover:bg-white hover:scale-110 active:translate-y-0.5 transition-all cursor-pointer"
            title="Producto siguiente"
            aria-label="Producto siguiente"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </button>

          {/* DOT INDICATORS FOR DIRECT NAVIGATION & VISUAL FEEDBACK */}
          <div className="mt-6 sm:mt-8 z-40 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {displayProducts.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                  setUserInteractionCount((c) => c + 1);
                }}
                className={`h-3 transition-all border-2 border-black cursor-pointer shadow-brutal-sm ${
                  i === centerIndex
                    ? 'w-8 sm:w-10 bg-brand-yellow'
                    : 'w-3 sm:w-4 bg-white hover:bg-yellow-200'
                }`}
                title={`Ir al producto ${i + 1}`}
                aria-label={`Ir al producto ${i + 1}`}
              />
            ))}
          </div>

        </div>

      </section>

      {/* ÚNETE AL CAOS BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="border-3 border-black bg-brand-yellow p-8 sm:p-12 shadow-brutal-xl relative overflow-hidden">
          
          <div className="max-w-2xl space-y-4 relative z-10">
            <h2 className="text-4xl sm:text-6xl font-black uppercase text-black font-display tracking-tight leading-none">
              ÚNETE AL CAOS
            </h2>

            <div className="border-l-4 border-black pl-4">
              <p className="text-sm sm:text-base font-extrabold text-black">
                Recibe drops exclusivos, descuentos ilegales y novedades directamente en tu bandeja de entrada. Cero spam, solo puras vibras.
              </p>
            </div>

            {/* FORM */}
            <form 
              onSubmit={(e) => { e.preventDefault(); alert('¡Bienvenido al caos de Buttoncat!'); }}
              className="flex flex-col sm:flex-row gap-2 pt-4 max-w-lg"
            >
              <input
                type="email"
                required
                placeholder="tu@email.com"
                className="flex-1 border-3 border-black px-4 py-3 text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
              />
              <Button variant="purple" size="md" type="submit" className="px-8 py-3">
                ENTRAR
              </Button>
            </form>

            <p className="text-xs font-black text-black pt-2 tracking-wide uppercase">
              * PROMETEMOS NO VENDER TUS DATOS A ALIENÍGENAS.
            </p>
          </div>

          <Sparkles className="absolute right-6 bottom-6 w-32 h-32 text-black/10 pointer-events-none" />

        </div>
      </section>

    </div>
  );
};
