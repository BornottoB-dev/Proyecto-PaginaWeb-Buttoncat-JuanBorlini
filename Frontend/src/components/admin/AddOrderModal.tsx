import React, { useState, useEffect, type FC } from 'react';
import { X, Save, PlusCircle, ShoppingBag, Plus, Trash2, User, Package, Check, Sparkles } from 'lucide-react';
import {
  type Product,
  type AdminOrder,
  type OrderStatus,
  type RewardItem,
  hasProductVariations,
  getProductEffectiveVariations,
  getDefaultOptionsForProduct,
  calculateEffectiveProductPrice,
  getAllCombinations,
  getCombinationKey,
  getCombinationStock,
  getSpanishFormattedDate,
} from '../../types/types';
import type { AdminCustomer } from './AddEditCustomerModal';
import { ValidationModal } from '../ui/ValidationModal';
import { locationsApi, paymentsRewardsApi, customProductsApi } from '../../services/api';
import { getCustomCategoriesData } from '../../data/customStore';
import { mapBackendRewardToFrontend } from '../../services/mappers';

export interface OrderItemLine {
  id: string;
  productId?: string;
  variantId?: number;
  selectedOptions?: Record<string, string>;
  productName: string;
  quantity: number;
  unitPrice: number;
  optionsText?: string;
  isCustom?: boolean;
  customType?: 'WORKSHOP' | 'MANUAL';
  templateCategory?: string;
}

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: AdminOrder) => void;
  orderToEdit?: AdminOrder | null;
  products?: Product[];
  customers?: AdminCustomer[];
  rewards?: RewardItem[];
  isDarkMode?: boolean;
}

export const AddOrderModal: FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  products = [],
  customers = [],
  rewards = [],
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
  const [shippingProvince, setShippingProvince] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [carrier, setCarrier] = useState('Andreani');
  const [paymentStatus, setPaymentStatus] = useState<'PAGADO' | 'PENDIENTE'>('PAGADO');
  const [paymentMethod, setPaymentMethod] = useState('Dinero Digital');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>(undefined);

  // DB Reference Tables (Geografía, Métodos de Pago & Premios)
  const [dbProvincias, setDbProvincias] = useState<Array<{ idProvincia: number; provincia: string }>>([]);
  const [dbLocalidades, setDbLocalidades] = useState<Array<{ idLocalidad: number; idProvincia: number; localidad: string; provincia?: { idProvincia: number; provincia: string } }>>([]);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<Array<{ idMetodoPago: number; nombreMetodoPago: string; porcentajeDescuento?: number; activo?: boolean }>>([]);
  const [dbRewards, setDbRewards] = useState<RewardItem[]>([]);
  const [clientAvailableCoupons, setClientAvailableCoupons] = useState<Array<{ codigoPremio: string; titulo: string; descripcion: string; precioVariante?: number }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    locationsApi.getProvincias().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDbProvincias(res.data);
      }
    }).catch(() => {});
    locationsApi.getLocalidades().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDbLocalidades(res.data);
      }
    }).catch(() => {});
    paymentsRewardsApi.getPaymentMethods(false).then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDbPaymentMethods(res.data);
      }
    }).catch(() => {});
    paymentsRewardsApi.getRewards(false).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDbRewards(res.data.map(mapBackendRewardToFrontend));
      }
    }).catch(() => {});
    customProductsApi.getTemplates().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDbWorkshopTemplates(res.data.filter((t: any) => t.activo !== false));
      }
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    const custIdNum = Number(selectedCustomerId);
    if (!isOpen || selectedCustomerId === 'MANUAL' || isNaN(custIdNum) || custIdNum <= 0) {
      setClientAvailableCoupons([]);
      return;
    }
    paymentsRewardsApi.getClientRewards(custIdNum).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const available = res.data
          .filter((pc: any) => pc.estado === 'DISPONIBLE' && (!pc.fechaExpiracion || new Date(pc.fechaExpiracion) > new Date()))
          .map((pc: any) => ({
            codigoPremio: String(pc.codigoPremio),
            titulo: pc.premio?.titulo || 'Premio Canjeado',
            descripcion: pc.premio?.descripcion || '',
          }));
        setClientAvailableCoupons(available);
      } else {
        setClientAvailableCoupons([]);
      }
    }).catch(() => setClientAvailableCoupons([]));
  }, [selectedCustomerId, isOpen]);

  const effectiveRewardsList = dbRewards.length > 0 ? dbRewards : rewards;

  const applyRewardDiscountText = (rawText: string, codeToSet: string) => {
    setAppliedCouponCode(codeToSet);
    const subVal = Number(subtotal) || orderItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const upper = rawText.toUpperCase();
    const pctMatch = upper.match(/(\d+)\s*%/);
    const amountMatch = upper.match(/\$\s*([\d.]+)/);

    let computedDisc = 0;
    if (pctMatch) {
      const pct = Number(pctMatch[1]);
      if (pct > 0 && pct <= 100 && subVal > 0) {
        computedDisc = Math.round(subVal * (pct / 100));
      }
    } else if (amountMatch) {
      const amt = Number(amountMatch[1].replace(/\./g, ''));
      if (amt > 0) {
        computedDisc = amt;
      }
    }

    if (computedDisc > 0) {
      setDiscountAmount(computedDisc);
      setTotal(Math.max(0, subVal - computedDisc));
    }
  };

  // Tabulated Order Items
  const [orderItems, setOrderItems] = useState<OrderItemLine[]>([]);

  // Item Builder controls (Catalog product)
  const [builderProductId, setBuilderProductId] = useState<string>('');
  const [builderQuantity, setBuilderQuantity] = useState<number>(1);
  const [builderSelectedOptions, setBuilderSelectedOptions] = useState<Record<string, string>>({});

  const resolveRawVariant = (prod: Product, selectedOptions: Record<string, string>) => {
    if (!prod.rawVariants || prod.rawVariants.length === 0) return undefined;
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      const matched = prod.rawVariants.find((v) => {
        if (!v.opciones || v.opciones.length === 0) return false;
        return Object.entries(selectedOptions).every(([varName, optName]) =>
          v.opciones!.some((o: any) => {
            const ov = o.opcionVariacion || o;
            const groupName = ov.variacion?.nombreVariacion || '';
            return (
              groupName.trim().toUpperCase() === varName.trim().toUpperCase() &&
              ov.nombreOpcion?.trim() === optName.trim()
            );
          })
        );
      });
      if (matched) return matched;
    }
    return prod.rawVariants[0];
  };

  const getVariantEffectivePrice = (prod: Product, selectedOptions: Record<string, string>): number => {
    const rawVar = resolveRawVariant(prod, selectedOptions);
    if (rawVar && Number(rawVar.precioFinal) > 0) {
      return Number(rawVar.precioFinal);
    }
    return calculateEffectiveProductPrice(prod, selectedOptions);
  };

  const getVariantEffectiveStock = (prod: Product, selectedOptions: Record<string, string>): number => {
    if (hasProductVariations(prod)) {
      const rawVar = resolveRawVariant(prod, selectedOptions);
      if (rawVar && rawVar.opciones && rawVar.opciones.length > 0 && typeof rawVar.stock === 'number') {
        return rawVar.stock;
      }
      return getCombinationStock(prod, selectedOptions);
    }
    return prod.stock ?? 0;
  };

  const formatSelectedOptionsText = (options: Record<string, string>): string => {
    const entries = Object.entries(options).filter(([, val]) => Boolean(val));
    if (entries.length === 0) return '';
    return entries.map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ');
  };

  const handleProductSelectChange = (prodId: string) => {
    setBuilderProductId(prodId);
    setBuilderQuantity(1);
    const prod = products.find((p) => p.id === prodId);
    if (prod && hasProductVariations(prod)) {
      const combos = getAllCombinations(prod);
      const firstAvailable = combos.find((c) => getVariantEffectiveStock(prod, c) > 0) || combos[0] || getDefaultOptionsForProduct(prod);
      setBuilderSelectedOptions(firstAvailable);
    } else {
      setBuilderSelectedOptions({});
    }
  };

  // Builder Mode ('CATALOG' | 'WORKSHOP' | 'MANUAL')
  const [addItemMode, setAddItemMode] = useState<'CATALOG' | 'WORKSHOP' | 'MANUAL'>('CATALOG');

  // Workshop Item Builder controls
  const [dbWorkshopTemplates, setDbWorkshopTemplates] = useState<any[]>([]);
  const [workshopTemplateId, setWorkshopTemplateId] = useState<string>('');
  const [workshopCustomName, setWorkshopCustomName] = useState<string>('');
  const [workshopUnitPrice, setWorkshopUnitPrice] = useState<number | ''>('');
  const [workshopQuantity, setWorkshopQuantity] = useState<number>(1);
  const [workshopNotes, setWorkshopNotes] = useState<string>('');

  // Custom Manual Item Builder controls
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemQuantity, setCustomItemQuantity] = useState<number>(1);
  const [customItemUnitPrice, setCustomItemUnitPrice] = useState<number | ''>('');
  const [customItemNotes, setCustomItemNotes] = useState<string>('');

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
      setShippingProvince(orderToEdit.shippingProvince || matchingCust?.province || '');
      setShippingCity(orderToEdit.shippingCity || matchingCust?.city || '');
      setCarrier(orderToEdit.carrier || 'Andreani');
      setPaymentStatus(orderToEdit.paymentStatus || 'PAGADO');
      const matchedMp = dbPaymentMethods.find(
        (mp) =>
          (orderToEdit.idMetodoPago && Number(mp.idMetodoPago) === Number(orderToEdit.idMetodoPago)) ||
          mp.nombreMetodoPago.toLowerCase() === (orderToEdit.paymentMethod || '').toLowerCase()
      );
      if (matchedMp) {
        setPaymentMethod(matchedMp.nombreMetodoPago);
        setSelectedPaymentMethodId(Number(matchedMp.idMetodoPago));
      } else {
        setPaymentMethod(orderToEdit.paymentMethod || (dbPaymentMethods[0]?.nombreMetodoPago ?? 'Transferencia / Digital'));
        setSelectedPaymentMethodId(orderToEdit.idMetodoPago ?? (dbPaymentMethods[0] ? Number(dbPaymentMethods[0].idMetodoPago) : undefined));
      }

      // Seed order items from structured items or summary
      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setOrderItems(
          orderToEdit.items.map((it, idx) => ({
            id: `line-${Date.now()}-${idx}`,
            productId: it.productId,
            variantId: it.variantId,
            selectedOptions: it.selectedOptions,
            productName: it.productName,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            optionsText: it.optionsText,
            isCustom: it.isCustom,
            customType: it.customType || (it.isCustom ? (orderToEdit.isCustomOrder ? 'WORKSHOP' : 'MANUAL') : undefined),
            templateCategory: it.templateCategory,
          }))
        );
      } else if (orderToEdit.itemsSummary) {
        const initialLines: OrderItemLine[] = [
          {
            id: `line-${Date.now()}`,
            productName: orderToEdit.itemsSummary,
            quantity: orderToEdit.itemsCount || 1,
            unitPrice: Math.round(orderToEdit.total / (orderToEdit.itemsCount || 1)),
            isCustom: true,
            customType: orderToEdit.isCustomOrder ? 'WORKSHOP' : 'MANUAL',
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
      setShippingProvince('');
      setShippingCity('');
      setCarrier('Andreani');
      setPaymentStatus('PAGADO');
      const firstMp = dbPaymentMethods[0];
      setPaymentMethod(firstMp ? firstMp.nombreMetodoPago : 'Transferencia / Digital');
      setSelectedPaymentMethodId(firstMp ? Number(firstMp.idMetodoPago) : undefined);
      setOrderItems([]);
      setWorkshopTemplateId('');
      setWorkshopCustomName('');
      setWorkshopUnitPrice('');
      setWorkshopQuantity(1);
      setWorkshopNotes('');
      setCustomItemName('');
      setCustomItemQuantity(1);
      setCustomItemUnitPrice('');
      setCustomItemNotes('');
      setIsAutoSummary(true);
    }
  }, [orderToEdit, isOpen, dbPaymentMethods]);

  // Handle Customer Selector change
  const handleCustomerSelectChange = (custVal: string) => {
    setSelectedCustomerId(custVal);
    if (custVal === 'MANUAL') {
      setCustomerName('');
      setCustomerEmail('');
      setShippingDestination('');
      setShippingProvince('');
      setShippingCity('');
    } else {
      const cust = customers.find((c) => c.id === custVal);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerEmail(cust.email);
        const defaultAddr = cust.addresses?.find((a) => a.isDefault) || cust.addresses?.[0];
        const streetVal = defaultAddr?.street || cust.address || '';
        const cityVal = defaultAddr?.city || cust.city || '';
        const provVal = defaultAddr?.province || cust.province || '';
        setShippingDestination(streetVal);
        setShippingCity(cityVal);
        setShippingProvince(provVal);
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

    const prodHasVariations = hasProductVariations(prod);
    if (prodHasVariations && Object.keys(builderSelectedOptions).length === 0) {
      setValidationModalMsg('SELECCIONA UNA VARIANTE DE LA TABLA PARA AGREGAR ESTE PRODUCTO.');
      return;
    }

    const availableStock = getVariantEffectiveStock(prod, builderSelectedOptions);
    const formattedOptions = prodHasVariations ? formatSelectedOptionsText(builderSelectedOptions) : undefined;
    const matchedRawVariant = resolveRawVariant(prod, builderSelectedOptions);

    // Check if this exact product + variant is already in orderItems
    const existingLineIndex = orderItems.findIndex(
      (item) =>
        !item.isCustom &&
        item.productId === prod.id &&
        (item.optionsText || '') === (formattedOptions || '')
    );
    const alreadyAddedQty = existingLineIndex !== -1 ? orderItems[existingLineIndex].quantity : 0;
    const requestedQty = Math.max(1, builderQuantity);

    if (availableStock <= 0) {
      setValidationModalMsg('LA VARIANTE SELECCIONADA NO TIENE STOCK DISPONIBLE.');
      return;
    }

    if (alreadyAddedQty + requestedQty > availableStock) {
      setValidationModalMsg(
        `STOCK INSUFICIENTE PARA ESTA VARIANTE (DISPONIBLE: ${availableStock}, EN PEDIDO: ${alreadyAddedQty}).`
      );
      return;
    }

    const effectiveUnitPrice = getVariantEffectivePrice(prod, builderSelectedOptions);

    let updatedItems: OrderItemLine[];
    if (existingLineIndex !== -1) {
      updatedItems = orderItems.map((item, idx) =>
        idx === existingLineIndex
          ? { ...item, quantity: item.quantity + requestedQty, unitPrice: effectiveUnitPrice }
          : item
      );
    } else {
      const newLine: OrderItemLine = {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        variantId: matchedRawVariant?.idVariante,
        selectedOptions: prodHasVariations ? { ...builderSelectedOptions } : undefined,
        productName: prod.name,
        quantity: requestedQty,
        unitPrice: effectiveUnitPrice,
        optionsText: formattedOptions,
        isCustom: false,
      };
      updatedItems = [...orderItems, newLine];
    }

    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);

    setBuilderProductId('');
    setBuilderQuantity(1);
    setBuilderSelectedOptions({});
    setValidationModalMsg(null);
  };

  const storeTemplates = getCustomCategoriesData();
  const effectiveWorkshopTemplates =
    dbWorkshopTemplates.length > 0
      ? dbWorkshopTemplates
      : storeTemplates.map((c) => ({
          idPlantillaCustom: c.backendId || c.id,
          nombrePlantilla: c.name,
          precioBase: c.basePrice,
          descripcion: c.description,
          imagenBaseUrl: c.baseImage,
        }));

  const handleWorkshopTemplateChange = (tplId: string) => {
    setWorkshopTemplateId(tplId);
    const found = effectiveWorkshopTemplates.find(
      (t: any) => String(t.idPlantillaCustom || t.id || t.nombrePlantilla || t.name) === tplId
    );
    if (found) {
      const baseP = Number(found.precioBase ?? found.basePrice ?? 0);
      setWorkshopUnitPrice(baseP > 0 ? baseP : '');
    }
  };

  // Add Workshop Custom Product to Order Items
  const handleAddWorkshopProduct = () => {
    const found = effectiveWorkshopTemplates.find(
      (t: any) => String(t.idPlantillaCustom || t.id || t.nombrePlantilla || t.name) === workshopTemplateId
    );
    if (!found) {
      setValidationModalMsg('SELECCIONA UNA PLANTILLA ACTIVA DEL TALLER CUSTOM.');
      return;
    }
    if (!workshopUnitPrice || Number(workshopUnitPrice) <= 0) {
      setValidationModalMsg('INGRESA UN PRECIO UNITARIO VÁLIDO PARA EL PRODUCTO CUSTOM.');
      return;
    }

    const tplName = found.nombrePlantilla || found.name;
    const finalName = workshopCustomName.trim()
      ? `${tplName}: ${workshopCustomName.trim()}`
      : tplName;

    const newLine: OrderItemLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productName: finalName,
      quantity: Math.max(1, workshopQuantity),
      unitPrice: Number(workshopUnitPrice),
      optionsText: workshopNotes.trim() || undefined,
      isCustom: true,
      customType: 'WORKSHOP',
      templateCategory: tplName,
    };

    const updatedItems = [...orderItems, newLine];
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);
    setIsCustomOrder(true);

    setWorkshopTemplateId('');
    setWorkshopCustomName('');
    setWorkshopUnitPrice('');
    setWorkshopQuantity(1);
    setWorkshopNotes('');
    setValidationModalMsg(null);
  };

  // Add Custom Manual Item to Order Items
  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemUnitPrice || Number(customItemUnitPrice) <= 0) {
      setValidationModalMsg('INGRESA UN NOMBRE Y PRECIO UNITARIO VÁLIDO PARA EL ARTÍCULO A MEDIDA.');
      return;
    }

    const newLine: OrderItemLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productName: customItemName.trim(),
      quantity: Math.max(1, customItemQuantity),
      unitPrice: Number(customItemUnitPrice),
      optionsText: customItemNotes.trim() || undefined,
      isCustom: true,
      customType: 'MANUAL',
    };

    const updatedItems = [...orderItems, newLine];
    setOrderItems(updatedItems);
    recalculateOrderTotals(updatedItems);

    setCustomItemName('');
    setCustomItemQuantity(1);
    setCustomItemUnitPrice('');
    setCustomItemNotes('');
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

    const matchedCustomer = selectedCustomerId !== 'MANUAL' ? customers.find((c) => c.id === selectedCustomerId) : undefined;

    const fullDestination = [shippingDestination.trim(), shippingCity.trim(), shippingProvince.trim()]
      .filter(Boolean)
      .join(', ');

    const orderData: AdminOrder = {
      id: orderToEdit ? orderToEdit.id : 'NEW',
      customerId: matchedCustomer ? matchedCustomer.id : orderToEdit?.customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: matchedCustomer?.phone || orderToEdit?.customerPhone,
      date: getSpanishFormattedDate(startDate || new Date()),
      estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
      subtotal: finalSubtotal,
      discountAmount: finalDiscount > 0 ? finalDiscount : undefined,
      appliedCouponCode: appliedCouponCode.trim() ? appliedCouponCode.trim().toUpperCase() : undefined,
      total: finalTotal,
      status,
      itemsCount: computedItemsCount,
      itemsSummary: finalSummary,
      isCustomOrder: Boolean(isCustomOrder || orderItems.some((i) => i.isCustom && i.customType === 'WORKSHOP')),
      hasManualCustomItems: Boolean(orderItems.some((i) => i.isCustom && i.customType === 'MANUAL')),
      salesChannel,
      hasShipping,
      shippingDestination: fullDestination || (hasShipping ? 'CABA / GBA' : 'Retiro en Local'),
      shippingAddress: shippingDestination.trim() || fullDestination,
      shippingProvince: shippingProvince.trim() || undefined,
      shippingCity: shippingCity.trim() || undefined,
      carrier: hasShipping ? carrier : 'Retiro en Tienda',
      paymentStatus,
      paymentMethod,
      idMetodoPago: selectedPaymentMethodId,
      items: orderItems.length > 0 ? orderItems : undefined,
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
                  Calle y Altura / Domicilio
                </label>
                <input
                  id="order-customer-address-input"
                  name="shippingDestination"
                  aria-label="Dirección o domicilio"
                  type="text"
                  value={shippingDestination}
                  onChange={(e) => setShippingDestination(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234"
                  className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="order-customer-province-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Provincia (Geografía)
                </label>
                <select
                  id="order-customer-province-select"
                  name="shippingProvince"
                  aria-label="Provincia de entrega"
                  value={shippingProvince}
                  onChange={(e) => {
                    const nextProv = e.target.value;
                    setShippingProvince(nextProv);
                    const provObj = dbProvincias.find((p) => p.provincia === nextProv);
                    if (provObj) {
                      const locsForProv = dbLocalidades.filter(
                        (l) => Number(l.idProvincia || l.provincia?.idProvincia) === Number(provObj.idProvincia)
                      );
                      setShippingCity(locsForProv[0]?.localidad || '');
                    } else {
                      setShippingCity('');
                    }
                  }}
                  className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                  }`}
                >
                  <option value="">-- Seleccionar Provincia --</option>
                  {dbProvincias.map((p) => (
                    <option key={p.idProvincia} value={p.provincia}>
                      {p.provincia}
                    </option>
                  ))}
                  {shippingProvince && !dbProvincias.some((p) => p.provincia === shippingProvince) && (
                    <option value={shippingProvince}>{shippingProvince}</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="order-customer-city-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Localidad (Geografía)
                </label>
                {(() => {
                  const selectedProvObj = dbProvincias.find((p) => p.provincia === shippingProvince);
                  const filteredLocs = selectedProvObj
                    ? dbLocalidades.filter(
                        (l) => Number(l.idProvincia || l.provincia?.idProvincia) === Number(selectedProvObj.idProvincia)
                      )
                    : dbLocalidades;
                  return (
                    <select
                      id="order-customer-city-select"
                      name="shippingCity"
                      aria-label="Localidad de entrega"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                      }`}
                    >
                      <option value="">-- Seleccionar Localidad --</option>
                      {filteredLocs.map((l) => (
                        <option key={l.idLocalidad} value={l.localidad}>
                          {l.localidad}
                        </option>
                      ))}
                      {shippingCity && !filteredLocs.some((l) => l.localidad === shippingCity) && (
                        <option value={shippingCity}>{shippingCity}</option>
                      )}
                    </select>
                  );
                })()}
              </div>

              {(() => {
                const selectedCust = selectedCustomerId !== 'MANUAL' ? customers.find((c) => c.id === selectedCustomerId) : undefined;
                if (!selectedCust || !selectedCust.addresses || selectedCust.addresses.length <= 1) return null;
                return (
                  <div className="sm:col-span-3">
                    <label htmlFor="order-customer-saved-addr-select" className={`block text-[10px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Domicilios guardados de {selectedCust.name} ({selectedCust.addresses.length})
                    </label>
                    <select
                      id="order-customer-saved-addr-select"
                      aria-label="Seleccionar domicilio guardado del cliente"
                      onChange={(e) => {
                        const addr = selectedCust.addresses?.find((a) => a.id === e.target.value);
                        if (addr) {
                          setShippingDestination(addr.street);
                          setShippingCity(addr.city);
                          setShippingProvince(addr.province);
                        }
                      }}
                      className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-800'
                      }`}
                    >
                      {selectedCust.addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.isDefault ? '[PRINCIPAL] ' : ''}{addr.street} • {addr.city}, {addr.province}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
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

            {/* BUILDER MODE SELECTOR */}
            <div className={`p-1.5 rounded-xl border flex flex-wrap sm:flex-nowrap items-center gap-1.5 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-100 border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => setAddItemMode('CATALOG')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addItemMode === 'CATALOG'
                    ? (isDarkMode ? 'bg-slate-800 text-white shadow-xs border border-slate-700' : 'bg-white text-gray-900 shadow-xs border border-gray-300')
                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                }`}
              >
                <Package className="w-3.5 h-3.5" /> 1. Catálogo Estándar
              </button>
              <button
                type="button"
                onClick={() => setAddItemMode('WORKSHOP')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addItemMode === 'WORKSHOP'
                    ? (isDarkMode ? 'bg-pink-950/70 text-pink-300 shadow-xs border border-pink-700/60' : 'bg-pink-100 text-pink-800 shadow-xs border border-pink-300')
                    : (isDarkMode ? 'text-slate-400 hover:text-pink-300' : 'text-gray-600 hover:text-pink-700')
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> 2. Taller Custom ({effectiveWorkshopTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setAddItemMode('MANUAL')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addItemMode === 'MANUAL'
                    ? (isDarkMode ? 'bg-amber-950/70 text-amber-300 shadow-xs border border-amber-700/60' : 'bg-amber-100 text-amber-800 shadow-xs border border-amber-300')
                    : (isDarkMode ? 'text-slate-400 hover:text-amber-300' : 'text-gray-600 hover:text-amber-700')
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" /> 3. Artículo a Medida
              </button>
            </div>

            {/* 1. PRODUCT BUILDER FORM FROM CATALOG */}
            {addItemMode === 'CATALOG' && (
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase block ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  1. AGREGAR PRODUCTO DEL CATÁLOGO
                </span>
                {selectedCatalogProd && hasProductVariations(selectedCatalogProd) && (
                  <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-brand-cyan' : 'text-blue-600'}`}>
                    Selecciona la variante en la tabla inferior
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    id="order-catalog-product-select"
                    name="builderProductId"
                    aria-label="Seleccionar producto cargado del catálogo"
                    value={builderProductId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
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
                  {selectedCatalogProd && hasProductVariations(selectedCatalogProd) ? (
                    <select
                      id="order-catalog-variant-select"
                      name="builderVariantCombo"
                      aria-label="Seleccionar variante tabulada del producto"
                      value={getCombinationKey(builderSelectedOptions)}
                      onChange={(e) => {
                        const combos = getAllCombinations(selectedCatalogProd);
                        const chosen = combos.find((c) => getCombinationKey(c) === e.target.value);
                        if (chosen) {
                          setBuilderSelectedOptions(chosen);
                          const stk = getVariantEffectiveStock(selectedCatalogProd, chosen);
                          if (stk > 0 && builderQuantity > stk) {
                            setBuilderQuantity(stk);
                          }
                        }
                      }}
                      className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                      }`}
                    >
                      {getAllCombinations(selectedCatalogProd).map((combo) => {
                        const comboKey = getCombinationKey(combo);
                        const comboStock = getVariantEffectiveStock(selectedCatalogProd, combo);
                        const comboPrice = getVariantEffectivePrice(selectedCatalogProd, combo);
                        return (
                          <option key={comboKey} value={comboKey} disabled={comboStock <= 0}>
                            {formatSelectedOptionsText(combo)} — Stock: {comboStock} (${comboPrice.toFixed(2)})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div
                      className={`w-full rounded-lg p-2 text-xs font-semibold border select-none truncate ${
                        isDarkMode
                          ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      {selectedCatalogProd
                        ? `Variante Única (Stock disp.: ${selectedCatalogProd.stock})`
                        : 'Sin variantes (elige un producto)'}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <input
                    id="order-catalog-quantity-input"
                    name="builderQuantity"
                    aria-label="Cantidad de producto del catálogo"
                    type="number"
                    min={1}
                    max={
                      selectedCatalogProd
                        ? Math.max(1, getVariantEffectiveStock(selectedCatalogProd, builderSelectedOptions))
                        : undefined
                    }
                    value={builderQuantity}
                    onChange={(e) => {
                      const rawVal = parseInt(e.target.value) || 1;
                      if (selectedCatalogProd) {
                        const maxStk = Math.max(1, getVariantEffectiveStock(selectedCatalogProd, builderSelectedOptions));
                        setBuilderQuantity(Math.min(Math.max(1, rawVal), maxStk));
                      } else {
                        setBuilderQuantity(Math.max(1, rawVal));
                      }
                    }}
                    placeholder="Cant."
                    className={`w-full rounded-lg p-2 text-xs text-center font-bold border focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* TABULATED PRODUCT VARIANTS MATRIX */}
              {selectedCatalogProd && hasProductVariations(selectedCatalogProd) && (
                <div className={`border rounded-xl overflow-hidden ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/60'
                }`}>
                  <div className={`px-3 py-1.5 border-b flex items-center justify-between text-[10px] font-bold uppercase ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}>
                    <span>Variantes Tabuladas de {selectedCatalogProd.name}</span>
                    <span>Haz clic en una fila para elegir la variante</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className={`uppercase text-[10px] font-bold border-b sticky top-0 ${
                        isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <tr>
                          <th className="p-2 w-10 text-center">ELEGIR</th>
                          {getProductEffectiveVariations(selectedCatalogProd).map((group) => (
                            <th key={group.name} className="p-2">
                              {group.name}
                            </th>
                          ))}
                          <th className="p-2">SKU</th>
                          <th className="p-2">PRECIO UNIT.</th>
                          <th className="p-2 text-right">STOCK DISP.</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/70' : 'divide-gray-200/70'}`}>
                        {getAllCombinations(selectedCatalogProd).map((combo) => {
                          const comboKey = getCombinationKey(combo);
                          const isSelected = getCombinationKey(builderSelectedOptions) === comboKey;
                          const comboStock = getVariantEffectiveStock(selectedCatalogProd, combo);
                          const comboPrice = getVariantEffectivePrice(selectedCatalogProd, combo);
                          const rawVar = resolveRawVariant(selectedCatalogProd, combo);
                          const formattedOpts = formatSelectedOptionsText(combo);
                          const inOrderQty = orderItems
                            .filter(
                              (item) =>
                                !item.isCustom &&
                                item.productId === selectedCatalogProd.id &&
                                (item.optionsText || '') === formattedOpts
                            )
                            .reduce((acc, item) => acc + item.quantity, 0);
                          const remainingStock = Math.max(0, comboStock - inOrderQty);
                          const isOutOfStock = remainingStock <= 0;

                          return (
                            <tr
                              key={comboKey}
                              onClick={() => {
                                if (!isOutOfStock) {
                                  setBuilderSelectedOptions(combo);
                                  if (builderQuantity > remainingStock) {
                                    setBuilderQuantity(Math.max(1, remainingStock));
                                  }
                                }
                              }}
                              className={`transition-colors ${
                                isOutOfStock
                                  ? 'opacity-45 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                isSelected
                                  ? isDarkMode
                                    ? 'bg-emerald-950/40 text-emerald-200'
                                    : 'bg-emerald-50 text-emerald-950'
                                  : isDarkMode
                                  ? 'hover:bg-slate-800/70'
                                  : 'hover:bg-white'
                              }`}
                            >
                              <td className="p-2 text-center">
                                <span
                                  className={`inline-flex w-4 h-4 rounded-full items-center justify-center border ${
                                    isSelected
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : isDarkMode
                                      ? 'border-slate-600'
                                      : 'border-gray-400'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                              </td>
                              {getProductEffectiveVariations(selectedCatalogProd).map((group) => (
                                <td key={group.name} className="p-2 font-bold">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] border ${
                                      isSelected
                                        ? isDarkMode
                                          ? 'bg-emerald-900/60 border-emerald-600 text-emerald-200'
                                          : 'bg-emerald-100 border-emerald-400 text-emerald-900'
                                        : isDarkMode
                                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                                        : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                  >
                                    {combo[group.name] || '-'}
                                  </span>
                                </td>
                              ))}
                              <td className={`p-2 font-mono text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {rawVar?.sku || selectedCatalogProd.sku || '-'}
                              </td>
                              <td className="p-2 font-bold">
                                ${comboPrice.toFixed(2)}
                              </td>
                              <td className="p-2 text-right font-bold">
                                {isOutOfStock ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-500 border border-red-500/30">
                                    SIN STOCK
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    {remainingStock} disp.{inOrderQty > 0 ? ` (${inOrderQty} en pedido)` : ''}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {selectedCatalogProd ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Precio unitario: ${getVariantEffectivePrice(selectedCatalogProd, builderSelectedOptions).toFixed(2)}
                    </span>
                    {hasProductVariations(selectedCatalogProd) && Object.keys(builderSelectedOptions).length > 0 && (
                      <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Variante activa: {formatSelectedOptionsText(builderSelectedOptions)} (Stock: {getVariantEffectiveStock(selectedCatalogProd, builderSelectedOptions)})
                      </span>
                    )}
                  </div>
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
            )}

            {/* 2. TALLER CUSTOM PRODUCT BUILDER */}
            {addItemMode === 'WORKSHOP' && (
              <div className={`p-3.5 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-slate-950 border-pink-900/40' : 'bg-pink-50/30 border-pink-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-700'}`}>
                    <Sparkles className="w-3.5 h-3.5" /> 2. AGREGAR PRODUCTO DESDE EL TALLER CUSTOM
                  </span>
                  <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Plantillas activas de Buttoncat Studio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Plantilla de Personalización:
                    </label>
                    <select
                      id="order-workshop-template-select"
                      name="workshopTemplateId"
                      aria-label="Seleccionar plantilla de Taller Custom"
                      value={workshopTemplateId}
                      onChange={(e) => handleWorkshopTemplateChange(e.target.value)}
                      className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer uppercase ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    >
                      <option value="">-- Seleccionar plantilla custom ({effectiveWorkshopTemplates.length}) --</option>
                      {effectiveWorkshopTemplates.map((t: any) => {
                        const tId = String(t.id || t.idPlantillaCustom || t.nombrePlantilla || t.name);
                        const tName = t.nombrePlantilla || t.name;
                        const tPrice = Number(t.precioBase ?? t.basePrice ?? 0);
                        return (
                          <option key={tId} value={tId}>
                            {tName} {tPrice > 0 ? `(Base: $${tPrice.toLocaleString('es-AR')})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Detalle / Nombre Personalizado:
                    </label>
                    <input
                      id="order-workshop-custom-name-input"
                      name="workshopCustomName"
                      aria-label="Detalle o nombre personalizado"
                      type="text"
                      value={workshopCustomName}
                      onChange={(e) => setWorkshopCustomName(e.target.value)}
                      placeholder="Ej: Llavero Bob con nombre Juan"
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Precio Unit. ($):
                    </label>
                    <input
                      id="order-workshop-price-input"
                      name="workshopUnitPrice"
                      aria-label="Precio unitario de producto taller custom"
                      type="number"
                      step="0.01"
                      value={workshopUnitPrice}
                      onChange={(e) => setWorkshopUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Cant.:
                    </label>
                    <input
                      id="order-workshop-quantity-input"
                      name="workshopQuantity"
                      aria-label="Cantidad de producto taller custom"
                      type="number"
                      min={1}
                      value={workshopQuantity}
                      onChange={(e) => setWorkshopQuantity(parseInt(e.target.value) || 1)}
                      placeholder="1"
                      className={`w-full rounded-lg p-2 text-xs text-center font-bold border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 items-center">
                  <div className="sm:col-span-9">
                    <input
                      id="order-workshop-notes-input"
                      name="workshopNotes"
                      aria-label="Notas de personalización / opciones seleccionadas"
                      type="text"
                      value={workshopNotes}
                      onChange={(e) => setWorkshopNotes(e.target.value)}
                      placeholder="Opciones / Especificaciones (ej: Color Rosa, Estampa Dorada, Capa A3)"
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddWorkshopProduct}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isDarkMode ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Custom
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MANUAL CUSTOM ITEM BUILDER */}
            {addItemMode === 'MANUAL' && (
              <div className={`p-3.5 rounded-xl border space-y-3 ${
                isDarkMode ? 'bg-slate-950 border-amber-900/40' : 'bg-amber-50/30 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    <PlusCircle className="w-3.5 h-3.5" /> 3. AGREGAR ARTÍCULO A MEDIDA / MANUAL
                  </span>
                  <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Para remitos, arreglos o ítems personalizados fuera de catálogo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Nombre o Concepto del Artículo:
                    </label>
                    <input
                      id="order-custom-item-name-input"
                      name="customItemName"
                      aria-label="Nombre o concepto del artículo a medida"
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Ej: Remera Estampa Frente A4, Bordado especial..."
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Precio Unitario ($):
                    </label>
                    <input
                      id="order-custom-item-price-input"
                      name="customItemUnitPrice"
                      aria-label="Precio unitario a medida"
                      type="number"
                      step="0.01"
                      value={customItemUnitPrice}
                      onChange={(e) => setCustomItemUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Cant.:
                    </label>
                    <input
                      id="order-custom-item-quantity-input"
                      name="customItemQuantity"
                      aria-label="Cantidad de artículo a medida"
                      type="number"
                      min={1}
                      value={customItemQuantity}
                      onChange={(e) => setCustomItemQuantity(parseInt(e.target.value) || 1)}
                      placeholder="1"
                      className={`w-full rounded-lg p-2 text-xs text-center font-bold border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 items-center">
                  <div className="sm:col-span-9">
                    <input
                      id="order-custom-item-notes-input"
                      name="customItemNotes"
                      aria-label="Notas u observaciones del artículo a medida"
                      type="text"
                      value={customItemNotes}
                      onChange={(e) => setCustomItemNotes(e.target.value)}
                      placeholder="Observaciones opcionales (ej: Talle L, color suministrado por cliente)"
                      className={`w-full rounded-lg p-2 text-xs font-medium border focus:outline-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border ${
                        isDarkMode
                          ? 'bg-amber-950/80 hover:bg-amber-900/80 text-amber-200 border-amber-700/60'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Artículo
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                              <span className={`text-[9px] font-bold block ${
                                item.customType === 'WORKSHOP'
                                  ? 'text-pink-600 dark:text-pink-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                {item.customType === 'WORKSHOP'
                                  ? `TALLER CUSTOM • ${item.templateCategory || 'PERSONALIZADO'}`
                                  : 'ARTÍCULO A MEDIDA'}
                              </span>
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
                onChange={(e) => {
                  const nextName = e.target.value;
                  setPaymentMethod(nextName);
                  const matchedMp = dbPaymentMethods.find((mp) => mp.nombreMetodoPago === nextName);
                  if (matchedMp) {
                    setSelectedPaymentMethodId(Number(matchedMp.idMetodoPago));
                    const pct = Number(matchedMp.porcentajeDescuento || 0);
                    const subVal = Number(subtotal) || orderItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
                    if (pct > 0 && subVal > 0) {
                      const autoDisc = Math.round(subVal * (pct / 100));
                      setDiscountAmount(autoDisc);
                      setTotal(Math.max(0, subVal - autoDisc));
                    }
                  } else {
                    setSelectedPaymentMethodId(undefined);
                  }
                }}
                className={`w-full rounded-lg p-2 text-xs font-semibold border focus:outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                }`}
              >
                {dbPaymentMethods.length > 0 ? (
                  dbPaymentMethods.map((mp) => {
                    const pct = Number(mp.porcentajeDescuento || 0);
                    return (
                      <option key={mp.idMetodoPago} value={mp.nombreMetodoPago}>
                        {mp.nombreMetodoPago}{pct > 0 ? ` (-${pct}% OFF)` : ''}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="Transferencia / Digital">Transferencia / Digital</option>
                    <option value="Efectivo en Local">Efectivo en Local</option>
                  </>
                )}
                {paymentMethod &&
                  dbPaymentMethods.length > 0 &&
                  !dbPaymentMethods.some((mp) => mp.nombreMetodoPago === paymentMethod) && (
                    <option value={paymentMethod}>{paymentMethod}</option>
                  )}
              </select>
            </div>

            <label htmlFor="order-is-custom-order-checkbox" className="flex items-center justify-between pt-4 cursor-pointer">
              <div className="flex flex-col pr-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  ¿ES PEDIDO TALLER CUSTOM?
                </span>
                <span className={`text-[9px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  Marca si requiere confección en el taller custom
                </span>
              </div>
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
                  <label htmlFor="order-coupon-select" className={`block text-[11px] font-bold uppercase mb-1 tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    PREMIO / CUPÓN DE DESCUENTO
                  </label>
                  <div className="space-y-1.5">
                    <select
                      id="order-coupon-select"
                      aria-label="Seleccionar cupón o premio cargado"
                      value={appliedCouponCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setAppliedCouponCode('');
                          return;
                        }
                        const matchedClientCoupon = clientAvailableCoupons.find((c) => c.codigoPremio === val);
                        if (matchedClientCoupon) {
                          applyRewardDiscountText(
                            `${matchedClientCoupon.titulo} ${matchedClientCoupon.descripcion}`,
                            matchedClientCoupon.codigoPremio
                          );
                          return;
                        }
                        const matchedReward = effectiveRewardsList.find(
                          (r) => `${r.codePrefix || 'REWARD'}-${r.id}`.toUpperCase() === val.toUpperCase()
                        );
                        if (matchedReward) {
                          applyRewardDiscountText(
                            `${matchedReward.discountValue} ${matchedReward.title} ${matchedReward.description}`,
                            val.toUpperCase()
                          );
                          return;
                        }
                        setAppliedCouponCode(val);
                      }}
                      className={`w-full rounded-lg p-2 text-xs font-bold border focus:outline-none cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400' : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900'
                      }`}
                    >
                      <option value="">-- Sin cupón / Código manual --</option>
                      {clientAvailableCoupons.length > 0 && (
                        <optgroup label="Cupones Canjeados del Cliente (PostgreSQL)">
                          {clientAvailableCoupons.map((cc) => (
                            <option key={cc.codigoPremio} value={cc.codigoPremio}>
                              [CUPÓN CLIENTE] {cc.titulo} ({cc.codigoPremio.slice(0, 8)}...)
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {effectiveRewardsList.length > 0 && (
                        <optgroup label="Premios y Promociones del Club">
                          {effectiveRewardsList.map((rw) => {
                            const codeStr = `${rw.codePrefix || 'REWARD'}-${rw.id}`.toUpperCase();
                            return (
                              <option key={rw.id} value={codeStr}>
                                {rw.title} ({rw.discountValue})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                      {appliedCouponCode &&
                        !clientAvailableCoupons.some((c) => c.codigoPremio === appliedCouponCode) &&
                        !effectiveRewardsList.some(
                          (r) => `${r.codePrefix || 'REWARD'}-${r.id}`.toUpperCase() === appliedCouponCode.toUpperCase()
                        ) && <option value={appliedCouponCode}>{appliedCouponCode}</option>}
                    </select>
                    <input
                      id="order-coupon-input"
                      name="appliedCouponCode"
                      aria-label="Cupón o código de descuento"
                      type="text"
                      value={appliedCouponCode}
                      onChange={(e) => setAppliedCouponCode(e.target.value)}
                      placeholder="Código o UUID de cupón..."
                      className={`w-full rounded-lg p-1.5 text-[11px] font-mono font-bold border focus:outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-slate-400' : 'bg-gray-50 border-gray-300 text-gray-800 focus:border-gray-900'
                      }`}
                    />
                  </div>
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
