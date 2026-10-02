import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem, Product } from '../../types/types';
import { handleProductImageError, getCartItemMaxStock } from '../../types/types';
import { Button } from '../ui/Button';
import { CustomProductPreview } from '../customizer/CustomProductPreview';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCheckout: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
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
              items.map((item, index) => {
                const { product, quantity, customizationSpecs, customizationDetails } = item;
                const itemId = item.id || product.id || `cart-item-${index}`;

                const isCustomItem = Boolean(
                  customizationSpecs ||
                  customizationDetails ||
                  product.isCustomizable ||
                  (product.id && product.id.toString().toLowerCase().includes('custom')) ||
                  (product.name && product.name.toString().toLowerCase().includes('personalizad'))
                );

                const handleItemClick = () => {
                  if (!isCustomItem && onSelectProduct) {
                    onClose();
                    onSelectProduct(product);
                  }
                };

                return (
                  <div
                    key={itemId}
                    className="border-2 border-black bg-white p-3 shadow-brutal-sm flex gap-3 items-start"
                  >
                    {customizationSpecs ? (
                      <div
                        onClick={!isCustomItem ? handleItemClick : undefined}
                        className={`w-16 h-16 border-2 border-black shrink-0 mt-1 bg-yellow-100 overflow-hidden relative ${
                          !isCustomItem ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
                        }`}
                        title={!isCustomItem ? 'Ver detalle del producto' : undefined}
                      >
                        <CustomProductPreview
                          category={customizationSpecs.category}
                          options={customizationSpecs.options || {}}
                          customImage={customizationSpecs.customImage}
                          imageTransforms={customizationSpecs.imageTransforms}
                          compact
                          hideHeader
                        />
                      </div>
                    ) : (
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={handleProductImageError}
                        onClick={!isCustomItem ? handleItemClick : undefined}
                        className={`w-16 h-16 object-cover border-2 border-black shrink-0 mt-1 bg-yellow-100 ${
                          !isCustomItem ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
                        }`}
                        title={!isCustomItem ? 'Ver detalle del producto' : undefined}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 
                          onClick={!isCustomItem ? handleItemClick : undefined}
                          className={`text-sm font-black uppercase text-black truncate ${
                            !isCustomItem ? 'cursor-pointer hover:text-brand-purple hover:underline transition-colors' : ''
                          }`}
                          title={!isCustomItem ? 'Ver detalle del producto' : undefined}
                        >
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
                      {(() => {
                        const maxStock = getCartItemMaxStock(item);
                        const isPlusDisabled = maxStock <= 0 || quantity >= maxStock;
                        return (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onUpdateQuantity(itemId, quantity - 1)}
                                className="w-6 h-6 bg-gray-100 border-2 border-black font-black text-xs flex items-center justify-center hover:bg-brand-yellow cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-extrabold px-1">
                                {quantity}
                              </span>
                              <button
                                disabled={isPlusDisabled}
                                onClick={() => !isPlusDisabled && onUpdateQuantity(itemId, quantity + 1)}
                                className={`w-6 h-6 border-2 border-black font-black text-xs flex items-center justify-center transition-colors ${
                                  isPlusDisabled
                                    ? 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-brand-yellow cursor-pointer text-black'
                                }`}
                                title={isPlusDisabled ? `Stock máximo alcanzado (${maxStock})` : 'Aumentar cantidad'}
                              >
                                +
                              </button>
                            </div>
                            {isPlusDisabled && maxStock > 0 && (
                              <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-black px-1.5 py-0.5 shadow-brutal-sm uppercase">
                                MÁX. ({maxStock})
                              </span>
                            )}
                            {maxStock === 0 && (
                              <span className="text-[9px] font-extrabold text-red-800 bg-red-100 border border-black px-1.5 py-0.5 shadow-brutal-sm uppercase">
                                SIN STOCK
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-black">
                        ${(product.price * quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => onRemoveItem(itemId)}
                        className="text-gray-400 hover:text-red-600 mt-2 inline-block cursor-pointer"
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
