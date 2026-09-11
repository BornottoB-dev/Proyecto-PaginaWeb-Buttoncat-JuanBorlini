import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem } from '../../types/types';
import { Button } from '../ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* DRAWER CONTAINER */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l-4 border-black shadow-brutal-xl flex flex-col">
          
          {/* HEADER */}
          <div className="p-4 bg-brand-yellow border-b-3 border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-black stroke-[2.5]" />
              <h2 className="text-xl font-black uppercase text-black font-display tracking-tight">
                TU CARRITO ({items.reduce((a, b) => a + b.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ITEM LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-yellow-100 border-3 border-black mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-black stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black uppercase text-black">
                  Tu carrito está vacío
                </h3>
                <p className="text-xs font-bold text-gray-500 max-w-xs mx-auto">
                  Agrega botones, pines o parches llenos de actitud para empezar.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const { product, quantity, customizationSpecs, customizationDetails } = item;
                return (
                  <div
                    key={product.id}
                    className="border-2 border-black bg-white p-3 shadow-brutal-sm flex gap-3 items-start"
                  >
                    <img
                      src={customizationSpecs?.customImage || product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover border-2 border-black shrink-0 mt-1 bg-yellow-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black uppercase text-black truncate">
                          {product.name}
                        </h4>
                        {customizationSpecs && (
                          <span className="bg-brand-pink text-white border border-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                            CUSTOM
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-gray-500">
                        ${product.price.toLocaleString()} c/u
                      </p>

                      {/* CUSTOMIZATION SPECS BADGES */}
                      {customizationSpecs && (
                        <div className="mt-1.5 p-1.5 bg-yellow-50 border border-black space-y-1 text-[10px] font-bold text-black">
                          {Object.entries(customizationSpecs.options).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-1 leading-tight">
                              <span className="text-gray-500 uppercase">{k}:</span>
                              <span className="font-extrabold text-right truncate max-w-[140px]">{v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!customizationSpecs && customizationDetails && (
                        <p className="text-[10px] font-bold text-brand-purple mt-1 truncate">
                          {customizationDetails}
                        </p>
                      )}

                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 bg-gray-100 border-2 border-black font-black text-xs flex items-center justify-center hover:bg-brand-yellow"
                        >
                          -
                        </button>
                        <span className="text-xs font-extrabold px-1">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 bg-gray-100 border-2 border-black font-black text-xs flex items-center justify-center hover:bg-brand-yellow"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-black">
                        ${(product.price * quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-gray-400 hover:text-red-600 mt-2 inline-block"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER SUMMARY */}
          {items.length > 0 && (
            <div className="p-4 bg-gray-50 border-t-3 border-black space-y-3">
              <div className="flex items-center justify-between text-base font-black text-black">
                <span>SUBTOTAL:</span>
                <span className="text-xl">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500">
                * Envíos e impuestos se calculan durante la pantalla de checkout.
              </p>

              <Button
                variant="purple"
                size="lg"
                fullWidth
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
              >
                FINALIZAR COMPRA <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
