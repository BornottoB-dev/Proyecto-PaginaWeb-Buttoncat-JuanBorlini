import React from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../types/types';
import { Badge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelectProduct,
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

      {/* PRODUCT IMAGE */}
      <div 
        className="relative w-full h-56 bg-gray-100 border-b-3 border-black overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct && onSelectProduct(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 
            className="text-lg font-black uppercase tracking-tight text-black line-clamp-1 cursor-pointer hover:text-brand-purple transition-colors"
            onClick={() => onSelectProduct && onSelectProduct(product)}
          >
            {product.name}
          </h3>
          <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">
            {product.category}
          </p>
        </div>

        {/* PRICE & ADD TO CART */}
        <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-black">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs font-bold text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="w-10 h-10 bg-brand-purple text-white border-2 border-black flex items-center justify-center shadow-brutal-sm hover:bg-brand-pink active:translate-y-0.5 transition-all"
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
};
