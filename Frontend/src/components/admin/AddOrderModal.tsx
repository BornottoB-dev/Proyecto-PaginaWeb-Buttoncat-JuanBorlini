import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, ShoppingBag, AlertTriangle, Plus, Trash2, User, Package } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus } from '../../types/types';
import type { AdminCustomer } from './AddEditCustomerModal';

export interface OrderItemLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  optionsText?: string;
  isCustom?: boolean;
}

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: AdminOrder) => void;
  orderToEdit?: AdminOrder | null;
  products?: Product[];
  customers?: AdminCustomer[];
  isDarkMode?: boolean;
}

export const AddOrderModal: React.FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  products = [],
  customers = [],
  isDarkMode = true,
}) => {
  // Customer selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('MANUAL');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Dates & Order Metadata
  const [startDate, setStartDate] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [salesChannel, setSalesChannel] = useState<'TIENDA_WEB' | 'VENTA_FISICA' | 'REDES_SOCIALES'>('TIENDA_WEB');
  const [status, setStatus] = useState<OrderStatus>('PENDIENTE');
  const [isCustomOrder, setIsCustomOrder] = useState(false);

  // Shipping & Payment
  const [hasShipping, setHasShipping] = useState(true);
  const [shippingDestination, setShippingDestination] = useState('');
  const [carrier, setCarrier] = useState('Andreani');
  const [paymentStatus, setPaymentStatus] = useState<'PAGADO' | 'PENDIENTE'>('PAGADO');
  const [paymentMethod, setPaymentMethod] = useState('Mercado Pago');

  // Tabulated Order Items
  const [orderItems, setOrderItems] = useState<OrderItemLine[]>([]);

  // Item Builder controls (Catalog product)
  const [builderProductId, setBuilderProductId] = useState<string>('');
  const [builderQuantity, setBuilderQuantity] = useState<number>(1);
  const [builderOptionsText, setBuilderOptionsText] = useState<string>('');

  // Custom Item Builder controls
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemQuantity, setCustomItemQuantity] = useState<number>(1);
  const [customItemUnitPrice, setCustomItemUnitPrice] = useState<number | ''>('');

  // Financial breakdown & Summary
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [total, setTotal] = useState<number | ''>('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [isAutoSummary, setIsAutoSummary] = useState(true);

  // Validation message
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (orderToEdit) {
      // Find matching customer
      const matchingCust = customers.find(
        (c) => c.email.toLowerCase() === orderToEdit.customerEmail.toLowerCase() || c.name === orderToEdit.customerName
      );
      if (matchingCust) {
        setSelectedCustomerId(matchingCust.id);
      } else {
        setSelectedCustomerId('MANUAL');
      }

      setCustomerName(orderToEdit.customerName);
      setCustomerEmail(orderToEdit.customerEmail);
      setItemsSummary(orderToEdit.itemsSummary);
      setSubtotal(orderToEdit.subtotal ?? (orderToEdit.discountAmount ? orderToEdit.total + orderToEdit.discountAmount : orderToEdit.total));
      setDiscountAmount(orderToEdit.discountAmount ?? '');
      setAppliedCouponCode(orderToEdit.appliedCouponCode ?? '');
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

      // Seed order items from summary
      if (orderToEdit.itemsSummary) {
        const initialLines: OrderItemLine[] = [
          {
            id: `line-${Date.now()}`,
            productName: orderToEdit.itemsSummary,
            quantity: orderToEdit.itemsCount || 1,
            unitPrice: Math.round(orderToEdit.total / (orderToEdit.itemsCount || 1)),
            isCustom: true,
          },
        ];
        setOrderItems(initialLines);
      } else {
        setOrderItems([]);
      }
      setIsAutoSummary(false);
    } else {
      setSelectedCustomerId('MANUAL');
      setCustomerName('');
      setCustomerEmail('');
      setItemsSummary('');
      setSubtotal('');
      setDiscountAmount('');
      setAppliedCouponCode('');
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
      setOrderItems([]);
      setIsAutoSummary(true);
    }
  }, [orderToEdit, isOpen]);

  // Handle Customer Selector change
  const handleCustomerSelectChange = (custVal: string) => {
    setSelectedCustomerId(custVal);
    if (custVal === 'MANUAL') {
      setCustomerName('');
      setCustomerEmail('');
      setShippingDestination('');
    } else {
      const cust = customers.find((c) => c.id === custVal);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerEmail(cust.email);
        if (cust.name.includes('Borlini')) {
          setShippingDestination('Av. Corrientes 1234, Piso 4B, CABA');
        } else if (cust.name.includes('Lovecraft')) {
          setShippingDestination('Av. Corrientes 4500, CABA, Ciudad Autónoma de Buenos Aires');
        } else if (cust.name.includes('Rossi')) {
          setShippingDestination('San Martín 120, Rosario, Santa Fe');
        } else {
          setShippingDestination(`Domicilio registrado de ${cust.name}`);
        }
      }
    }
  };

  // Add Catalog Product to Order Items
  const handleAddCatalogProduct = () => {
    if (!builderProductId) {
      setValidationModalMsg('SELECCIONA UN PRODUCTO DEL CATÁLOGO PARA AGREGAR.');
      return;
    }
    const prod = products.find((p) => p.id === builderProductId);
    if (!prod) return;

    const newLine: OrderItemLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      productName: prod.name,
      quantity: Math.max(1, builderQuantity),
      unitPrice: prod.price,
      optionsText: builderOptionsText.trim() || undefined,
      isCustom: false,
    };

    const updatedItems = [...orderItems, newLine];
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);

    setBuilderProductId('');
    setBuilderQuantity(1);
    setBuilderOptionsText('');
    setValidationModalMsg(null);
  };

  // Add Custom Item to Order Items
  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemUnitPrice || Number(customItemUnitPrice) <= 0) {
      setValidationModalMsg('INGRESA UN NOMBRE Y PRECIO UNITARIO VÁLIDO PARA EL ARTÍCULO CUSTOM.');
      return;
    }

    const newLine: OrderItemLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productName: customItemName.trim(),
      quantity: Math.max(1, customItemQuantity),
      unitPrice: Number(customItemUnitPrice),
      isCustom: true,
    };

    const updatedItems = [...orderItems, newLine];
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);
    setIsCustomOrder(true);

    setCustomItemName('');
    setCustomItemQuantity(1);
    setCustomItemUnitPrice('');
    setValidationModalMsg(null);
  };

  // Remove Item Line
  const handleRemoveItemLine = (id: string) => {
    const updatedItems = orderItems.filter((item) => item.id !== id);
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);
  };

  // Update Item Quantity
  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    const qty = Math.max(1, newQty);
    const updatedItems = orderItems.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);
  };

  // Recalculate Total & Auto Summary
  const recalculateOrderTotals = (items: OrderItemLine[], customDisc?: number) => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setSubtotal(calculatedSubtotal);
    const currentDisc = customDisc !== undefined ? customDisc : (Number(discountAmount) || 0);
    const calculatedTotal = Math.max(0, calculatedSubtotal - currentDisc);
    setTotal(calculatedTotal);

    if (isAutoSummary) {
      const summaryText = items
        .map(
          (item) =>
            `${item.quantity}x ${item.productName.toUpperCase()}${
              item.optionsText ? ` (${item.optionsText})` : ''
            }`
        )
        .join(', ');
      setItemsSummary(summaryText);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationModalMsg(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setValidationModalMsg('POR FAVOR, SELECCIONA O INGRESA EL CLIENTE Y SU EMAIL.');
      return;
    }

    if (customerEmail.trim() && (!customerEmail.includes('@') || !customerEmail.includes('.'))) {
      setValidationModalMsg('POR FAVOR, INGRESA UN CORREO ELECTRÓNICO VÁLIDO (DEBE CONTENER "@" Y UN DOMINIO).');
      return;
    }

    if (!itemsSummary.trim() && orderItems.length === 0) {
      setValidationModalMsg('AGREGA AL MENOS UN ARTÍCULO O PRODUCTO AL PEDIDO.');
      return;
    }

    const finalSummary =
      itemsSummary.trim() ||
      orderItems
        .map(
          (i) =>
            `${i.quantity}x ${i.productName}${i.optionsText ? ` (${i.optionsText})` : ''}`
        )
        .join(', ');

    const computedItemsCount = orderItems.reduce((sum, i) => sum + i.quantity, 0) || 1;
    const finalSubtotal = Number(subtotal) || Number(total) || 0;
    const finalDiscount = Number(discountAmount) || 0;
    const finalTotal = total === '' ? Math.max(0, finalSubtotal - finalDiscount) : Number(total);

    const orderData: AdminOrder = {
      id: orderToEdit ? orderToEdit.id : `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      date: startDate || new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
      subtotal: finalSubtotal,
      discountAmount: finalDiscount > 0 ? finalDiscount : undefined,
      appliedCouponCode: appliedCouponCode.trim() ? appliedCouponCode.trim().toUpperCase() : undefined,
      total: finalTotal,
      status,
      itemsCount: computedItemsCount,
      itemsSummary: finalSummary,
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

  const selectedCatalogProd = products.find((p) => p.id === builderProductId);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {orderToEdit ? `EDITAR PEDIDO #${orderToEdit.id}` : 'REGISTRAR NUEVO PEDIDO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[82vh] overflow-y-auto">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {validationModalMsg && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
              isDarkMode ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{validationModalMsg}</span>
            </div>
          )}

          {/* 1. SELECCIÓN DE CLIENTE CARGADO EN EL SISTEMA */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase text-brand-yellow flex items-center gap-1.5">
                <User className="w-4 h-4" /> SELECCIONAR CLIENTE CARGADO EN SISTEMA *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">{customers.length} clientes registrados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow cursor-pointer"
                >
                  <option value="MANUAL">+ Ingresar Cliente Nuevo / Manual</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) • {c.role} ({c.ordersCount} pedidos)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (selectedCustomerId !== 'MANUAL') setSelectedCustomerId('MANUAL');
                  }}
                  placeholder="Ej: Sofia Martinez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (selectedCustomerId !== 'MANUAL') setSelectedCustomerId('MANUAL');
                  }}
                  placeholder="cliente@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dirección / Domicilio</label>
                <input
                  type="text"
                  value={shippingDestination}
                  onChange={(e) => setShippingDestination(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>
          </div>

          {/* 2. TABULACIÓN Y SELECCIÓN DE PRODUCTOS Y ARTÍCULOS */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <label className="text-[11px] font-extrabold uppercase text-brand-pink flex items-center gap-1.5">
                <Package className="w-4 h-4" /> PRODUCTOS & ARTÍCULOS TABULADOS *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Elige productos cargados en inventario</span>
            </div>

            {/* PRODUCT BUILDER FORM FROM CATALOG */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">1. AGREGAR PRODUCTO DEL CATÁLOGO</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    value={builderProductId}
                    onChange={(e) => setBuilderProductId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-pink cursor-pointer"
                  >
                    <option value="">-- Seleccionar producto cargado --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.category}] {p.name} - ${p.price.toFixed(2)} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={builderOptionsText}
                    onChange={(e) => setBuilderOptionsText(e.target.value)}
                    placeholder="Variantes (Talle M, Color Negro...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={builderQuantity}
                    onChange={(e) => setBuilderQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Cant."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center font-bold text-slate-100 focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {selectedCatalogProd ? (
                  <span className="text-[11px] font-bold text-emerald-400">
                    Precio base: ${selectedCatalogProd.price.toFixed(2)} ARS
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">Selecciona un producto del listado</span>
                )}

                <button
                  type="button"
                  onClick={handleAddCatalogProduct}
                  className="bg-brand-pink hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar al Pedido
                </button>
              </div>
            </div>

            {/* CUSTOM WORKSHOP ITEM BUILDER */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">2. AGREGAR ITEM A MEDIDA / TALLER CUSTOM</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Nombre o descripción custom (ej: Remera Estampa Frente A4)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    value={customItemUnitPrice}
                    onChange={(e) => setCustomItemUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Precio Unit. ($)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min={1}
                    value={customItemQuantity}
                    onChange={(e) => setCustomItemQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Cant."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center font-bold text-slate-100 focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="bg-brand-cyan hover:bg-cyan-600 text-black px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Item Custom
                </button>
              </div>
            </div>

            {/* TABULATED ITEMS LIST TABLE */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">ARTÍCULOS INCLUIDOS EN EL PEDIDO ({orderItems.length})</span>
              
              {orderItems.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-bold border border-dashed border-slate-800 rounded-xl bg-slate-950">
                  No hay artículos agregados todavía. Utiliza los selectores superiores para armar el pedido.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs font-semibold text-slate-200 border-collapse">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 w-5/12">PRODUCTO / ARTÍCULO</th>
                        <th className="p-2.5 w-2/12 text-center">CANT.</th>
                        <th className="p-2.5 w-2/12">PRECIO UNIT.</th>
                        <th className="p-2.5 w-2/12">SUBTOTAL</th>
                        <th className="p-2.5 w-1/12 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {orderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-2.5">
                            <p className="font-bold text-slate-100 truncate">{item.productName}</p>
                            {item.optionsText && (
                              <span className="text-[10px] text-slate-400 font-medium block truncate">
                                {item.optionsText}
                              </span>
                            )}
                            {item.isCustom && (
                              <span className="text-[9px] font-bold text-pink-400 block">CUSTOM WORKSHOP</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 bg-slate-900 border border-slate-700 text-center text-xs font-bold rounded py-0.5"
                            />
                          </td>
                          <td className="p-2.5 text-slate-300 font-medium">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-400">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(item.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                              title="Quitar artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 3. DATES, SALES CHANNEL & LOGISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
            <div>
              <label className="block text-brand-yellow text-[10px] font-black uppercase mb-1">
                FECHA INICIO *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-brand-cyan text-[10px] font-black uppercase mb-1">
                ENTREGA ESTIMADA
              </label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                CANAL DE VENTA *
              </label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
              >
                <option value="TIENDA_WEB">TIENDA WEB</option>
                <option value="VENTA_FISICA">LOCAL FÍSICO</option>
                <option value="REDES_SOCIALES">REDES SOCIALES</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                TRANSPORTE / CORREO
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-cyan cursor-pointer"
              >
                <option value="Andreani">Andreani</option>
                <option value="Correo Argentino">Correo Argentino</option>
                <option value="Moto Mensajería Express">Moto Mensajería Express</option>
                <option value="OCA">OCA</option>
                <option value="Retiro Presencial">Retiro Presencial</option>
              </select>
            </div>
          </div>

          {/* 4. PAYMENT & SHIPPING ATTRS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
            <div>
              <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                ESTADO DE PAGO
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
              >
                <option value="PAGADO">PAGADO</option>
                <option value="PENDIENTE">PENDIENTE DE PAGO</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                MÉTODO DE PAGO
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow cursor-pointer"
              >
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Efectivo / Local">Efectivo en Local</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-[10px] font-extrabold text-slate-300 uppercase">
                ¿ES PEDIDO TALLER CUSTOM?
              </span>
              <input
                type="checkbox"
                checked={isCustomOrder}
                onChange={(e) => setIsCustomOrder(e.target.checked)}
                className="w-4 h-4 accent-brand-pink cursor-pointer"
              />
            </div>
          </div>

          {/* 5. SUMMARY & TOTAL AMOUNT */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black uppercase text-slate-300">
                  RESUMEN DE ARTÍCULOS EN TEXTO *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoSummary(true);
                    recalculateOrderTotals(orderItems);
                  }}
                  className="text-[10px] text-brand-cyan hover:underline font-bold"
                >
                  Autogenerar desde tabla
                </button>
              </div>
              <textarea
                rows={2}
                value={itemsSummary}
                onChange={(e) => {
                  setItemsSummary(e.target.value);
                  setIsAutoSummary(false);
                }}
                placeholder="Ej: 2x REMERA OVERSIZE CUSTOM (M), 1x POSTER ARTWORK CYBERPUNK (A3)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-brand-yellow resize-none"
              />
            </div>

            {/* DESGLOSE ECONÓMICO DEL PEDIDO */}
            <div className="bg-slate-900/90 p-4 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-black uppercase text-brand-yellow tracking-wider block">
                DESGLOSE ECONÓMICO Y PAGO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                    SUBTOTAL ($ ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subtotal}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setSubtotal(val);
                      const sub = val === '' ? 0 : val;
                      const disc = discountAmount === '' ? 0 : Number(discountAmount);
                      setTotal(Math.max(0, sub - disc));
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow"
                  />
                </div>

                <div>
                  <label className="block text-emerald-400 text-[10px] font-black uppercase mb-1">
                    DESCUENTO ($ ARS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setDiscountAmount(val);
                      const sub = subtotal === '' ? (total === '' ? 0 : Number(total)) : Number(subtotal);
                      const disc = val === '' ? 0 : val;
                      setTotal(Math.max(0, sub - disc));
                    }}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-400 text-[10px] font-black uppercase mb-1">
                    CUPÓN / CÓDIGO
                  </label>
                  <input
                    type="text"
                    value={appliedCouponCode}
                    onChange={(e) => setAppliedCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej: KAWAII-15OFF"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-purple-300 uppercase focus:outline-none focus:border-brand-purple"
                  />
                </div>

                <div>
                  <label className="block text-emerald-400 text-[10px] font-black uppercase mb-1">
                    TOTAL DEL PEDIDO ($ ARS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg p-2 text-sm font-extrabold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] font-black uppercase mb-1">
                  ESTADO INICIAL DEL PEDIDO
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow uppercase cursor-pointer"
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_CONFECCION">EN CONFECCIÓN</option>
                  <option value="ENVIADO">ENVIADO</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 bg-slate-950 text-slate-300 font-bold rounded-lg hover:bg-slate-800 uppercase cursor-pointer text-xs"
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className="px-5 py-2 bg-brand-yellow hover:bg-white text-black font-extrabold rounded-lg uppercase transition-all flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
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
