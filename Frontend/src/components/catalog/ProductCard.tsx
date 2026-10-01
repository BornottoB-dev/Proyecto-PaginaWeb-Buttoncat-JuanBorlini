import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product, CartItem } from '../../types/types';
import { handleProductImageError } from '../../types/types';
import { Badge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  cartItems?: CartItem[];
  isFavorite?: boolean;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartItems,
  isFavorite = false,
  onAddToCart,
  onSelectProduct,
  onToggleFavorite,
}) => {
  const isOutOfStock = product.stock === 0;

  const totalQtyInCart = cartItems
    ? cartItems.filter((item) => item.product.id === product.id).reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  const isMaxStockInCart = !isOutOfStock && product.stock > 0 && totalQtyInCart >= product.stock;
  const isAddDisabled = isOutOfStock || isMaxStockInCart;

  return (
    <div className={`relative border-3 border-black bg-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
      isOutOfStock ? 'opacity-90 bg-gray-50' : ''
    }`}>
      
      {/* BADGE TOP LEFT */}
      {isOutOfStock ? (
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-red-600 text-white border-2 border-black font-black uppercase shadow-brutal-sm">
            AGOTADO
          </Badge>
        </div>
      ) : isMaxStockInCart ? (
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-amber-600 text-white border-2 border-black font-black uppercase shadow-brutal-sm">
            MÁX. EN CARRITO
          </Badge>
        </div>
      ) : (product.badge || product.isUnique) && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className={product.badgeBg || (product.isUnique ? 'bg-brand-purple text-white' : 'bg-brand-orange text-white')}>
            {product.badge || 'PIEZA ÚNICA'}
          </Badge>
        </div>
      )}

      {/* FAVORITE BUTTON TOP RIGHT */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className={`absolute top-3 right-3 z-30 w-8 h-8 sm:w-9 sm:h-9 border-2 border-black flex items-center justify-center transition-all shadow-brutal-sm cursor-pointer ${
            isFavorite
              ? 'bg-brand-pink text-white hover:bg-red-600'
              : 'bg-white text-black hover:bg-pink-100'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] ${
              isFavorite ? 'fill-white text-white' : 'text-black'
            }`}
          />
        </button>
      )}

      {/* PRODUCT IMAGE WITH OVERLAY FOR OUT OF STOCK */}
      <div 
        className="relative w-full h-36 sm:h-56 bg-gray-100 border-b-3 border-black overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct && onSelectProduct(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          onError={handleProductImageError}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
        />

        {/* OUT OF STOCK OVERLAY BANNER */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 p-2 text-center backdrop-blur-[1px] pointer-events-none">
            <span className="bg-red-600 text-white text-xs sm:text-sm font-black uppercase px-3 py-1.5 border-2 border-black shadow-brutal-md -rotate-3 pointer-events-auto">
              SIN STOCK DISPONIBLE
            </span>
          </div>
        )}
      </div>

      {/* CONTENT BODY */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between bg-white space-y-2">
        <div>
          <h3 
            className="text-xs sm:text-lg font-black uppercase tracking-tight text-black line-clamp-1 cursor-pointer hover:text-brand-purple transition-colors"
            onClick={() => onSelectProduct && onSelectProduct(product)}
          >
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-0.5 truncate">
            {product.category}
          </p>
        </div>

        {/* PRICE & ADD TO CART */}
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t-2 border-black flex items-center justify-between gap-1.5">
          <div>
            {product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className="text-sm sm:text-xl font-black text-black bg-brand-yellow px-1 py-0.5 border border-black shadow-brutal-sm">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-xl font-black text-black">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            disabled={isAddDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!isAddDisabled) {
                onAddToCart(product);
              }
            }}
            className={`w-8 h-8 sm:w-10 sm:h-10 border-2 border-black flex items-center justify-center transition-all shrink-0 ${
              isAddDisabled
                ? 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none'
                : 'bg-brand-purple text-white shadow-brutal-sm hover:bg-brand-pink active:translate-y-0.5 cursor-pointer'
            }`}
            title={
              isOutOfStock
                ? 'Producto sin stock disponible'
                : isMaxStockInCart
                ? `Alcanzaste el máximo de stock disponible (${totalQtyInCart}/${product.stock})`
                : 'Agregar al carrito'
            }
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
};
