import React, { useState, useEffect, type FC } from 'react';
import { X, Save, PlusCircle, ShoppingBag, Plus, Trash2, User, Package } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus } from '../../types/types';
import type { AdminCustomer } from './AddEditCustomerModal';
import { ValidationModal } from '../ui/ValidationModal';

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

export const AddOrderModal: FC<AddEditOrderModalProps> = ({
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
  const [paymentMethod, setPaymentMethod] = useState('Dinero Digital');

  const normalizePaymentMethodOption = (m?: string): string => {
    if (!m) return 'Dinero Digital';
    const lower = m.toLowerCase();
    if (lower.includes('efectivo') || lower.includes('cash') || lower.includes('físic') || lower.includes('fisic') || lower.includes('local')) {
      return 'Dinero Físico (Efectivo)';
    }
    return 'Dinero Digital';
  };

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
      setPaymentMethod(normalizePaymentMethodOption(orderToEdit.paymentMethod));

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
      setPaymentMethod('Dinero Digital');
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl my-auto rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
            }`}>
              <ShoppingBag className="w-5 h-5 text-gray-800 dark:text-slate-200" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                {orderToEdit ? `EDITAR PEDIDO #${orderToEdit.id}` : 'REGISTRAR NUEVO PEDIDO'}
              </h2>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Gestión de ventas, remitos y artículos tabulados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[82vh] overflow-y-auto">
          {/* 1. SELECCIÓN DE CLIENTE CARGADO EN EL SISTEMA */}
          <div className={`rounded-xl border p-4 space-y-3 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/70 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <label htmlFor="order-customer-select" className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                <User className="w-4 h-4 text-gray-600 dark:text-slate-400" /> SELECCIONAR CLIENTE *
              </label>
              <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {customers.length} clientes registrados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <select
                  id="order-customer-select"
                  name="selectedCustomerId"
                  aria-label="Seleccionar cliente registrado o nuevo"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelectChange(e.target.value)}
                  className={`w-full rounded-lg p-2.5 text-xs font-semibold border focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
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
                <label htmlFor="order-customer-name-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Nombre del Cliente *
                </label>
                <input
                  id="order-customer-name-input"
                  name="customerName"
                  aria-label="Nombre del cliente"
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (selectedCustomerId !== 'MANUAL') setSelectedCustomerId('MANUAL');
                  }}
                  placeholder="Ej: Sofia Martinez"
                  className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="order-customer-email-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Correo Electrónico *
                </label>
                <input
                  id="order-customer-email-input"
                  name="customerEmail"
                  aria-label="Correo electrónico del cliente"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    if (selectedCustomerId !== 'MANUAL') setSelectedCustomerId('MANUAL');
                  }}
                  placeholder="cliente@email.com"
                  className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="order-customer-address-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Dirección / Domicilio
                </label>
                <input
                  id="order-customer-address-input"
                  name="shippingDestination"
                  aria-label="Dirección o domicilio"
                  type="text"
                  value={shippingDestination}
                  onChange={(e) => setShippingDestination(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. TABULACIÓN Y SELECCIÓN DE PRODUCTOS Y ARTÍCULOS */}
          <div className={`rounded-xl border p-4 space-y-4 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/70 border-gray-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
              <label className={`text-xs font-bold uppercase flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                <Package className="w-4 h-4 text-gray-600 dark:text-slate-400" /> PRODUCTOS & ARTÍCULOS TABULADOS *
              </label>
              <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Elige productos del catálogo o crea ítems custom
              </span>
            </div>

            {/* PRODUCT BUILDER FORM FROM CATALOG */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                1. AGREGAR PRODUCTO DEL CATÁLOGO
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    id="order-catalog-product-select"
                    name="builderProductId"
                    aria-label="Seleccionar producto cargado del catálogo"
                    value={builderProductId}
                    onChange={(e) => setBuilderProductId(e.target.value)}
                    className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
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
                    id="order-catalog-options-input"
                    name="builderOptionsText"
                    aria-label="Variantes de producto (Talle, Color)"
                    type="text"
                    value={builderOptionsText}
                    onChange={(e) => setBuilderOptionsText(e.target.value)}
                    placeholder="Variantes (Talle M, Color Negro...)"
                    className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    id="order-catalog-quantity-input"
                    name="builderQuantity"
                    aria-label="Cantidad de producto del catálogo"
                    type="number"
                    min={1}
                    value={builderQuantity}
                    onChange={(e) => setBuilderQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Cant."
                    className={`w-full rounded-lg p-2 text-xs text-center font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {selectedCatalogProd ? (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Precio unitario: ${selectedCatalogProd.price.toFixed(2)}
                  </span>
                ) : (
                  <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Selecciona un producto del catálogo
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleAddCatalogProduct}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar al Pedido
                </button>
              </div>
            </div>

            {/* CUSTOM WORKSHOP ITEM BUILDER */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
            }`}>
              <span className={`text-[10px] font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                2. AGREGAR ITEM A MEDIDA / TALLER CUSTOM
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    id="order-custom-item-name-input"
                    name="customItemName"
                    aria-label="Nombre o descripción custom"
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Nombre o descripción custom (ej: Remera Estampa Frente A4)"
                    className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    id="order-custom-item-price-input"
                    name="customItemUnitPrice"
                    aria-label="Precio unitario custom"
                    type="number"
                    step="0.01"
                    value={customItemUnitPrice}
                    onChange={(e) => setCustomItemUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Precio Unit. ($)"
                    className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    id="order-custom-item-quantity-input"
                    name="customItemQuantity"
                    aria-label="Cantidad de item custom"
                    type="number"
                    min={1}
                    value={customItemQuantity}
                    onChange={(e) => setCustomItemQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Cant."
                    className={`w-full rounded-lg p-2 text-xs text-center font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer border ${
                    isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-gray-300 text-gray-800 hover:bg-gray-100 bg-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Item Custom
                </button>
              </div>
            </div>

            {/* TABULATED ITEMS LIST TABLE */}
            <div className="space-y-2">
              <span className={`text-[10px] font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                ARTÍCULOS INCLUIDOS EN EL PEDIDO ({orderItems.length})
              </span>
              
              {orderItems.length === 0 ? (
                <div className={`p-4 text-center font-medium border border-dashed rounded-xl ${
                  isDarkMode ? 'border-slate-800 text-slate-500 bg-slate-950' : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  No hay artículos agregados todavía. Utiliza los selectores superiores para armar el pedido.
                </div>
              ) : (
                <div className={`border rounded-xl overflow-hidden ${
                  isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
                }`}>
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead className={`uppercase text-[10px] font-bold border-b ${
                      isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      <tr>
                        <th className="p-2.5 w-5/12">PRODUCTO / ARTÍCULO</th>
                        <th className="p-2.5 w-2/12 text-center">CANT.</th>
                        <th className="p-2.5 w-2/12">PRECIO UNIT.</th>
                        <th className="p-2.5 w-2/12">SUBTOTAL</th>
                        <th className="p-2.5 w-1/12 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                      {orderItems.map((item) => (
                        <tr key={item.id} className={isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'}>
                          <td className="p-2.5">
                            <p className={`font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{item.productName}</p>
                            {item.optionsText && (
                              <span className={`text-[10px] font-medium block truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {item.optionsText}
                              </span>
                            )}
                            {item.isCustom && (
                              <span className="text-[9px] font-bold text-brand-purple block">CUSTOM WORKSHOP</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              id={`order-item-qty-${item.id}`}
                              name={`orderItemQty_${item.id}`}
                              aria-label={`Cantidad para ${item.productName}`}
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className={`w-12 text-center text-xs font-bold rounded py-0.5 border ${
                                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                              }`}
                            />
                          </td>
                          <td className={`p-2.5 font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(item.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
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
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/70 border-gray-200'
          }`}>
            <div>
              <label htmlFor="order-start-date-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                FECHA INICIO *
              </label>
              <input
                id="order-start-date-input"
                name="startDate"
                aria-label="Fecha de inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              />
            </div>

            <div>
              <label htmlFor="order-estimated-delivery-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                ENTREGA ESTIMADA
              </label>
              <input
                id="order-estimated-delivery-input"
                name="estimatedDeliveryDate"
                aria-label="Entrega estimada"
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              />
            </div>

            <div>
              <label htmlFor="order-sales-channel-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                CANAL DE VENTA *
              </label>
              <select
                id="order-sales-channel-select"
                name="salesChannel"
                aria-label="Canal de venta"
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value as any)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer uppercase ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="TIENDA_WEB">TIENDA WEB</option>
                <option value="VENTA_FISICA">LOCAL FÍSICO</option>
                <option value="REDES_SOCIALES">REDES SOCIALES</option>
              </select>
            </div>

            <div>
              <label htmlFor="order-carrier-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                TRANSPORTE / CORREO
              </label>
              <select
                id="order-carrier-select"
                name="carrier"
                aria-label="Transporte o correo"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
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
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/70 border-gray-200'
          }`}>
            <div>
              <label htmlFor="order-payment-status-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                ESTADO DE PAGO
              </label>
              <select
                id="order-payment-status-select"
                name="paymentStatus"
                aria-label="Estado de pago"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer uppercase ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="PAGADO">PAGADO</option>
                <option value="PENDIENTE">PENDIENTE DE PAGO</option>
              </select>
            </div>

            <div>
              <label htmlFor="order-payment-method-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                MÉTODO DE PAGO
              </label>
              <select
                id="order-payment-method-select"
                name="paymentMethod"
                aria-label="Método de pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              >
                <option value="Dinero Digital">Dinero Digital</option>
                <option value="Dinero Físico (Efectivo)">Dinero Físico (Efectivo)</option>
              </select>
            </div>

            <label htmlFor="order-is-custom-order-checkbox" className="flex items-center justify-between pt-4 cursor-pointer">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                ¿ES PEDIDO TALLER CUSTOM?
              </span>
              <input
                id="order-is-custom-order-checkbox"
                name="isCustomOrder"
                aria-label="¿Es pedido taller custom?"
                type="checkbox"
                checked={isCustomOrder}
                onChange={(e) => setIsCustomOrder(e.target.checked)}
                className="w-4 h-4 accent-gray-900 dark:accent-slate-100 cursor-pointer"
              />
            </label>
          </div>

          {/* 5. SUMMARY & TOTAL AMOUNT */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="order-items-summary-textarea" className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  RESUMEN DE ARTÍCULOS EN TEXTO *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoSummary(true);
                    recalculateOrderTotals(orderItems);
                  }}
                  className="text-[10px] text-gray-600 dark:text-slate-400 hover:underline font-bold cursor-pointer"
                >
                  Autogenerar desde tabla
                </button>
              </div>
              <textarea
                id="order-items-summary-textarea"
                name="itemsSummary"
                aria-label="Resumen de artículos en texto"
                rows={2}
                value={itemsSummary}
                onChange={(e) => {
                  setItemsSummary(e.target.value);
                  setIsAutoSummary(false);
                }}
                placeholder="Ej: 2x REMERA OVERSIZE CUSTOM (M), 1x POSTER ARTWORK CYBERPUNK (A3)..."
                className={`w-full rounded-lg p-2.5 text-xs font-medium border focus:outline-none resize-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              />
            </div>

            {/* DESGLOSE ECONÓMICO DEL PEDIDO */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/70 border-gray-200'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                isDarkMode ? 'text-slate-200' : 'text-gray-800'
              }`}>
                DESGLOSE ECONÓMICO Y PAGO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="order-subtotal-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    SUBTOTAL ($ ARS)
                  </label>
                  <input
                    id="order-subtotal-input"
                    name="subtotal"
                    aria-label="Subtotal en pesos"
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
                    className={`w-full rounded-lg p-2 text-xs font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="order-discount-input" className="block text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase mb-1 tracking-wider">
                    DESCUENTO ($ ARS)
                  </label>
                  <input
                    id="order-discount-input"
                    name="discountAmount"
                    aria-label="Descuento en pesos"
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
                    className={`w-full rounded-lg p-2 text-xs font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-400' : 'bg-white border-gray-300 text-emerald-700 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="order-coupon-input" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    CUPÓN / CÓDIGO
                  </label>
                  <input
                    id="order-coupon-input"
                    name="appliedCouponCode"
                    aria-label="Cupón o código de descuento"
                    type="text"
                    value={appliedCouponCode}
                    onChange={(e) => setAppliedCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ej: KAWAII-15OFF"
                    className={`w-full rounded-lg p-2 text-xs font-bold border focus:outline-none uppercase ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="order-total-input" className="block text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase mb-1 tracking-wider">
                    TOTAL DEL PEDIDO ($ ARS) *
                  </label>
                  <input
                    id="order-total-input"
                    name="total"
                    aria-label="Total del pedido en pesos"
                    type="number"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className={`w-full rounded-lg p-2 text-sm font-extrabold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-emerald-500/50 text-emerald-400 focus:border-emerald-400' : 'bg-white border-emerald-500 text-emerald-700 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="order-status-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  ESTADO INICIAL DEL PEDIDO
                </label>
                <select
                  id="order-status-select"
                  name="status"
                  aria-label="Estado inicial del pedido"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className={`w-full rounded-lg p-2 text-xs font-bold border focus:outline-none uppercase cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_CONFECCION">EN CONFECCIÓN</option>
                  <option value="ENVIADO">ENVIADO</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIONS FOOTER */}
          <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t -mx-6 -mb-6 mt-6 shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              CANCELAR
            </button>
            
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs ${
                isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
              }`}
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

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!validationModalMsg}
        title="CAMPO OBLIGATORIO REQUERIDO"
        message={validationModalMsg || ''}
        onClose={() => setValidationModalMsg(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
