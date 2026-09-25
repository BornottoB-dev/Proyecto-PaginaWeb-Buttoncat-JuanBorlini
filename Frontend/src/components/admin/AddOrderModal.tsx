import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, ShoppingBag } from 'lucide-react';
import type { AdminOrder, OrderStatus } from '../../types/types';

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: AdminOrder) => void;
  orderToEdit?: AdminOrder | null;
}

export const AddOrderModal: React.FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [total, setTotal] = useState<number | ''>('');
  const [status, setStatus] = useState<OrderStatus>('PENDIENTE');
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  
  // Nuevos atributos de pedido
  const [startDate, setStartDate] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [salesChannel, setSalesChannel] = useState<'TIENDA_WEB' | 'VENTA_FISICA' | 'REDES_SOCIALES'>('TIENDA_WEB');
  const [hasShipping, setHasShipping] = useState(true);
  const [shippingDestination, setShippingDestination] = useState('');
  const [carrier, setCarrier] = useState('Andreani');
  const [paymentStatus, setPaymentStatus] = useState<'PAGADO' | 'PENDIENTE'>('PAGADO');
  const [paymentMethod, setPaymentMethod] = useState('Mercado Pago');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (orderToEdit) {
      setCustomerName(orderToEdit.customerName);
      setCustomerEmail(orderToEdit.customerEmail);
      setItemsSummary(orderToEdit.itemsSummary);
      setTotal(orderToEdit.total);
      setStatus(orderToEdit.status);
      setIsCustomOrder(!!orderToEdit.isCustomOrder);
      setStartDate(orderToEdit.date || today);
      setEstimatedDeliveryDate(orderToEdit.estimatedDeliveryDate || '');
      setSalesChannel(orderToEdit.salesChannel || 'TIENDA_WEB');
      setHasShipping(orderToEdit.hasShipping ?? true);
      setShippingDestination(orderToEdit.shippingDestination || orderToEdit.shippingAddress || '');
      setCarrier(orderToEdit.carrier || 'Andreani');
      setPaymentStatus(orderToEdit.paymentStatus || 'PAGADO');
      setPaymentMethod(orderToEdit.paymentMethod || 'Mercado Pago');
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setItemsSummary('');
      setTotal('');
      setStatus('PENDIENTE');
      setIsCustomOrder(false);
      setStartDate(today);
      setEstimatedDeliveryDate('');
      setSalesChannel('TIENDA_WEB');
      setHasShipping(true);
      setShippingDestination('');
      setCarrier('Andreani');
      setPaymentStatus('PAGADO');
      setPaymentMethod('Mercado Pago');
    }
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !itemsSummary.trim() || !total) {
      alert('Por favor completa todos los campos obligatorios del pedido.');
      return;
    }

    const orderData: AdminOrder = {
      id: orderToEdit ? orderToEdit.id : `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      date: startDate || new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
      total: Number(total),
      status,
      itemsCount: orderToEdit ? orderToEdit.itemsCount : 1,
      itemsSummary: itemsSummary.trim(),
      isCustomOrder,
      salesChannel,
      hasShipping,
      shippingDestination: shippingDestination.trim() || (hasShipping ? 'CABA / GBA' : 'Retiro en Local'),
      shippingAddress: shippingDestination.trim(),
      carrier: hasShipping ? carrier : 'Retiro en Tienda',
      paymentStatus,
      paymentMethod,
    };

    onSave(orderData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border-4 border-black w-full max-w-2xl shadow-brutal-xl my-8 overflow-hidden font-sans text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight font-display text-brand-yellow">
              {orderToEdit ? `EDITAR PEDIDO #${orderToEdit.id}` : 'REGISTRAR NUEVO PEDIDO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-brand-pink text-white border-2 border-white font-black hover:bg-red-600 flex items-center justify-center transition-all shadow-brutal-sm cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold max-h-[80vh] overflow-y-auto">
          
          {/* CUSTOMER NAME & EMAIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                NOMBRE DEL CLIENTE *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Sofia Martinez"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                CORREO ELECTRÓNICO *
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* DATES: START DATE & END / ESTIMATED DELIVERY DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-3 border border-slate-800">
            <div>
              <label className="block text-brand-yellow font-black uppercase mb-1">
                FECHA DE INICIO / PEDIDO *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-2 border-slate-700 p-2 bg-slate-900 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-brand-cyan font-black uppercase mb-1">
                FECHA DE FIN / ENTREGA ESTIMADA
              </label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full border-2 border-slate-700 p-2 bg-slate-900 text-slate-100 font-bold focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* SALES CHANNEL & PAYMENT STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                CANAL DE VENTA *
              </label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value as any)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
              >
                <option value="TIENDA_WEB">🌐 TIENDA WEB</option>
                <option value="VENTA_FISICA">🏪 VENTA FÍSICA (LOCAL)</option>
                <option value="REDES_SOCIALES">📲 REDES SOCIALES</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                ESTADO DE PAGO
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
              >
                <option value="PAGADO">✅ PAGADO</option>
                <option value="PENDIENTE">⏳ PENDIENTE DE PAGO</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                MÉTODO DE PAGO
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow cursor-pointer"
              >
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Efectivo / Local">Efectivo en Local</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              </select>
            </div>
          </div>

          {/* SHIPPING ATTRS: HAS SHIPPING, DESTINATION, CARRIER */}
          <div className="border-2 border-slate-800 bg-slate-950 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-brand-cyan uppercase">
                ¿REQUIERE ENVÍO A DOMICILIO?
              </span>
              <input
                type="checkbox"
                checked={hasShipping}
                onChange={(e) => setHasShipping(e.target.checked)}
                className="w-5 h-5 accent-brand-cyan cursor-pointer"
              />
            </div>

            {hasShipping ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase mb-1">
                    DESTINO / DIRECCIÓN DE ENVÍO
                  </label>
                  <input
                    type="text"
                    value={shippingDestination}
                    onChange={(e) => setShippingDestination(e.target.value)}
                    placeholder="Ej: Av. Santa Fe 1420, Rosario, Santa Fe"
                    className="w-full border border-slate-700 p-2 bg-slate-900 text-slate-100 font-bold focus:outline-none focus:border-brand-cyan text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase mb-1">
                    EMPRESA DE CORREO / MENSAJERÍA
                  </label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full border border-slate-700 p-2 bg-slate-900 text-slate-100 font-bold focus:outline-none focus:border-brand-cyan text-xs cursor-pointer"
                  >
                    <option value="Andreani">Andreani</option>
                    <option value="Correo Argentino">Correo Argentino</option>
                    <option value="Moto Mensajería Express">Moto Mensajería Express</option>
                    <option value="OCA">OCA</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-bold italic pt-1">
                📍 Retiro presencial en local de Buttoncat.
              </div>
            )}
          </div>

          {/* ITEMS SUMMARY */}
          <div>
            <label className="block text-slate-300 font-black uppercase mb-1">
              RESUMEN DE ARTÍCULOS / PRODUCTOS *
            </label>
            <textarea
              required
              rows={3}
              value={itemsSummary}
              onChange={(e) => setItemsSummary(e.target.value)}
              placeholder="Ej: 2x Remeras Oversized + 1x Set Stickers Goth..."
              className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow resize-none"
            />
          </div>

          {/* TOTAL & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                TOTAL DEL PEDIDO ($ ARS) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={total}
                onChange={(e) => setTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="15000.00"
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-black uppercase mb-1">
                ESTADO DEL PEDIDO
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full border-2 border-slate-700 p-2.5 bg-slate-950 text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_CONFECCION">EN CONFECCIÓN</option>
                <option value="ENVIADO">ENVIADO</option>
                <option value="ENTREGADO">ENTREGADO</option>
              </select>
            </div>
          </div>

          {/* IS CUSTOM ORDER CHECKBOX */}
          <div className="border-2 border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
            <span className="font-extrabold text-slate-200 uppercase">
              ¿ES PEDIDO PERSONALIZADO DE TALLER?
            </span>
            <input
              type="checkbox"
              checked={isCustomOrder}
              onChange={(e) => setIsCustomOrder(e.target.checked)}
              className="w-5 h-5 accent-brand-pink cursor-pointer"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-slate-700 bg-slate-950 text-slate-300 font-black hover:bg-slate-800 uppercase cursor-pointer"
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className="px-6 py-2.5 border-2 border-black bg-brand-yellow text-black font-black hover:bg-white uppercase shadow-brutal transition-all flex items-center gap-2 cursor-pointer"
            >
              {orderToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> REGISTRAR PEDIDO
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
