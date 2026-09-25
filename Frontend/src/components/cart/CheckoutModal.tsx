import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Truck, 
  Store, 
  CreditCard, 
  Building2, 
  Banknote, 
  ArrowRight, 
  ArrowLeft, 
  Tag, 
  ShieldCheck, 
  ShoppingBag,
  MapPin,
  User as UserIcon,
  Copy,
  Check
} from 'lucide-react';
import type { CartItem, AdminOrder, CheckoutFormData, RedeemedCoupon, User } from '../../types/types';
import { Button } from '../ui/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser?: User | null;
  redeemedCoupons?: RedeemedCoupon[];
  onCompleteCheckout: (order: AdminOrder, pointsEarned: number) => void;
  onNavigateToProfile?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  redeemedCoupons = [],
  onCompleteCheckout,
  onNavigateToProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: currentUser?.name || 'Juan Borlini',
    email: currentUser?.email || 'juan.borlini@email.com',
    phone: '11-5544-3322',
    shippingMethod: 'DELIVERY',
    street: 'Av. Corrientes',
    number: '1234',
    floorDept: '4B',
    city: 'Buenos Aires',
    zipCode: 'C1043',
    couponCode: '',
    paymentMethod: 'MERCADO_PAGO',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
      }));
    }
  }, [currentUser, isOpen]);

  // Applied Coupon State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [couponError, setCouponError] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Completed Order State for Step 4
  const [createdOrder, setCreatedOrder] = useState<AdminOrder | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);

  if (!isOpen) return null;

  // Pricing Calculations
  const rawSubtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingCost = formData.shippingMethod === 'PICKUP' ? 0 : 2500;
  
  // Coupon Discount
  const couponDiscountAmount = (rawSubtotal * discountPercent) / 100;
  
  // Payment Method Discount (e.g. 10% off for Bank Transfer)
  const transferDiscountPercent = formData.paymentMethod === 'TRANSFER' ? 10 : 0;
  const transferDiscountAmount = ((rawSubtotal - couponDiscountAmount) * transferDiscountPercent) / 100;

  const totalDiscount = couponDiscountAmount + transferDiscountAmount;
  const finalTotal = Math.max(0, rawSubtotal - totalDiscount + shippingCost);
  const calculatedPoints = Math.floor(finalTotal * 0.1); // 10% in points

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = formData.couponCode.trim().toUpperCase();

    if (!code) {
      setCouponError('Ingresa un código de cupón.');
      return;
    }

    if (code === 'BUTTONCAT10' || code === 'WELCOME10') {
      setDiscountPercent(10);
      setAppliedCouponCode(code);
    } else {
      // Check in user redeemed coupons
      const foundCoupon = redeemedCoupons.find(
        (c) => c.code.toUpperCase() === code && !c.isUsed
      );
      if (foundCoupon) {
        let pct = 10;
        if (foundCoupon.discountValue.includes('15%')) pct = 15;
        if (foundCoupon.discountValue.includes('20%')) pct = 20;
        if (foundCoupon.discountValue.includes('50%')) pct = 50;
        setDiscountPercent(pct);
        setAppliedCouponCode(foundCoupon.code);
      } else {
        setCouponError('Código inválido o ya utilizado.');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountPercent(0);
    setAppliedCouponCode('');
    setFormData((prev) => ({ ...prev, couponCode: '' }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Por favor completa todos los campos de contacto.');
        return;
      }
      if (formData.shippingMethod === 'DELIVERY' && (!formData.street || !formData.number || !formData.city)) {
        alert('Por favor completa la dirección de envío.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleConfirmOrder = () => {
    const orderId = `BTC-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsSummaryStr = items
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(', ');

    const newOrder: AdminOrder = {
      id: orderId,
      customerId: currentUser ? currentUser.id : 'usr-1',
      customerName: formData.name,
      customerEmail: formData.email,
      date: new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      total: finalTotal,
      status: 'PENDIENTE',
      itemsCount: items.reduce((a, b) => a + b.quantity, 0),
      itemsSummary: itemsSummaryStr,
      isCustomOrder: items.some((i) => !!i.customizationSpecs),
      trackingNumber: formData.shippingMethod === 'DELIVERY' ? `AR${Math.floor(100000000 + Math.random() * 900000000)}AR` : 'RETIRO EN LOCAL',
      shippingAddress: formData.shippingMethod === 'DELIVERY' 
        ? `${formData.street} ${formData.number} ${formData.floorDept}, ${formData.city}`
        : 'Sucursal Central Buttoncat',
      paymentMethod: formData.paymentMethod === 'MERCADO_PAGO' ? 'Mercado Pago' : formData.paymentMethod === 'TRANSFER' ? 'Transferencia Bancaria' : 'Efectivo en local',
    };

    setCreatedOrder(newOrder);
    setEarnedPoints(calculatedPoints);
    onCompleteCheckout(newOrder, calculatedPoints);
    setStep(4);
  };

  const copyOrderCode = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border-4 border-black shadow-brutal-xl overflow-hidden flex flex-col my-8">
        
        {/* HEADER MODAL */}
        <div className="bg-brand-yellow p-4 border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-black stroke-[2.5]" />
            <div>
              <h2 className="text-xl font-black uppercase text-black font-display tracking-wide">
                CHECKOUT UI - PROCESO DE COMPRA
              </h2>
              <p className="text-[11px] font-extrabold uppercase text-gray-800">
                Paso {step} de 4 {step === 1 ? '• Datos de Envío' : step === 2 ? '• Resumen y Cupones' : step === 3 ? '• Método de Pago' : '• Confirmación'}
              </p>
            </div>
          </div>
          {step < 4 && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="grid grid-cols-4 border-b-3 border-black bg-gray-100 text-[11px] font-black uppercase text-center">
          <div className={`py-2 border-r-2 border-black transition-colors ${step >= 1 ? 'bg-brand-cyan text-black' : 'text-gray-400'}`}>
            1. ENVÍO
          </div>
          <div className={`py-2 border-r-2 border-black transition-colors ${step >= 2 ? 'bg-brand-cyan text-black' : 'text-gray-400'}`}>
            2. RESUMEN
          </div>
          <div className={`py-2 border-r-2 border-black transition-colors ${step >= 3 ? 'bg-brand-cyan text-black' : 'text-gray-400'}`}>
            3. PAGO
          </div>
          <div className={`py-2 transition-colors ${step >= 4 ? 'bg-green-400 text-black' : 'text-gray-400'}`}>
            4. LISTO
          </div>
        </div>

        {/* STEP BODY */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">

          {/* STEP 1: DATOS DE ENVÍO Y CONTACTO */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* CONTACT DATA */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-black flex items-center gap-2 border-b-2 border-black pb-1">
                  <UserIcon className="w-4 h-4 text-black" /> INFORMACIÓN DE CONTACTO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white focus:bg-yellow-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase mb-1">Email de Confirmación *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white focus:bg-yellow-50 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white focus:bg-yellow-50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SHIPPING METHOD SELECTION */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-black flex items-center gap-2 border-b-2 border-black pb-1">
                  <Truck className="w-4 h-4 text-black" /> OPICIÓN DE ENTREGAS Y ENVÍO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData({ ...formData, shippingMethod: 'DELIVERY' })}
                    className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm ${
                      formData.shippingMethod === 'DELIVERY'
                        ? 'bg-yellow-100 border-black ring-2 ring-black'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm uppercase flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-purple" /> PAQ.AR Domicilio
                      </span>
                      <span className="font-extrabold text-sm">$2.500</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-600">
                      Entrega en todo el país dentro de 3 a 5 días hábiles.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, shippingMethod: 'PICKUP' })}
                    className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm ${
                      formData.shippingMethod === 'PICKUP'
                        ? 'bg-yellow-100 border-black ring-2 ring-black'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm uppercase flex items-center gap-2">
                        <Store className="w-4 h-4 text-brand-pink" /> Retiro en Local
                      </span>
                      <span className="font-extrabold text-sm text-green-700 uppercase">GRATIS</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-600">
                      Retirá en nuestro showroom de Palermo (CABA) sin cargo.
                    </p>
                  </div>
                </div>
              </div>

              {/* DELIVERY ADDRESS FIELDS */}
              {formData.shippingMethod === 'DELIVERY' && (
                <div className="space-y-3 bg-yellow-50 p-4 border-2 border-black">
                  <h4 className="text-xs font-black uppercase text-black flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-black" /> DOMICILIO DE ENTREGA
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black uppercase mb-1">Calle / Av *</label>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Altura *</label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Piso / Depto</label>
                      <input
                        type="text"
                        value={formData.floorDept}
                        onChange={(e) => setFormData({ ...formData, floorDept: e.target.value })}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Ciudad / Localidad *</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase mb-1">Código Postal *</label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: RESUMEN Y CUPONES */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* CART ITEMS SUMMARY */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-black flex items-center gap-2 border-b-2 border-black pb-1">
                  <ShoppingBag className="w-4 h-4" /> ARTÍCULOS EN EL PEDIDO ({items.reduce((a, b) => a + b.quantity, 0)})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-2 border-black p-2.5 bg-white shadow-brutal-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.customizationSpecs?.customImage || item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover border border-black bg-yellow-100"
                        />
                        <div>
                          <p className="text-xs font-black uppercase text-black">{item.product.name}</p>
                          <p className="text-[10px] font-bold text-gray-500">Cantidad: {item.quantity} x ${item.product.price.toLocaleString('es-AR')}</p>
                          {item.customizationSpecs && (
                            <span className="bg-brand-pink text-white border border-black text-[9px] px-1 font-black uppercase">CUSTOM</span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-sm text-black">
                        ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COUPON CODE INPUT */}
              <div className="border-3 border-black p-4 bg-brand-yellow space-y-3">
                <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />¿TIENES UN CUPÓN DE DESCUENTO O CÓDIGO DE PREMIO?
                </h4>
                
                {appliedCouponCode ? (
                  <div className="flex items-center justify-between bg-white border-2 border-black p-2 text-xs font-black">
                    <span className="text-green-700 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> CUPÓN APLICADO: {appliedCouponCode} ({discountPercent}% OFF)
                    </span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 underline text-[11px] uppercase hover:text-black font-extrabold"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="CÓDIGO (Ej: BUTTONCAT10)"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      className="flex-1 border-2 border-black p-2 text-xs font-black uppercase focus:outline-none bg-white"
                    />
                    <Button variant="purple" size="sm" onClick={handleApplyCoupon}>
                      APLICAR
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[11px] font-extrabold text-red-600">{couponError}</p>
                )}
              </div>

              {/* DETALLE DE COSTOS Y TOTALES */}
              <div className="border-3 border-black p-4 bg-white space-y-2 text-xs font-bold text-black">
                <div className="flex justify-between">
                  <span className="text-gray-600 uppercase">Subtotal productos:</span>
                  <span>${rawSubtotal.toLocaleString('es-AR')}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-700 font-black">
                    <span>Descuento cupón ({discountPercent}%):</span>
                    <span>-${couponDiscountAmount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 uppercase">Costo de envío ({formData.shippingMethod === 'PICKUP' ? 'Retiro en local' : 'PAQ.AR Domicilio'}):</span>
                  <span>{shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toLocaleString('es-AR')}`}</span>
                </div>
                <div className="border-t-2 border-black pt-2 flex justify-between text-lg font-black text-black">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="text-xl text-black">${finalTotal.toLocaleString('es-AR')}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 text-right">
                  Con esta compra acumularás aproximadamente <span className="font-extrabold text-brand-purple">+{calculatedPoints} Puntos</span>
                </p>
              </div>

            </div>
          )}

          {/* STEP 3: MÉTODOS DE PAGO */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase text-black border-b-2 border-black pb-1">
                SELECCIONA TU MÉTODO DE PAGO
              </h3>

              <div className="space-y-3">
                {/* MERCADO PAGO */}
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'MERCADO_PAGO' })}
                  className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm flex items-start gap-4 ${
                    formData.paymentMethod === 'MERCADO_PAGO'
                      ? 'bg-yellow-100 border-black ring-2 ring-black'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-sky-400 border-2 border-black flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase text-black">MERCADO PAGO / TARJETAS</h4>
                      <span className="bg-sky-200 border border-black text-[9px] font-black px-1.5 uppercase">INSTANTÁNEO</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                      Tarjetas de crédito, débito, dinero en cuenta de Mercado Pago o Rapipago/PagoFácil.
                    </p>
                  </div>
                </div>

                {/* TRANSFERENCIA BANCARIA */}
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'TRANSFER' })}
                  className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm flex items-start gap-4 ${
                    formData.paymentMethod === 'TRANSFER'
                      ? 'bg-yellow-100 border-black ring-2 ring-black'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 bg-brand-purple border-2 border-black flex items-center justify-center shrink-0 text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase text-black">TRANSFERENCIA BANCARIA DIRECTA</h4>
                      <span className="bg-green-400 text-black border border-black text-[9px] font-black px-1.5 uppercase">10% OFF EXTRA</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                      Transfiere vía CBU / CVU con un 10% de descuento directo en tu orden.
                    </p>
                  </div>
                </div>

                {/* EFECTIVO EN LOCAL */}
                {formData.shippingMethod === 'PICKUP' && (
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                    className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm flex items-start gap-4 ${
                      formData.paymentMethod === 'CASH'
                        ? 'bg-yellow-100 border-black ring-2 ring-black'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-brand-pink border-2 border-black flex items-center justify-center shrink-0 text-white">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm uppercase text-black">EFECTIVO AL RETIRAR</h4>
                        <span className="bg-yellow-300 border border-black text-[9px] font-black px-1.5 uppercase">RETIRO</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                        Abona en efectivo directamente en nuestro local al retirar tu pedido.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* TRANSFER DETAILS BOX IF SELECTED */}
              {formData.paymentMethod === 'TRANSFER' && (
                <div className="border-2 border-black p-3 bg-purple-50 space-y-1 text-xs font-bold text-black">
                  <p className="font-black uppercase text-brand-purple">DATOS PARA TRANSFERIR (ALIAS):</p>
                  <p><span className="text-gray-600 uppercase">CBU:</span> 0000003100012398471203</p>
                  <p><span className="text-gray-600 uppercase">ALIAS:</span> BUTTONCAT.TIENDA</p>
                  <p><span className="text-gray-600 uppercase">TITULAR:</span> BUTTONCAT S.A.</p>
                </div>
              )}

              {/* FINAL CHECKOUT BREAKDOWN SUMMARY */}
              <div className="border-3 border-black p-4 bg-gray-50 space-y-1.5 text-xs font-extrabold text-black">
                <div className="flex justify-between">
                  <span>MÉTODO DE PAGO:</span>
                  <span className="uppercase text-brand-purple">
                    {formData.paymentMethod === 'MERCADO_PAGO' ? 'Mercado Pago' : formData.paymentMethod === 'TRANSFER' ? 'Transferencia (10% OFF Aplicado)' : 'Efectivo en Local'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-black pt-2">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-xl text-black">${finalTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: ORDEN CONFIRMADA Y EXITOSA */}
          {step === 4 && createdOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-green-400 border-4 border-black mx-auto flex items-center justify-center shadow-brutal">
                <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-widest">
                  PEDIDO REGISTRADO CON ÉXITO
                </span>
                <h3 className="text-2xl font-black uppercase text-black font-display">
                  ¡GRACIAS POR TU COMPRA!
                </h3>
                <p className="text-xs font-bold text-gray-600 max-w-md mx-auto">
                  Hemos enviado la confirmación y los detalles del pedido a <span className="font-black text-black">{createdOrder.customerEmail}</span>.
                </p>
              </div>

              {/* ORDER NUMBER BOX */}
              <div className="border-3 border-black bg-brand-yellow p-4 shadow-brutal max-w-sm mx-auto space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-800">CÓDIGO DE SEGUIMIENTO:</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-black tracking-wider">{createdOrder.id}</span>
                  <button
                    onClick={copyOrderCode}
                    className="p-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="block text-[10px] font-bold text-black uppercase">
                  MÉTODO: {createdOrder.paymentMethod} • TOTAL: ${createdOrder.total.toLocaleString('es-AR')}
                </span>
              </div>

              {/* POINTS REWARDED */}
              <div className="border-2 border-black bg-purple-100 p-3 max-w-sm mx-auto flex items-center justify-center gap-2 text-xs font-black text-brand-purple">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>¡HAS GANADO +{earnedPoints} PUNTOS BUTTONCAT!</span>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-gray-100 border-t-3 border-black flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <Button
              variant="white"
              size="md"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="text-xs font-black uppercase"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> VOLVER
            </Button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <Button
              variant="purple"
              size="md"
              onClick={handleNextStep}
              className="text-xs font-black uppercase ml-auto"
            >
              CONTINUAR <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {step === 3 && (
            <Button
              variant="pink"
              size="lg"
              onClick={handleConfirmOrder}
              className="text-sm font-black uppercase ml-auto"
            >
              CONFIRMAR Y PAGAR SERVICIO <CheckCircle2 className="w-5 h-5 ml-1" />
            </Button>
          )}

          {step === 4 && (
            <div className="flex items-center justify-center gap-3 w-full">
              {onNavigateToProfile && (
                <Button
                  variant="yellow"
                  size="md"
                  onClick={() => {
                    onClose();
                    onNavigateToProfile();
                  }}
                  className="text-xs font-black uppercase"
                >
                  VER MI SEGUIMIENTO EN MI PERFIL <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <Button
                variant="white"
                size="md"
                onClick={onClose}
                className="text-xs font-black uppercase"
              >
                VOLVER A LA TIENDA
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
