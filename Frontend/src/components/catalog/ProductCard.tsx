import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '../../types/types';
import { Badge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite = false,
  onAddToCart,
  onSelectProduct,
  onToggleFavorite,
}) => {
  return (
    <div className="relative border-3 border-black bg-white shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* BADGE TOP */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className={product.badgeBg || 'bg-brand-orange text-white'}>
            {product.badge}
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
          className={`absolute top-3 right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 border-2 border-black flex items-center justify-center transition-all shadow-brutal-sm cursor-pointer ${
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

      {/* PRODUCT IMAGE */}
      <div 
        className="relative w-full h-36 sm:h-56 bg-gray-100 border-b-3 border-black overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct && onSelectProduct(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* CONTENT BODY */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between bg-white">
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
                {/* PRECIO SIN DESCUENTO TACHADO */}
                <span className="text-xs sm:text-sm font-extrabold text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                {/* PRECIO CON DESCUENTO DESTACADO */}
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
            onClick={() => onAddToCart(product)}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-purple text-white border-2 border-black flex items-center justify-center shadow-brutal-sm hover:bg-brand-pink active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
};
