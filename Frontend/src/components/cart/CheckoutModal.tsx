import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Check,
  Loader2,
  Upload
} from 'lucide-react';
import type { CartItem, AdminOrder, CheckoutFormData, RedeemedCoupon, User, UserAddress } from '../../types/types';
import { Button } from '../ui/Button';
import { ARGENTINA_PROVINCES, PROVINCE_NAMES } from '../../data/argentinaLocations';
import { CustomProductPreview } from '../customizer/CustomProductPreview';

import { handleProductImageError } from '../../types/types';
import { ValidationModal } from '../ui/ValidationModal';
import { ordersApi, paymentsRewardsApi, locationsApi, uploadApi } from '../../services/api';
import { mapBackendOrderToFrontend } from '../../services/mappers';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser?: User | null;
  redeemedCoupons?: RedeemedCoupon[];
  userAddresses?: UserAddress[];
  defaultAddress?: UserAddress;
  onCompleteCheckout: (order: AdminOrder, pointsEarned: number, appliedCouponCode?: string) => void;
  onNavigateToProfile?: (tab?: string) => void;
}

const formatPrice = (val: number | undefined | null): string => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toLocaleString('es-AR') : '0';
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  redeemedCoupons = [],
  userAddresses = [],
  defaultAddress,
  onCompleteCheckout,
  onNavigateToProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    shippingMethod: 'DELIVERY',
    street: defaultAddress?.street || '',
    number: defaultAddress?.number || '',
    floorDept: defaultAddress?.floorDept || '',
    city: defaultAddress?.city || '',
    province: defaultAddress?.province || '',
    zipCode: defaultAddress?.zipCode || '',
    couponCode: '',
    paymentMethod: 'MERCADO_PAGO',
  });

  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);

  // Applied Coupon State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0);
  const [isFreeShippingCoupon, setIsFreeShippingCoupon] = useState<boolean>(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [appliedCouponLabel, setAppliedCouponLabel] = useState<string>('');
  const [couponError, setCouponError] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Completed Order State for Step 4
  const [createdOrder, setCreatedOrder] = useState<AdminOrder | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [purchasedItemsSnapshot, setPurchasedItemsSnapshot] = useState<CartItem[]>([]);

  // Validation state (inline neobrutalist error banner)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [dbProvincias, setDbProvincias] = useState<Array<{ idProvincia: number; provincia: string }>>([]);
  const [dbLocalidades, setDbLocalidades] = useState<Array<{ idLocalidad: number; idProvincia: number; localidad: string }>>([]);

  useEffect(() => {
    paymentsRewardsApi.getPaymentMethods().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setPaymentMethods(res.data);
        setSelectedPaymentMethodId(res.data[0].idMetodoPago);
      }
    }).catch(() => {});

    Promise.all([locationsApi.getProvincias(), locationsApi.getLocalidades()])
      .then(([provRes, locRes]) => {
        if (provRes.success && Array.isArray(provRes.data)) {
          setDbProvincias(provRes.data);
        }
        if (locRes.success && Array.isArray(locRes.data)) {
          setDbLocalidades(locRes.data);
        }
      })
      .catch(() => {});
  }, []);

  const availableProvinces: string[] =
    dbProvincias.length > 0
      ? dbProvincias.map((p) => p.provincia)
      : PROVINCE_NAMES;

  const getCitiesForProvince = (provName: string): string[] => {
    if (!provName) return [];
    const foundDbProv = dbProvincias.find(
      (p) => p.provincia.toUpperCase() === provName.toUpperCase()
    );
    if (foundDbProv) {
      const dbCities = dbLocalidades
        .filter((l) => l.idProvincia === foundDbProv.idProvincia)
        .map((l) => l.localidad);
      if (dbCities.length > 0) return dbCities;
    }
    return ARGENTINA_PROVINCES[provName] || [];
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setValidationError(null);
      setCouponError('');
      setCreatedOrder(null);
      setDiscountPercent(0);
      setDiscountFixedAmount(0);
      setIsFreeShippingCoupon(false);
      setAppliedCouponCode('');
      setAppliedCouponLabel('');
      setPurchasedItemsSnapshot([]);
      setReceiptUrl('');
      setIsUploadingReceipt(false);
      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          name: currentUser.name || prev.name,
          email: currentUser.email || prev.email,
          phone: currentUser.phone || prev.phone,
        }));
      }
      if (userAddresses && userAddresses.length > 0) {
        const initialAddr = defaultAddress || userAddresses.find((a) => a.isDefault) || userAddresses[0];
        if (initialAddr) {
          setSelectedAddressId(initialAddr.id);
          setFormData((prev) => ({
            ...prev,
            street: initialAddr.street || prev.street,
            number: initialAddr.number || prev.number,
            floorDept: initialAddr.floorDept || prev.floorDept,
            city: initialAddr.city || prev.city,
            province: initialAddr.province || prev.province,
            zipCode: initialAddr.zipCode || prev.zipCode,
          }));
        }
      } else if (defaultAddress) {
        setFormData((prev) => ({
          ...prev,
          street: defaultAddress.street || prev.street,
          number: defaultAddress.number || prev.number,
          floorDept: defaultAddress.floorDept || prev.floorDept,
          city: defaultAddress.city || prev.city,
          province: defaultAddress.province || prev.province,
          zipCode: defaultAddress.zipCode || prev.zipCode,
        }));
      }
    }
  }, [isOpen, currentUser, defaultAddress, userAddresses]);

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      street: addr.street || '',
      number: addr.number || '',
      floorDept: addr.floorDept || '',
      city: addr.city || '',
      province: addr.province || '',
      zipCode: addr.zipCode || '',
    }));
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setFormData((prev) => ({
      ...prev,
      street: '',
      number: '',
      floorDept: '',
      city: '',
      province: '',
      zipCode: '',
    }));
  };

  // Ensure valid payment method if delivery chosen
  useEffect(() => {
    if (formData.shippingMethod === 'DELIVERY' && formData.paymentMethod === 'CASH') {
      setFormData((prev) => ({ ...prev, paymentMethod: 'MERCADO_PAGO' }));
    }
  }, [formData.shippingMethod, formData.paymentMethod]);

  if (!isOpen) return null;

  const safeItems = Array.isArray(items) ? items : [];
  const activeItems = step === 4 && safeItems.length === 0 ? purchasedItemsSnapshot : safeItems;

  // Pricing Calculations
  const rawSubtotal = activeItems.reduce((acc, item) => {
    const price = Number(item?.product?.price) || 0;
    const qty = Number(item?.quantity) || 1;
    return acc + price * qty;
  }, 0);

  const isFreeShipping = formData.shippingMethod === 'PICKUP' || isFreeShippingCoupon;
  const shippingCost = isFreeShipping ? 0 : 2500;
  
  // Coupon Discount (Percentage OR Fixed ARS Dollar Amount)
  const couponPercentAmount = (rawSubtotal * (Number(discountPercent) || 0)) / 100;
  const couponDiscountAmount = Math.min(rawSubtotal, couponPercentAmount + (Number(discountFixedAmount) || 0));
  
  // Payment Method Discount (from database metodos_pago or fallback)
  const activeDbPaymentMethod = paymentMethods.find((m) => m.idMetodoPago === selectedPaymentMethodId) || paymentMethods[0] || null;
  const paymentDiscountPercent = activeDbPaymentMethod
    ? Number(activeDbPaymentMethod.porcentajeDescuento || 0)
    : (formData.paymentMethod === 'TRANSFER' || formData.paymentMethod === 'CASH') ? 10 : 0;
  const paymentDiscountAmount = Math.max(0, ((rawSubtotal - couponDiscountAmount) * paymentDiscountPercent) / 100);

  const totalDiscount = couponDiscountAmount + paymentDiscountAmount;
  const finalTotal = Math.max(0, rawSubtotal - totalDiscount + shippingCost);
  const calculatedPoints = Math.floor(finalTotal / 100); // 1 punto por cada $100 ARS

  const handleApplyCoupon = async () => {
    setCouponError('');
    const rawCode = formData.couponCode ? formData.couponCode.trim() : '';
    const code = rawCode.toUpperCase();

    if (!code) {
      setCouponError('Ingresa un código de cupón.');
      return;
    }

    // Reset coupon application states before parsing new code
    setDiscountPercent(0);
    setDiscountFixedAmount(0);
    setIsFreeShippingCoupon(false);
    setAppliedCouponCode('');
    setAppliedCouponLabel('');

    // Check user redeemed coupons
    let foundCoupon = (redeemedCoupons || []).find(
      (c) => c?.code && c.code.toUpperCase() === code
    );

    // If not in local state, validate directly against PostgreSQL premios_cliente
    if (!foundCoupon) {
      try {
        const res = await paymentsRewardsApi.validateRewardCode(rawCode.toLowerCase());
        if (res.success && res.data && (res.data.valid || res.data.codigoPremio)) {
          const pc = res.data.data || res.data;
          const premio = pc.premio || {};
          foundCoupon = {
            id: String(pc.codigoPremio),
            rewardId: String(pc.idPremio || premio.idPremio || ''),
            rewardTitle: premio.titulo || 'Premio Buttoncat',
            code: String(pc.codigoPremio),
            discountValue: `${premio.titulo || ''} ${premio.descripcion || ''}`,
            pointsSpent: Number(pc.costoPuntos || premio.costoPuntos || 0),
            redeemedAt: new Date().toLocaleDateString('es-AR'),
            isUsed: pc.estado !== 'DISPONIBLE',
          };
        }
      } catch {
        // Fallback to invalid message below
      }
    }

    if (foundCoupon) {
      if (foundCoupon.isUsed) {
        setCouponError('ESTE CUPÓN YA FUE UTILIZADO EN UNA COMPRA ANTERIOR.');
        return;
      }
      const valStr = (foundCoupon.discountValue || '').toUpperCase();
      const titleStr = (foundCoupon.rewardTitle || '').toUpperCase();
      const fullText = `${valStr} ${titleStr}`;

      // 1. Check for Free Shipping
      if (fullText.includes('ENVÍO GRATIS') || fullText.includes('ENVIO GRATIS') || foundCoupon.rewardId === 'reward-2') {
        setIsFreeShippingCoupon(true);
        setAppliedCouponCode(foundCoupon.code);
        setAppliedCouponLabel('ENVÍO GRATIS');
        return;
      }

      // 2. Check for Fixed Dollar Amount Vouchers ($1.500, $3.500, etc.)
      const dollarMatch = fullText.match(/\$\s*([\d.]+)/);
      if (dollarMatch) {
        const parsedAmount = parseFloat(dollarMatch[1].replace(/\./g, ''));
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          setDiscountFixedAmount(parsedAmount);
          setAppliedCouponCode(foundCoupon.code);
          setAppliedCouponLabel(`$${formatPrice(parsedAmount)} ARS OFF`);
          return;
        }
      }

      // 3. Check for Percentage Discounts (20% OFF, 15% OFF, 50% OFF)
      const pctMatch = fullText.match(/(\d+)%/);
      if (pctMatch) {
        const pct = parseInt(pctMatch[1], 10);
        if (!isNaN(pct) && pct > 0) {
          setDiscountPercent(pct);
          setAppliedCouponCode(foundCoupon.code);
          setAppliedCouponLabel(`${pct}% OFF`);
          return;
        }
      }

      // 4. Physical Product Reward Coupon (Targeted product discount)
      if (foundCoupon.productId) {
        const matchingItem = items.find(
          (item) => item.product.id === foundCoupon.productId || item.productId === foundCoupon.productId
        );
        if (matchingItem) {
          if (matchingItem.isRewardClaim) {
            setAppliedCouponCode(foundCoupon.code);
            setAppliedCouponLabel('PREMIO RECLAMADO ($0)');
            return;
          }
          setDiscountFixedAmount(matchingItem.product.price);
          setAppliedCouponCode(foundCoupon.code);
          setAppliedCouponLabel(`100% OFF EN ${matchingItem.product.name.slice(0, 16)}`);
          return;
        } else {
          setCouponError(`Para aplicar este cupón, primero debes agregar "${foundCoupon.rewardTitle}" a tu carrito.`);
          return;
        }
      }

      // 5. Free product / Gift Vouchers without specific productId
      if (fullText.includes('GRATIS') || fullText.includes('REGALO') || fullText.includes('SORPRESA')) {
        setAppliedCouponCode(foundCoupon.code);
        setAppliedCouponLabel('REGALO INCLUIDO');
        return;
      }

      // Default fallback
      setDiscountPercent(10);
      setAppliedCouponCode(foundCoupon.code);
      setAppliedCouponLabel('10% OFF');
    } else {
      setCouponError('Código inválido o ya utilizado.');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountPercent(0);
    setDiscountFixedAmount(0);
    setIsFreeShippingCoupon(false);
    setAppliedCouponCode('');
    setAppliedCouponLabel('');
    setFormData((prev) => ({ ...prev, couponCode: '' }));
  };

  const handleNextStep = () => {
    setValidationError(null);
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setValidationError('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
        return;
      }
      if (
        formData.shippingMethod === 'DELIVERY' && 
        (!formData.street.trim() || !formData.number.trim() || !formData.province.trim() || !formData.city.trim() || !formData.zipCode.trim())
      ) {
        setValidationError('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS DE ENVÍO (*).');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleConfirmOrder = async () => {
    setValidationError(null);
    const currentItems = activeItems.length > 0 ? activeItems : safeItems;
    if (currentItems.length === 0) {
      setValidationError('EL CARRITO ESTA VACIO.');
      return;
    }

    setIsSubmitting(true);
    setPurchasedItemsSnapshot(currentItems);

    try {
      // 1. Resolver metodo de pago desde base de datos
      let resolvedPaymentMethodId = selectedPaymentMethodId || 1;
      if (!selectedPaymentMethodId && paymentMethods.length > 0) {
        if (formData.paymentMethod === 'TRANSFER') {
          const found = paymentMethods.find((p) => p.nombreMetodoPago?.toLowerCase().includes('transferencia'));
          if (found) resolvedPaymentMethodId = found.idMetodoPago;
        } else if (formData.paymentMethod === 'CASH') {
          const found = paymentMethods.find((p) => p.nombreMetodoPago?.toLowerCase().includes('efectivo'));
          if (found) resolvedPaymentMethodId = found.idMetodoPago;
        } else {
          const found = paymentMethods.find((p) => p.nombreMetodoPago?.toLowerCase().includes('mercado'));
          if (found) resolvedPaymentMethodId = found.idMetodoPago;
        }
      }

      // 2. Mapear items del carrito hacia formato de persistencia PostgreSQL
      const orderItemsPayload = currentItems.map((item) => {
        const isCustom = Boolean(item.customizationSpecs || item.product?.id?.toString().startsWith('custom-'));
        if (isCustom) {
          const isRealUuid = item.product?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product.id);
          return {
            idProductoCustom: isRealUuid ? item.product.id : undefined,
            customProduct: {
              nombre: item.customizationSpecs?.customName || item.product?.name || 'Producto Personalizado',
              categoria: item.customizationSpecs?.category || item.product?.category || 'CUSTOM',
              precio: item.customizationSpecs?.calculatedPrice || item.product?.price || 1500,
              comentario: item.customizationSpecs?.customDescription || item.customizationDetails || undefined,
              imagenSubidaClienteUrl: item.customizationSpecs?.customImage || item.product?.image || undefined,
              transformImagenSubida: item.customizationSpecs?.imageTransforms || undefined,
              opciones: item.customizationSpecs?.options || item.selectedOptions || undefined,
            },
            cantidad: item.quantity || 1,
          };
        }

        let variantId: number | undefined;
        if (item.product?.rawVariants && item.product.rawVariants.length > 0) {
          if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
            const matched = item.product.rawVariants.find((v) => {
              if (!v.opciones || v.opciones.length === 0) return false;
              return Object.entries(item.selectedOptions!).every(([varName, optName]) => {
                return v.opciones!.some((o: any) => {
                  const ov = o.opcionVariacion || o;
                  const groupName = ov.variacion?.nombreVariacion || '';
                  return groupName.trim().toUpperCase() === varName.trim().toUpperCase() && ov.nombreOpcion?.trim() === optName.trim();
                });
              });
            });
            variantId = matched?.idVariante;
          }
          if (!variantId) {
            variantId = item.product.rawVariants[0]?.idVariante;
          }
        }

        return {
          idVariante: variantId,
          idProducto: !variantId && !isNaN(Number(item.product?.id)) ? Number(item.product.id) : undefined,
          esCanjePremio: Boolean(item.isRewardClaim),
          codigoPremio: item.rewardCouponCode || undefined,
          cantidad: item.quantity || 1,
        };
      });

      const autoRewardCoupon =
        appliedCouponCode ||
        currentItems.find((it) => it.rewardCouponCode)?.rewardCouponCode ||
        undefined;

      // 3. Crear pedido en el backend
      const res = await ordersApi.create({
        idCliente: currentUser?.id && !isNaN(Number(currentUser.id)) ? Number(currentUser.id) : undefined,
        idMetodoPago: resolvedPaymentMethodId,
        codigoPremio: autoRewardCoupon,
        nombreCompleto: formData.name.trim(),
        correoContacto: formData.email.trim(),
        telefonoContacto: formData.phone.trim(),
        provinciaEntrega: formData.shippingMethod === 'DELIVERY' ? (formData.province.trim() || 'Buenos Aires') : 'CABA',
        localidadEntrega: formData.shippingMethod === 'DELIVERY' ? (formData.city.trim() || 'Capital Federal') : 'Palermo',
        calleEntrega: formData.shippingMethod === 'DELIVERY' ? (formData.street.trim() || 'Gorriti') : 'Gorriti',
        alturaEntrega: formData.shippingMethod === 'DELIVERY' && formData.number ? Number(formData.number) || 0 : 4800,
        codigoPostal: formData.shippingMethod === 'DELIVERY' ? (formData.zipCode.trim() || '1414') : '1414',
        deptoEntrega: formData.shippingMethod === 'DELIVERY' && formData.floorDept.trim() ? formData.floorDept.trim() : undefined,
        comprobanteUrl: receiptUrl || undefined,
        costoDeEnvio: shippingCost,
        items: orderItemsPayload,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'No se pudo registrar el pedido en la base de datos.');
      }

      const persistedOrder = mapBackendOrderToFrontend(res.data);
      const points = Math.floor(Number(res.data.total || finalTotal) / 100);

      setCreatedOrder(persistedOrder);
      setEarnedPoints(points);
      setStep(4);
      onCompleteCheckout(persistedOrder, points, autoRewardCoupon);
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      setValidationError(err.message || 'Ocurrio un error al procesar el pedido. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderCode = () => {
    if (createdOrder?.id) {
      navigator.clipboard.writeText(createdOrder.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-9999 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 min-h-dvh"
    >
      <div 
        className="w-full max-w-3xl bg-white border-3 sm:border-4 border-black shadow-brutal sm:shadow-brutal-xl overflow-hidden flex flex-col my-auto max-h-[92dvh] relative"
      >
        
        {/* HEADER MODAL */}
        <div className="bg-brand-yellow p-3 sm:p-4 border-b-3 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[2.5] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black uppercase text-black font-display tracking-wide truncate">
                CHECKOUT - PROCESO DE COMPRA
              </h2>
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase text-gray-800 truncate">
                Paso {step} de 4 {step === 1 ? '• Datos de Envío' : step === 2 ? '• Resumen y Cupones' : step === 3 ? '• Método de Pago' : '• Confirmación'}
              </p>
            </div>
          </div>
          {step < 4 && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm shrink-0 cursor-pointer"
              title="Cerrar checkout"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="grid grid-cols-4 border-b-3 border-black bg-gray-100 text-[9px] xs:text-[10px] sm:text-[11px] font-black uppercase text-center shrink-0">
          <div className={`py-1.5 sm:py-2 border-r-2 border-black transition-colors ${step >= 1 ? 'bg-brand-cyan text-black' : 'text-gray-400'}`}>
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
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1">
          {step < 4 && activeItems.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 stroke-[1.5]" />
              <h3 className="text-lg font-black uppercase text-black">TU CARRITO ESTÁ VACÍO</h3>
              <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                No tienes ningún producto en tu carrito para finalizar la compra.
              </p>
              <Button variant="yellow" size="md" onClick={onClose} className="font-black uppercase shadow-brutal">
                EXPLORAR CATÁLOGO
              </Button>
            </div>
          ) : (
            <>
          {step === 1 && (
            <div className="space-y-6">
              
              {/* CONTACT DATA */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-black flex items-center gap-2 border-b-2 border-black pb-1">
                  <UserIcon className="w-4 h-4 text-black" /> INFORMACIÓN DE CONTACTO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-customer-name" className="block text-[11px] font-black uppercase mb-1">Nombre Completo *</label>
                    <input
                      id="checkout-customer-name"
                      name="customerName"
                      aria-label="Nombre Completo"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white focus:bg-yellow-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-customer-email" className="block text-[11px] font-black uppercase mb-1">Email de Confirmación *</label>
                    <input
                      id="checkout-customer-email"
                      name="customerEmail"
                      aria-label="Email de Confirmación"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white focus:bg-yellow-50 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="checkout-customer-phone" className="block text-[11px] font-black uppercase mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      id="checkout-customer-phone"
                      name="customerPhone"
                      aria-label="Teléfono Móvil (WhatsApp)"
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
                  <Truck className="w-4 h-4 text-black" /> OPCIÓN DE ENTREGAS Y ENVÍO
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

                  {/* SAVED ADDRESSES SELECTOR */}
                  {userAddresses.length > 0 && (
                    <div className="space-y-2 pb-3 border-b-2 border-black">
                      <label className="text-[10px] font-black uppercase text-black flex items-center justify-between">
                        <span>MIS DOMICILIOS GUARDADOS:</span>
                        <span className="text-[10px] text-gray-600 font-bold">{userAddresses.length} DISPONIBLE(S)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {userAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-2.5 border-2 border-black cursor-pointer transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-brand-yellow font-black shadow-brutal-sm ring-2 ring-black'
                                  : 'bg-white hover:bg-yellow-100 font-bold'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-black text-white border border-black flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-brand-yellow" />
                                  {addr.label}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[9px] font-black uppercase bg-brand-purple text-white px-1.5 py-0.5 border border-black">
                                    PRINCIPAL
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] leading-snug text-gray-900 mt-1">
                                {addr.street} {addr.number} {addr.floorDept ? `(${addr.floorDept})` : ''}
                              </p>
                              <p className="text-[10px] text-gray-700 font-bold">
                                {addr.city}, {addr.province}
                              </p>
                            </div>
                          );
                        })}

                        <div
                          onClick={handleSelectNewAddress}
                          className={`p-2.5 border-2 border-black border-dashed cursor-pointer transition-all flex items-center justify-center text-center text-xs font-black uppercase ${
                            selectedAddressId === 'new'
                              ? 'bg-brand-yellow border-solid shadow-brutal-sm ring-2 ring-black'
                              : 'bg-white hover:bg-yellow-100 text-gray-700'
                          }`}
                        >
                          + OTRO DOMICILIO / NUEVO
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="checkout-shipping-street" className="block text-[10px] font-black uppercase mb-1">Calle / Av *</label>
                      <input
                        id="checkout-shipping-street"
                        name="shippingStreet"
                        aria-label="Calle o Avenida"
                        type="text"
                        value={formData.street}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, street: e.target.value });
                        }}
                        className={`w-full border-2 p-1.5 text-xs font-bold bg-white ${
                          validationError && !formData.street.trim() ? 'border-red-600 bg-red-50 ring-2 ring-red-500' : 'border-black'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-number" className="block text-[10px] font-black uppercase mb-1">Altura *</label>
                      <input
                        id="checkout-shipping-number"
                        name="shippingNumber"
                        aria-label="Altura o número"
                        type="text"
                        value={formData.number}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, number: e.target.value });
                        }}
                        className={`w-full border-2 p-1.5 text-xs font-bold bg-white ${
                          validationError && !formData.number.trim() ? 'border-red-600 bg-red-50 ring-2 ring-red-500' : 'border-black'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-floor" className="block text-[10px] font-black uppercase mb-1">Piso / Depto</label>
                      <input
                        id="checkout-shipping-floor"
                        name="shippingFloorDept"
                        aria-label="Piso y Departamento"
                        type="text"
                        value={formData.floorDept}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, floorDept: e.target.value });
                        }}
                        className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-province" className="block text-[10px] font-black uppercase mb-1">Provincia *</label>
                      <select
                        id="checkout-shipping-province"
                        name="shippingProvince"
                        aria-label="Provincia de envío"
                        value={formData.province}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, province: e.target.value, city: '' });
                        }}
                        className={`w-full border-2 p-1.5 text-xs font-bold bg-white cursor-pointer ${
                          validationError && !formData.province.trim() ? 'border-red-600 bg-red-50 ring-2 ring-red-500' : 'border-black'
                        }`}
                      >
                        <option value="">Seleccionar...</option>
                        {availableProvinces.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-city" className="block text-[10px] font-black uppercase mb-1">Ciudad / Localidad *</label>
                      <select
                        id="checkout-shipping-city"
                        name="shippingCity"
                        aria-label="Ciudad o Localidad de envío"
                        value={formData.city}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, city: e.target.value });
                        }}
                        className={`w-full border-2 p-1.5 text-xs font-bold bg-white cursor-pointer ${
                          validationError && !formData.city.trim() ? 'border-red-600 bg-red-50 ring-2 ring-red-500' : 'border-black'
                        }`}
                        disabled={!formData.province}
                      >
                        <option value="">{formData.province ? 'Seleccionar...' : 'Elegir provincia primero'}</option>
                        {getCitiesForProvince(formData.province).map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                        {formData.city && formData.province && !getCitiesForProvince(formData.province).includes(formData.city) && (
                          <option key={formData.city} value={formData.city}>{formData.city}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="checkout-shipping-zipcode" className="block text-[10px] font-black uppercase mb-1">Código Postal *</label>
                      <input
                        id="checkout-shipping-zipcode"
                        name="shippingZipCode"
                        aria-label="Código Postal"
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => {
                          setSelectedAddressId('custom');
                          setFormData({ ...formData, zipCode: e.target.value });
                        }}
                        className={`w-full border-2 p-1.5 text-xs font-bold bg-white ${
                          validationError && !formData.zipCode.trim() ? 'border-red-600 bg-red-50 ring-2 ring-red-500' : 'border-black'
                        }`}
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
                  <ShoppingBag className="w-4 h-4" /> ARTÍCULOS EN EL PEDIDO ({activeItems.reduce((a, b) => a + (b.quantity || 1), 0)})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-2 border-black p-2.5 bg-white shadow-brutal-sm">
                      <div className="flex items-center gap-3">
                        {item.customizationSpecs ? (
                          <div className="w-12 h-12 border border-black bg-yellow-100 overflow-hidden relative shrink-0">
                            <CustomProductPreview
                              category={item.customizationSpecs.category}
                              options={item.customizationSpecs.options || {}}
                              customImage={item.customizationSpecs.customImage}
                              imageTransforms={item.customizationSpecs.imageTransforms}
                              compact
                              hideHeader
                            />
                          </div>
                        ) : (
                          <img
                            src={item.product?.image || ''}
                            alt={item.product?.name || 'Producto'}
                            onError={handleProductImageError}
                            className="w-12 h-12 object-cover border border-black bg-yellow-100 shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-xs font-black uppercase text-black">{item.product?.name || 'Producto'}</p>
                          <p className="text-[10px] font-bold text-gray-500">Cantidad: {item.quantity || 1} x ${formatPrice(item.product?.price)}</p>
                          {item.customizationSpecs && (
                            <div className="space-y-0.5 mt-0.5">
                              <span className="bg-brand-pink text-white border border-black text-[9px] px-1 font-black uppercase">CUSTOM</span>
                              {item.customizationSpecs.customDescription && (
                                <p className="text-[10px] font-bold text-gray-600 italic">"{item.customizationSpecs.customDescription}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-sm text-black">
                        ${formatPrice((item.product?.price || 0) * (item.quantity || 1))}
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
                      <ShieldCheck className="w-4 h-4" /> CUPÓN APLICADO: {appliedCouponCode} {appliedCouponLabel ? `(${appliedCouponLabel})` : ''}
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
                      id="checkout-coupon-code"
                      name="couponCode"
                      aria-label="Código de descuento o cupón de premio"
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
                  <span>${formatPrice(rawSubtotal)}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-black">
                    <span>Descuento cupón {appliedCouponLabel ? `(${appliedCouponLabel})` : ''}:</span>
                    <span>-${formatPrice(couponDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 uppercase">Costo de envío ({formData.shippingMethod === 'PICKUP' ? 'Retiro en local' : 'PAQ.AR Domicilio'}):</span>
                  <span>{shippingCost === 0 ? 'GRATIS' : `$${formatPrice(shippingCost)}`}</span>
                </div>
                <div className="border-t-2 border-black pt-2 flex justify-between text-lg font-black text-black">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="text-xl text-black">${formatPrice(finalTotal)}</span>
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
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => {
                    const isSelected = (activeDbPaymentMethod?.idMetodoPago || selectedPaymentMethodId) === method.idMetodoPago;
                    const pct = Number(method.porcentajeDescuento || 0);
                    const nameUpper = (method.nombreMetodoPago || '').toUpperCase();
                    const isTransfer = nameUpper.includes('TRANSFER');
                    const isCash = nameUpper.includes('EFECTIVO') || nameUpper.includes('CASH');

                    return (
                      <div
                        key={method.idMetodoPago}
                        onClick={() => {
                          setSelectedPaymentMethodId(method.idMetodoPago);
                          setFormData({
                            ...formData,
                            paymentMethod: isTransfer ? 'TRANSFER' : isCash ? 'CASH' : 'MERCADO_PAGO',
                          });
                        }}
                        className={`border-3 border-black p-4 cursor-pointer transition-all shadow-brutal-sm flex items-start gap-4 ${
                          isSelected
                            ? 'bg-yellow-100 border-black ring-2 ring-black'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 text-white ${
                          isTransfer ? 'bg-brand-purple' : isCash ? 'bg-brand-pink' : 'bg-sky-400'
                        }`}>
                          {isTransfer ? (
                            <Building2 className="w-5 h-5" />
                          ) : isCash ? (
                            <Banknote className="w-5 h-5" />
                          ) : (
                            <CreditCard className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-sm uppercase text-black">{method.nombreMetodoPago}</h4>
                            {pct > 0 ? (
                              <span className="bg-green-400 text-black border border-black text-[9px] font-black px-1.5 uppercase">
                                {pct}% OFF EXTRA
                              </span>
                            ) : (
                              <span className="bg-sky-200 border border-black text-[9px] font-black px-1.5 uppercase">
                                DISPONIBLE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-bold text-gray-600 mt-0.5">
                            {pct > 0
                              ? `Abona con ${method.nombreMetodoPago} y obtén un ${pct}% de descuento directo en tu orden.`
                              : `Pago habilitado mediante ${method.nombreMetodoPago}.`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* MERCADO PAGO FALLBACK */}
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
                          Tarjetas de crédito, débito o dinero en cuenta de Mercado Pago.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* BANK / ALIAS DETAILS BOX IF CONFIGURED ON SELECTED METHOD */}
              {activeDbPaymentMethod?.datosBancarios ? (
                <div className="border-2 border-black p-3 bg-purple-50 space-y-2 text-xs font-bold text-black">
                  <p className="font-black uppercase text-brand-purple">DATOS E INSTRUCCIONES DE PAGO:</p>
                  <p className="whitespace-pre-line">{activeDbPaymentMethod.datosBancarios}</p>
                </div>
              ) : formData.paymentMethod === 'TRANSFER' ? (
                <div className="border-2 border-black p-3 bg-purple-50 space-y-2 text-xs font-bold text-black">
                  <p className="font-black uppercase text-brand-purple">DATOS PARA TRANSFERIR (ALIAS):</p>
                  <p><span className="text-gray-600 uppercase">ALIAS:</span> BUTTONCAT.TIENDA</p>
                </div>
              ) : null}

              {/* RECEIPT UPLOAD FOR BANK TRANSFER */}
              {(formData.paymentMethod === 'TRANSFER' || Boolean(activeDbPaymentMethod?.datosBancarios)) && (
                <div className="border-2 border-black p-3 bg-yellow-50 space-y-2 text-xs font-bold text-black">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase text-black">
                      COMPROBANTE DE TRANSFERENCIA (OPCIONAL):
                    </span>
                    <label className="px-2.5 py-1 bg-black text-white border border-black text-[10px] font-black uppercase cursor-pointer hover:bg-brand-pink transition-colors inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      {isUploadingReceipt ? 'SUBIENDO...' : receiptUrl ? 'CAMBIAR ARCHIVO' : 'ADJUNTAR COMPROBANTE'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingReceipt(true);
                          try {
                            const url = await uploadApi.uploadImageWithFallback(file, 'buttoncat/receipts');
                            if (url) setReceiptUrl(url);
                          } finally {
                            setIsUploadingReceipt(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {receiptUrl && (
                    <div className="flex items-center justify-between bg-white border border-black p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={receiptUrl} alt="Comprobante" className="w-8 h-8 object-cover border border-black shrink-0" />
                        <span className="text-[10px] font-black text-green-700 uppercase truncate">
                          ✓ Comprobante adjuntado correctamente
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptUrl('')}
                        className="text-[10px] font-black text-red-600 underline uppercase ml-2 shrink-0 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FINAL CHECKOUT BREAKDOWN SUMMARY */}
              <div className="border-3 border-black p-4 bg-gray-50 space-y-1.5 text-xs font-extrabold text-black">
                <div className="flex justify-between">
                  <span>MÉTODO DE PAGO:</span>
                  <span className="uppercase text-brand-purple">
                    {activeDbPaymentMethod
                      ? `${activeDbPaymentMethod.nombreMetodoPago}${paymentDiscountPercent > 0 ? ` (${paymentDiscountPercent}% OFF Aplicado)` : ''}`
                      : formData.paymentMethod}
                  </span>
                </div>
                {paymentDiscountPercent > 0 && (
                  <div className="flex justify-between text-green-700 font-black">
                    <span>DESCUENTO ({activeDbPaymentMethod?.nombreMetodoPago?.toUpperCase() || formData.paymentMethod} {paymentDiscountPercent}%):</span>
                    <span>-${formatPrice(paymentDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black border-t border-black pt-2">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-xl text-black">${formatPrice(finalTotal)}</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: ORDEN CONFIRMADA Y EXITOSA */}
          {step === 4 && (
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
                  Hemos enviado la confirmación y los detalles del pedido a <span className="font-black text-black">{createdOrder?.customerEmail || formData.email}</span>.
                </p>
              </div>

              {/* ORDER NUMBER BOX */}
              <div className="border-3 border-black bg-brand-yellow p-4 shadow-brutal max-w-sm mx-auto space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-800">CÓDIGO DE SEGUIMIENTO:</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-black tracking-wider">{createdOrder?.id || 'BTC-0000'}</span>
                  <button
                    onClick={copyOrderCode}
                    className="p-1 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="block text-[10px] font-bold text-black uppercase">
                  MÉTODO: {createdOrder?.paymentMethod || 'Pago Online'} • TOTAL: ${formatPrice(createdOrder?.total ?? finalTotal)}
                </span>
              </div>

              {/* POINTS REWARDED */}
              <div className="border-2 border-black bg-purple-100 p-3 max-w-sm mx-auto flex items-center justify-center gap-2 text-xs font-black text-brand-purple">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>¡HAS GANADO +{earnedPoints} PUNTOS BUTTONCAT!</span>
              </div>

            </div>
          )}
          </>
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

          {activeItems.length > 0 && step < 3 && (
            <Button
              variant="purple"
              size="md"
              onClick={handleNextStep}
              className="text-xs font-black uppercase ml-auto"
            >
              CONTINUAR <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {activeItems.length > 0 && step === 3 && (
            <Button
              variant="pink"
              size="lg"
              disabled={isSubmitting}
              onClick={handleConfirmOrder}
              className="text-sm font-black uppercase ml-auto"
            >
              {isSubmitting ? (
                <>
                  PROCESANDO PEDIDO... <Loader2 className="w-5 h-5 ml-1 animate-spin" />
                </>
              ) : (
                <>
                  CONFIRMAR Y PAGAR SERVICIO <CheckCircle2 className="w-5 h-5 ml-1" />
                </>
              )}
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
                    if (onNavigateToProfile) {
                      onNavigateToProfile('PEDIDOS');
                    }
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

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!validationError}
        title="DATOS REQUERIDOS"
        message={validationError || ''}
        onClose={() => setValidationError(null)}
      />
    </div>,
    document.body
  );
};
