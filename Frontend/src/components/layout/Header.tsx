import React, { useState } from 'react';
import { Search, ShoppingCart, Shield, LogOut, LogIn, Menu, X } from 'lucide-react';
import type { User } from '../../types/types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);

  const handleLogoClick = (tab: string) => {
    setIsLogoSpinning(true);
    setTimeout(() => setIsLogoSpinning(false), 700);
    setIsMobileMenuOpen(false);
    onNavigate(tab);
  };

  const handleMobileNavigate = (tab: string) => {
    onNavigate(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-purple border-b-4 border-black shadow-brutal-md font-sans transition-colors">
      
      {/* MOBILE COMPACT HEADER (1 SINGLE ROW - 56PX TALL) */}
      <div className="md:hidden px-3 py-2 flex items-center justify-between h-14">
        
        {/* LEFT: MOBILE MENU TOGGLE */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 bg-yellow-200 border-2 border-black shadow-brutal-sm text-black hover:bg-brand-yellow cursor-pointer"
          title="Menú principal"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
        </button>

        {/* CENTER: LOGO */}
        <button
          onClick={() => handleLogoClick('inicio')}
          className="flex items-center gap-2 group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">
            <svg viewBox="0 0 36 36" className={`w-10 h-10 transition-transform duration-700 ease-in-out ${isLogoSpinning ? 'rotate-[360deg]' : 'group-hover:rotate-[180deg]'}`}>
              <circle cx="18" cy="18" r="16" fill="#FDBA74" stroke="#000" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="10.5" fill="#EA580C" fillOpacity="0.15" stroke="#000" strokeWidth="1.2" />
              <circle cx="13.5" cy="13.5" r="2" fill="#000" />
              <circle cx="22.5" cy="13.5" r="2" fill="#000" />
              <circle cx="13.5" cy="22.5" r="2" fill="#000" />
              <circle cx="22.5" cy="22.5" r="2" fill="#000" />
              <line x1="13.5" y1="13.5" x2="22.5" y2="22.5" stroke="#FFF" strokeWidth="1" />
              <line x1="22.5" y1="13.5" x2="13.5" y2="22.5" stroke="#FFF" strokeWidth="1" />
            </svg>
          </div>
          <span className="text-3xl font-henny text-brand-yellow uppercase drop-shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] tracking-wider">
            BUTTONCAT
          </span>
        </button>

        {/* RIGHT: CART BUTTON */}
        <button
          onClick={onOpenCart}
          className="relative p-1.5 bg-white border-2 border-black shadow-brutal-sm hover:bg-brand-cyan transition-all cursor-pointer"
          title="Ver carrito"
        >
          <ShoppingCart className="w-5 h-5 text-black stroke-[2.5]" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand-orange text-white border-2 border-black rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center shadow-brutal-sm">
              {cartCount}
            </span>
          )}
        </button>

      </div>

      {/* MOBILE EXPANDABLE MENU & SEARCH DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-purple border-t-2 border-black p-4 space-y-3 shadow-brutal-lg animate-in slide-in-from-top-2">
          {/* SEARCH BAR */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar stickers, aros, collares..."
              className="w-full border-2 border-black px-3 py-2 text-xs font-bold text-black bg-white focus:outline-none pr-10 shadow-brutal-sm"
            />
            <button 
              onClick={() => handleMobileNavigate('catalogo')}
              className="absolute right-0 top-0 bottom-0 px-3 bg-brand-yellow border-2 border-black flex items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4 text-black stroke-[3]" />
            </button>
          </div>

          {/* MOBILE NAV BUTTONS */}
          <div className="grid grid-cols-2 gap-2 text-xs font-black uppercase">
            <button
              onClick={() => handleMobileNavigate('inicio')}
              className={`py-2 px-3 border-2 border-black ${currentTab === 'inicio' ? 'bg-brand-yellow' : 'bg-white'}`}
            >
              INICIO
            </button>

            <button
              onClick={() => handleMobileNavigate('catalogo')}
              className={`py-2 px-3 border-2 border-black ${currentTab === 'catalogo' ? 'bg-brand-cyan' : 'bg-white'}`}
            >
              CATÁLOGO
            </button>

            <button
              onClick={() => handleMobileNavigate('personalizar')}
              className={`py-2 px-3 border-2 border-black ${currentTab === 'personalizar' ? 'bg-brand-pink text-white' : 'bg-pink-200'}`}
            >
              ✨ STUDIO
            </button>

            <button
              onClick={() => handleMobileNavigate('premios')}
              className={`py-2 px-3 border-2 border-black ${currentTab === 'premios' ? 'bg-brand-purple text-white font-black' : 'bg-purple-200'}`}
            >
              PREMIOS
            </button>

            {currentUser && (
              <button
                onClick={() => handleMobileNavigate('perfil')}
                className={`py-2 px-3 border-2 border-black ${currentTab === 'perfil' ? 'bg-black text-white' : 'bg-white'}`}
              >
                MI PERFIL
              </button>
            )}

            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                onClick={() => handleMobileNavigate('admin')}
                className="py-2 px-3 border-2 border-black bg-brand-yellow text-black flex items-center justify-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" /> ADMIN
              </button>
            )}

            {currentUser ? (
              <button
                onClick={onLogout}
                className="py-2 px-3 border-2 border-black bg-red-400 text-white flex items-center justify-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> SALIR
              </button>
            ) : (
              <button
                onClick={() => { onOpenAuthModal(); setIsMobileMenuOpen(false); }}
                className="py-2 px-3 border-2 border-black bg-brand-yellow text-black flex items-center justify-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" /> INGRESAR
              </button>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP FULL HEADER (HIDDEN ON MOBILE) */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center justify-between gap-4 flex-wrap">
        
        {/* LOGO */}
        <button
          onClick={() => handleLogoClick('inicio')}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">
            <svg viewBox="0 0 36 36" className={`w-10 h-10 transition-transform duration-700 ease-in-out ${isLogoSpinning ? 'rotate-[360deg]' : 'group-hover:rotate-[180deg]'}`}>
              {/* Outer Button Circle */}
              <circle cx="18" cy="18" r="16" fill="#FDBA74" stroke="#000" strokeWidth="2.5" />
              {/* Inner Concave Groove */}
              <circle cx="18" cy="18" r="10.5" fill="#EA580C" fillOpacity="0.15" stroke="#000" strokeWidth="1.2" strokeOpacity="0.4" />
              {/* 4 Centered Holes with Recessed Depth Effect */}
              <circle cx="13.5" cy="13.5" r="2.2" fill="#9A3412" />
              <circle cx="13.5" cy="13.5" r="1.6" fill="#000000" />
              
              <circle cx="22.5" cy="13.5" r="2.2" fill="#9A3412" />
              <circle cx="22.5" cy="13.5" r="1.6" fill="#000000" />

              <circle cx="13.5" cy="22.5" r="2.2" fill="#9A3412" />
              <circle cx="13.5" cy="22.5" r="1.6" fill="#000000" />

              <circle cx="22.5" cy="22.5" r="2.2" fill="#9A3412" />
              <circle cx="22.5" cy="22.5" r="1.6" fill="#000000" />

              {/* Thread Stitches (+) */}
              <line x1="13.5" y1="13.5" x2="22.5" y2="22.5" stroke="#FFF" strokeWidth="1" strokeOpacity="0.85" strokeLinecap="round" />
              <line x1="22.5" y1="13.5" x2="13.5" y2="22.5" stroke="#FFF" strokeWidth="1" strokeOpacity="0.85" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-2xl sm:text-3xl font-henny text-brand-yellow uppercase group-hover:text-white transition-colors drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            BUTTONCAT
          </span>
        </button>

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-md min-w-[220px]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar stickers, aros, collares..."
              className="w-full border-2 border-black px-3.5 py-1.5 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 pr-10 shadow-brutal-sm"
            />
            <button 
              onClick={() => onNavigate('catalogo')}
              className="absolute right-0 top-0 bottom-0 px-2.5 bg-brand-yellow border-2 border-black hover:bg-brand-orange hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Buscar"
            >
              <Search className="w-4 h-4 text-black stroke-[3]" />
            </button>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-black tracking-wide uppercase flex-wrap">
          <button
            onClick={() => onNavigate('inicio')}
            className={`px-3.5 py-1.5 border-2 border-black transition-all cursor-pointer ${
              currentTab === 'inicio'
                ? 'bg-brand-yellow text-black shadow-brutal ring-2 ring-black font-black'
                : 'bg-yellow-200 text-black shadow-brutal-sm hover:bg-brand-yellow'
            }`}
          >
            INICIO
          </button>

          <button
            onClick={() => onNavigate('catalogo')}
            className={`px-3.5 py-1.5 border-2 border-black transition-all cursor-pointer ${
              currentTab === 'catalogo'
                ? 'bg-brand-cyan text-black shadow-brutal ring-2 ring-black font-black'
                : 'bg-cyan-200 text-black shadow-brutal-sm hover:bg-brand-cyan'
            }`}
          >
            CATÁLOGO
          </button>

          <button
            onClick={() => onNavigate('personalizar')}
            className={`px-3.5 py-1.5 border-2 border-black transition-all cursor-pointer ${
              currentTab === 'personalizar'
                ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black font-black'
                : 'bg-pink-300 text-black shadow-brutal-sm hover:bg-brand-pink hover:text-white'
            }`}
          >
            PERSONALIZAR
          </button>

          <button
            onClick={() => onNavigate('premios')}
            className={`relative px-3.5 py-1.5 border-2 border-black transition-all cursor-pointer ${
              currentTab === 'premios'
                ? 'bg-brand-purple text-white shadow-brutal ring-2 ring-black font-black'
                : 'bg-purple-200 text-black shadow-brutal-sm hover:bg-brand-purple hover:text-white'
            }`}
          >
            PREMIOS
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('perfil')}
              className={`px-3.5 py-1.5 border-2 border-black transition-all cursor-pointer ${
                currentTab === 'perfil'
                  ? 'bg-white text-black shadow-brutal ring-2 ring-black font-black'
                  : 'bg-gray-100 text-black shadow-brutal-sm hover:bg-white'
              }`}
            >
              MI PERFIL
            </button>
          )}
        </nav>

        {/* ACTIONS: ADMIN PANEL, AUTH, CART */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* ADMIN BADGE (IF ROLE IS ADMIN) */}
          {currentUser && currentUser.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-black text-brand-yellow ring-2 ring-brand-yellow shadow-brutal'
                  : 'bg-brand-yellow text-black hover:bg-black hover:text-white shadow-brutal-sm'
              }`}
            >
              <Shield className="w-4 h-4 stroke-[2.5]" />
              <span>⚡ PANEL ADMIN</span>
            </button>
          )}

          {/* USER AUTH BUTTONS */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLogout}
                className="p-2 bg-white border-2 border-black text-black hover:bg-red-500 hover:text-white transition-all shadow-brutal-sm cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 bg-brand-yellow text-black border-2 border-black text-xs font-black uppercase hover:bg-brand-orange hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>INGRESAR</span>
            </button>
          )}

          {/* CART BUTTON */}
          <button
            onClick={onOpenCart}
            className="relative p-2 bg-white border-2 border-black shadow-brutal-sm hover:bg-brand-cyan transition-all active:translate-y-0.5 cursor-pointer"
            title="Ver carrito de compras"
          >
            <ShoppingCart className="w-5 h-5 text-black stroke-[2.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-orange text-white border-2 border-black rounded-full w-5 h-5 text-xs font-black flex items-center justify-center shadow-brutal-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
