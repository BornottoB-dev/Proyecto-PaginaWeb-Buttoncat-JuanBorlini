export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop';

export const handleProductImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_PRODUCT_IMAGE) {
    target.src = DEFAULT_PRODUCT_IMAGE;
  }
};

export type ProductCategory = 
  | 'LLAVEROS / PELUCHES' 
  | 'STICKERS' 
  | 'POSTERS' 
  | 'PINES' 
  | 'ARITOS' 
  | 'COLLARES' 
  | 'REMERAS'
  | 'PINTURAS';

export type ProductStyle = string;
export type ProductVibe = ProductStyle;

export interface CategoryVariationTypeItem {
  id?: string;
  name: string; // Ej: "Talle", "Color", "Tamaño", "Tipo de tela"
  options: (string | ProductVariationOption)[];
  required?: boolean;
}

export interface CategoryItem {
  id: string; // Primary Key
  name: string;
  emoji?: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
  variationTypes?: ProductVariationGroup[]; // Dynamic variant types linked to this category
}

export interface StyleItem {
  id: string; // Primary Key
  name: string;
  emoji?: string;
  badgeBg?: string;
}
export type VibeItem = StyleItem;

export interface BadgeItem {
  id: string; // Primary Key
  name: string;
  badgeBg?: string;
}
export type TagItem = BadgeItem;

export interface ProductVariationOption {
  label: string; // Ej: "XXL" o "Plata 925"
  priceDelta?: number; // Ej: 1500 (adiciona $1.500 al precio base)
  stock?: number; // Stock específico de esta variante
}

export interface ProductVariationGroup {
  name: string; // Ej: "Talle", "Largo de Cadena", "Color"
  options: (string | ProductVariationOption)[];
}

export const getOptionLabel = (opt: string | ProductVariationOption): string => {
  if (typeof opt === 'string') return opt;
  return opt.label;
};

export const getOptionPriceDelta = (opt: string | ProductVariationOption): number => {
  if (typeof opt === 'string') return 0;
  return opt.priceDelta || 0;
};

export const getOptionStock = (opt: string | ProductVariationOption): number | undefined => {
  if (typeof opt === 'string') return undefined;
  return opt.stock;
};

export const getSuggestedVariationsForCategory = (
  categoryNameOrId: string,
  categories?: CategoryItem[]
): ProductVariationGroup[] => {
  const cleanKey = (categoryNameOrId || '').trim().toUpperCase();

  // 1. Dynamic lookup from Category entities if available
  if (categories && categories.length > 0) {
    const matchedCategory = categories.find(
      (c) => c.id.toUpperCase() === cleanKey || c.name.trim().toUpperCase() === cleanKey
    );
    if (matchedCategory?.variationTypes && matchedCategory.variationTypes.length > 0) {
      return matchedCategory.variationTypes.map((vt) => ({
        name: vt.name,
        options: vt.options.map((opt) => getOptionLabel(opt)),
      }));
    }
  }

  return [];
};

export const getDefaultVariationsForCategory = (
  category: string,
  categories?: CategoryItem[]
): ProductVariationGroup[] => {
  return getSuggestedVariationsForCategory(category, categories);
};

export const getProductEffectiveVariations = (
  product: Product,
  categories?: CategoryItem[]
): ProductVariationGroup[] => {
  if (product.isUnique) return [];
  if (product.hasVariations === false) return [];
  if (product.variations !== undefined) {
    return product.variations;
  }
  return getSuggestedVariationsForCategory(product.category, categories);
};

export const hasProductVariations = (product: Product): boolean => {
  if (product.isUnique) return false;
  if (product.hasVariations === false) return false;
  const groups = getProductEffectiveVariations(product);
  return Boolean(
    groups &&
    groups.length > 0 &&
    groups.some((g) => g.options && g.options.length > 0)
  );
};

export const getDefaultOptionsForProduct = (product: Product): Record<string, string> => {
  if (!hasProductVariations(product)) return {};
  const groups = getProductEffectiveVariations(product);

  const options: Record<string, string> = {};
  groups.forEach((g) => {
    if (g.options && g.options.length > 0) {
      // Pick first option with available stock (or no explicit 0 stock)
      const availableOpt = g.options.find((opt) => {
        const stk = getOptionStock(opt);
        return stk === undefined || stk > 0;
      });
      options[g.name] = getOptionLabel(availableOpt || g.options[0]);
    }
  });
  return options;
};

export const calculateEffectiveProductPrice = (product: Product, options?: Record<string, string>): number => {
  if (!options || !hasProductVariations(product)) return product.price;
  const groups = getProductEffectiveVariations(product);

  let additional = 0;
  groups.forEach((g) => {
    const chosenLabel = options[g.name];
    if (chosenLabel) {
      const foundOpt = g.options.find((opt) => getOptionLabel(opt) === chosenLabel);
      if (foundOpt) {
        additional += getOptionPriceDelta(foundOpt);
      }
    }
  });
  return product.price + additional;
};

export const getCombinationKey = (options: Record<string, string>): string => {
  const keys = Object.keys(options).sort();
  return keys.map((k) => `${k.trim()}:${options[k].trim()}`).join(' | ');
};

export const parseCombinationKey = (key: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!key) return result;
  const parts = key.split(' | ');
  parts.forEach((p) => {
    const colonIdx = p.indexOf(':');
    if (colonIdx !== -1) {
      const name = p.substring(0, colonIdx).trim();
      const val = p.substring(colonIdx + 1).trim();
      result[name] = val;
    }
  });
  return result;
};

export const formatCombinationLabel = (combo: Record<string, string>): string => {
  const values = Object.values(combo);
  if (values.length === 0) return 'Sin variantes';
  return values.join(' ');
};

export const formatKeyToCleanLabel = (key: string): string => {
  const parsed = parseCombinationKey(key);
  const values = Object.values(parsed);
  return values.length > 0 ? values.join(' ') : key;
};

export const getAllCombinations = (product: Product): Record<string, string>[] => {
  if (!hasProductVariations(product)) return [];
  const groups = getProductEffectiveVariations(product);

  if (!groups || groups.length === 0) return [];

  let combinations: Record<string, string>[] = [{}];

  groups.forEach((g) => {
    const nextCombos: Record<string, string>[] = [];
    g.options.forEach((opt) => {
      const label = getOptionLabel(opt);
      combinations.forEach((c) => {
        nextCombos.push({ ...c, [g.name]: label });
      });
    });
    combinations = nextCombos;
  });

  return combinations;
};

export const getInitialDefaultCombinationStock = (product: Product, options: Record<string, string>): number => {
  if (!hasProductVariations(product)) {
    return product.stock !== undefined ? product.stock : (product.isUnique ? 1 : 15);
  }
  const groups = getProductEffectiveVariations(product);

  let minOptStock: number | null = null;
  groups.forEach((g) => {
    const chosenLabel = options[g.name];
    if (chosenLabel) {
      const foundOpt = g.options.find((opt) => getOptionLabel(opt) === chosenLabel);
      if (foundOpt) {
        const stk = getOptionStock(foundOpt);
        if (stk !== undefined) {
          if (minOptStock === null || stk < minOptStock) {
            minOptStock = stk;
          }
        }
      }
    }
  });

  if (minOptStock !== null) return minOptStock;

  return product.stock !== undefined ? product.stock : 15;
};

export const getCombinationStock = (product: Product, options: Record<string, string>): number => {
  if (product.isUnique) return product.stock !== undefined ? product.stock : 1;
  if (!hasProductVariations(product)) return product.stock !== undefined ? product.stock : 0;

  if (options && Object.keys(options).length > 0) {
    const comboKey = getCombinationKey(options);
    if (product.variantStocks && product.variantStocks[comboKey] !== undefined) {
      return product.variantStocks[comboKey];
    }
  }

  return getInitialDefaultCombinationStock(product, options);
};

export const calculateTotalProductStock = (product: Product): number => {
  if (product.isUnique) return product.stock !== undefined ? product.stock : 1;
  if (!hasProductVariations(product)) return product.stock !== undefined ? product.stock : 0;

  const combinations = getAllCombinations(product);
  if (combinations.length === 0) {
    return product.stock !== undefined ? product.stock : 0;
  }

  let total = 0;
  combinations.forEach((combo) => {
    total += getCombinationStock(product, combo);
  });

  return total;
};

export const calculateEffectiveProductStock = (product: Product, options?: Record<string, string>): number => {
  if (product.isUnique) return product.stock !== undefined ? product.stock : 1;
  if (!hasProductVariations(product)) return product.stock !== undefined ? product.stock : 0;

  if (!options || Object.keys(options).length === 0) {
    return calculateTotalProductStock(product);
  }

  return getCombinationStock(product, options);
};

export interface ProductStockStatus {
  totalStock: number;
  isTotalOutOfStock: boolean;
  hasOutOfStockVariations: boolean;
  outOfStockVariationNames: string[];
  status: 'OUT_OF_STOCK' | 'PARTIAL_STOCK' | 'IN_STOCK';
  statusLabel: string;
}

export const getProductStockStatus = (product: Product): ProductStockStatus => {
  const totalStock = calculateTotalProductStock(product);
  if (product.isUnique) {
    const isOut = (product.stock !== undefined ? product.stock : 1) <= 0;
    return {
      totalStock: isOut ? 0 : 1,
      isTotalOutOfStock: isOut,
      hasOutOfStockVariations: false,
      outOfStockVariationNames: [],
      status: isOut ? 'OUT_OF_STOCK' : 'IN_STOCK',
      statusLabel: isOut ? 'AGOTADO' : 'PIEZA ÚNICA',
    };
  }

  if (totalStock === 0) {
    return {
      totalStock: 0,
      isTotalOutOfStock: true,
      hasOutOfStockVariations: false,
      outOfStockVariationNames: [],
      status: 'OUT_OF_STOCK',
      statusLabel: 'SIN STOCK (TOTAL)',
    };
  }

  if (!hasProductVariations(product)) {
    return {
      totalStock,
      isTotalOutOfStock: false,
      hasOutOfStockVariations: false,
      outOfStockVariationNames: [],
      status: 'IN_STOCK',
      statusLabel: 'STOCK COMPLETO',
    };
  }

  const combinations = getAllCombinations(product);
  const outOfStockNames: string[] = [];

  combinations.forEach((combo) => {
    const stk = getCombinationStock(product, combo);
    if (stk === 0) {
      outOfStockNames.push(getCombinationKey(combo));
    }
  });

  const hasOutOfStockVariations = outOfStockNames.length > 0;

  return {
    totalStock,
    isTotalOutOfStock: false,
    hasOutOfStockVariations,
    outOfStockVariationNames: outOfStockNames,
    status: hasOutOfStockVariations ? 'PARTIAL_STOCK' : 'IN_STOCK',
    statusLabel: hasOutOfStockVariations ? 'STOCK PARCIAL (Variedad agotada)' : 'STOCK COMPLETO',
  };
};

export interface ProductReview {
  id: string; // Primary Key
  userName: string;
  userAvatar?: string;
  rating: number; // 1 a 5 estrellas
  date: string; // Fecha de publicación
  comment: string;
}

export interface Product {
  id: string; // Primary Key
  categoryId?: string; // Relación -> CategoryItem.id
  category: ProductCategory | string;
  vibeIds?: string[]; // Relación -> StyleItem.id
  styleIds?: string[]; // Relación -> StyleItem.id
  vibe: ProductStyle[];
  style?: ProductStyle[];
  name: string;
  price: number;
  originalPrice?: number;
  image: string; // Portada / Imagen principal
  images?: string[]; // Galería completa de imágenes del producto (archivos o URLs)
  variantImages?: Record<string, string>; // Mapa de combinación ("COLOR:Blanco | TALLE:S") -> Imagen asociada
  badge?: string;
  badgeId?: string; // Relación -> BadgeItem.id (Etiqueta asociada admin)
  badgeBg?: string;
  description: string;
  isCustomizable?: boolean;
  stock: number;
  isUnique?: boolean; // Pieza única de stock 1 (ej: peluche o pintura irrepetible)
  hasVariations?: boolean; // Permite forzar si un producto tiene o no variaciones explícitamente
  hiddenFromCatalog?: boolean; // Ocultar del catálogo/vista del cliente
  isRewardOnly?: boolean; // Exclusivo para canjes por cupones/premios del club
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
  variations?: ProductVariationGroup[]; // Variaciones personalizadas administrables
  variantStocks?: Record<string, number>; // Stock específico por combinación de variaciones ("M:S | C:Negro")
  rawVariants?: Array<{
    idVariante: number;
    sku: string;
    stock: number;
    precioFinal: number;
    imagenVarianteUrl?: string;
    opciones?: any[];
  }>;
  // ATRIBUTOS DE ADMINISTRACIÓN
  sku?: string;
  salesChannel?: 'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL';
  dateAdded?: string;
  costPrice?: number;
  material?: string;
}

export const calculateDiscountPercentage = (price: number, originalPrice?: number): number => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const isProductOnSale = (product: Product): boolean => {
  const hasPriceDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const hasOfferBadgeText = Boolean(product.badge && product.badge.toUpperCase().includes('OFERTA'));
  return hasPriceDiscount || hasOfferBadgeText;
};

export interface EffectiveBadge {
  text: string;
  badgeBg: string;
  isOffer: boolean;
}

export const getEffectiveProductBadge = (
  product: Product,
  tagsList?: BadgeItem[]
): EffectiveBadge | null => {
  const offerTagInList = tagsList?.find(
    (t) => t.name.toUpperCase().includes('OFERTA')
  );
  const defaultOfferBg = offerTagInList?.badgeBg || 'bg-brand-pink text-white';

  // 1. Explicit badgeId matched against tagsList
  if (product.badgeId && tagsList) {
    const foundTag = tagsList.find((t) => t.id === product.badgeId);
    if (foundTag) {
      const isOffer = foundTag.name.toUpperCase().includes('OFERTA');
      return {
        text: foundTag.name,
        badgeBg: foundTag.badgeBg || 'bg-brand-orange text-white',
        isOffer,
      };
    }
  }

  // 2. Explicit badge text string on product
  if (product.badge && product.badge.trim() !== '' && product.badge.toUpperCase() !== 'EXCLUSIVO PREMIOS') {
    const isOffer = product.badge.toUpperCase().includes('OFERTA');
    return {
      text: product.badge,
      badgeBg: product.badgeBg || (isOffer ? defaultOfferBg : 'bg-brand-orange text-white'),
      isOffer,
    };
  }

  // 3. Discount on price (originalPrice > price) -> Auto-associated OFERTA badge
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = calculateDiscountPercentage(product.price, product.originalPrice);
    const text = pct > 0 ? `OFERTA -${pct}%` : 'OFERTA';
    return {
      text,
      badgeBg: defaultOfferBg,
      isOffer: true,
    };
  }

  // 4. Unique product piece
  if (product.isUnique) {
    return {
      text: 'PIEZA ÚNICA',
      badgeBg: 'bg-brand-purple text-white',
      isOffer: false,
    };
  }

  return null;
};


export interface CustomizationSpecs {
  category: CustomizableCategory;
  options: Record<string, string>;
  calculatedPrice: number;
  summaryText: string;
  customName?: string;
  customDescription?: string;
  customImage?: string | null;
  imageTransforms?: {
    zoom: number;
    posX: number;
    posY: number;
    rotate: number;
  };
}

export type CustomizableCategory = 
  | 'LLAVEROS / PELUCHES'
  | 'STICKERS' 
  | 'POSTERS' 
  | 'PINES' 
  | 'ARITOS'
  | 'COLLARES' 
  | 'REMERAS'
  | 'PINTURAS'
  | (string & {});

export interface CustomProductZone {
  id: string;
  name: string; // Ej: "Estampa Frontal A4", "Manga Izquierda", "Enganche"
  posX: number; // 0 a 100%
  posY: number; // 0 a 100%
  width: number; // 0 a 100%
  height: number; // 0 a 100%
  rotation?: number; // Grados
  sampleText?: string;
  sampleImage?: string;
  borderColor?: string;
}

export interface CustomProductOptionItem {
  id: string;
  label: string;
  priceDelta?: number;
  colorHex?: string;
  stock?: number;
}

export interface CustomProductOptionGroup {
  id: string;
  name: string; // Ej: "Color de Prenda", "Talle", "Ubicación"
  options: CustomProductOptionItem[];
}

export interface CustomProductTemplate {
  id: string;
  name: string;
  category: CustomizableCategory;
  basePrice: number;
  description: string;
  baseImage: string;
  optionGroups: CustomProductOptionGroup[];
  zones: CustomProductZone[];
  isActive?: boolean;
}

export interface CartItem {
  id?: string; // Primary Key
  productId?: string; // Relación -> Product.id
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  customizationDetails?: string;
  customizationSpecs?: CustomizationSpecs;
  isRewardClaim?: boolean; // Item canjeado por puntos del club
  rewardCouponCode?: string; // Código del cupón asociado
}

export const getCartItemMaxStock = (item: CartItem): number => {
  if (item.customizationSpecs) {
    return item.product.stock !== undefined ? item.product.stock : 1;
  }
  return calculateEffectiveProductStock(item.product, item.selectedOptions);
};

export interface FilterState {
  searchQuery: string;
  selectedCategory: string | null;
  selectedVibes: ProductStyle[];
  selectedStyles: ProductStyle[];
  maxPrice: number;
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'newest';
}

export type UserRole = 'CLIENTE' | 'ADMIN';

export interface User {
  id: string; // Primary Key
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  points?: number;
}

export interface CustomerAddress {
  id: string;
  label?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  idLocalidad?: number;
  isDefault?: boolean;
  notes?: string;
}

export interface AdminCustomer {
  id: string; // Primary Key
  name: string;
  email: string;
  phone?: string;
  role: string;
  ordersCount: number;
  totalSpent: number;
  points: number;
  joinedDate: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  addresses?: CustomerAddress[];
}

export interface AdminExpense {
  id: string; // Primary Key
  supplier: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  date: string;
}

export type RewardCategory = 'VOUCHER' | 'DESCUENTO' | 'PRODUCTO' | 'ENVIO' | 'REGALO' | (string & {});

export interface RewardCategoryItem {
  id: string; // Primary Key
  name: string;
  description?: string;
  badgeBg?: string;
}
export type CategoriaPremio = RewardCategoryItem;

export interface RewardItem {
  id: string; // Primary Key
  title: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  categoryId?: string; // Relación -> RewardCategoryItem.id (CategoriaPremio)
  discountValue: string;
  image: string;
  badge?: string;
  badgeBg?: string;
  stock?: number;
  codePrefix: string;
  productId?: string; // Relación opcional a Product.id de inventario canjeable
}

export interface RedeemedCoupon {
  id: string; // Primary Key
  rewardId: string; // Relación -> RewardItem.id
  userId?: string; // Relación -> User.id
  rewardTitle: string;
  code: string;
  discountValue: string;
  pointsSpent: number;
  redeemedAt: string;
  isUsed: boolean;
  productId?: string; // Relación opcional a Product.id físico a entregar
}

export type OrderStatus = 'PENDIENTE' | 'PAGADO' | 'EN_CONFECCION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface AdminOrder {
  id: string; // Primary Key
  customerId?: string; // Relación -> User.id / AdminCustomer.id
  customerName: string;
  customerEmail: string;
  date: string; // Fecha de inicio / creación
  estimatedDeliveryDate?: string; // Fecha de fin / entrega estimada
  total: number;
  status: OrderStatus;
  itemsCount: number;
  itemsSummary: string;
  isCustomOrder?: boolean;
  hasManualCustomItems?: boolean;
  trackingNumber?: string;
  receiptUrl?: string;
  shippingAddress?: string;
  shippingProvince?: string;
  shippingCity?: string;
  paymentMethod?: string;
  idMetodoPago?: number;
  // NUEVOS ATRIBUTOS SOLICITADOS
  salesChannel?: 'TIENDA_WEB' | 'VENTA_FISICA' | 'REDES_SOCIALES';
  hasShipping?: boolean;
  shippingDestination?: string;
  carrier?: string;
  paymentStatus?: 'PAGADO' | 'PENDIENTE';
  subtotal?: number;
  discountAmount?: number;
  appliedCouponCode?: string;
  shippingCost?: number;
  customerPhone?: string;
  items?: Array<{
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
  }>;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  description?: string;
  category: string;
  summaryText: string;
  customImage?: string;
  options: Record<string, string>;
  createdAt: string;
  imageTransforms?: {
    zoom: number;
    posX: number;
    posY: number;
    rotate: number;
  };
}

export interface UserAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  floorDept?: string;
  city: string;
  zipCode: string;
  province: string;
  isDefault?: boolean;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  shippingMethod: 'DELIVERY' | 'PICKUP';
  street: string;
  number: string;
  floorDept: string;
  city: string;
  province: string;
  zipCode: string;
  couponCode: string;
  paymentMethod: 'MERCADO_PAGO' | 'TRANSFER' | 'CASH';
}

export const getMatchingProductVariationInfo = (
  product: Product,
  query: string
): { label: string; image?: string } | null => {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  // 1. Buscar en product.variations
  if (Array.isArray(product.variations)) {
    for (const group of product.variations) {
      if (!Array.isArray(group.options)) continue;
      for (const opt of group.options) {
        const optLabel = getOptionLabel(opt);
        if (optLabel && optLabel.toLowerCase().includes(q)) {
          let matchedImg: string | undefined;
          if (product.variantImages) {
            const imgEntry = Object.entries(product.variantImages).find(([comboKey, url]) =>
              Boolean(url && comboKey.toLowerCase().includes(optLabel.toLowerCase()))
            );
            if (imgEntry) matchedImg = imgEntry[1];
          }
          return {
            label: `${group.name}: ${optLabel}`,
            image: matchedImg,
          };
        }
      }
    }
  }

  // 2. Buscar en product.rawVariants
  if (Array.isArray(product.rawVariants)) {
    for (const rv of product.rawVariants) {
      if (Array.isArray(rv.opciones)) {
        for (const op of rv.opciones) {
          const opName = op?.opcionVariacion?.nombreOpcion || op?.nombreOpcion || '';
          const varName = op?.opcionVariacion?.variacion?.nombreVariacion || op?.nombreVariacion || 'Variante';
          if (opName && String(opName).toLowerCase().includes(q)) {
            return {
              label: `${varName}: ${opName}`,
              image: rv.imagenVarianteUrl || undefined,
            };
          }
        }
      }
    }
  }

  // 3. Buscar en las claves de variantStocks o variantImages
  const comboKeys = [
    ...Object.keys(product.variantStocks || {}),
    ...Object.keys(product.variantImages || {}),
  ];
  for (const ck of comboKeys) {
    if (ck.toLowerCase().includes(q)) {
      return {
        label: formatKeyToCleanLabel(ck),
        image: product.variantImages?.[ck],
      };
    }
  }

  return null;
};

export const isProductMatchingSearch = (product: Product, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const matchesName = Boolean(product.name && product.name.toLowerCase().includes(q));
  const matchesDesc = Boolean(product.description && product.description.toLowerCase().includes(q));
  const matchesCategory = Boolean(product.category && product.category.toLowerCase().includes(q));
  const matchesBadge = Boolean(product.badge && product.badge.toLowerCase().includes(q));
  const matchesSku = Boolean(product.sku && product.sku.toLowerCase().includes(q));
  const matchesMaterial = Boolean(product.material && product.material.toLowerCase().includes(q));
  const matchesVibe = Array.isArray(product.vibe)
    ? product.vibe.some((v) => v.toLowerCase().includes(q))
    : false;

  if (
    matchesName ||
    matchesDesc ||
    matchesCategory ||
    matchesBadge ||
    matchesSku ||
    matchesMaterial ||
    matchesVibe
  ) {
    return true;
  }

  // Buscar coincidencias en variaciones / opciones / variantes del producto (ej: "Creeper" en "Pines de Memes")
  if (getMatchingProductVariationInfo(product, q) !== null) {
    return true;
  }

  if (Array.isArray(product.rawVariants)) {
    const matchesRawSku = product.rawVariants.some(
      (rv) => Boolean(rv.sku && rv.sku.toLowerCase().includes(q))
    );
    if (matchesRawSku) return true;
  }

  return false;
};

/**
 * Genera el próximo SKU autonumérico secuencial para productos.
 * Formato: BTC-XXX (ej: BTC-001, BTC-002, ..., BTC-027).
 * Analiza todos los SKUs existentes, extrae el número secuencial más alto y suma 1.
 */
export const getNextAutoNumericSku = (existingProducts?: { sku?: string }[]): string => {
  if (!existingProducts || existingProducts.length === 0) {
    return 'BTC-001';
  }

  let maxNum = 0;
  existingProducts.forEach((p) => {
    if (p.sku) {
      // Extrae números en el SKU (ej: BTC-026 -> 26, BTC-101 -> 101, BTC-OD-1 -> 1)
      const matches = p.sku.match(/\d+/g);
      if (matches) {
        matches.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        });
      }
    }
  });

  const nextNum = maxNum + 1;
  const padded = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
  return `BTC-${padded}`;
};

/**
 * Genera el próximo ID autonumérico para cualquier entidad (productos, categorías, estilos, etiquetas, pedidos, etc.)
 * Ejemplo: getNextAutoNumericId('prod-', products) -> 'prod-27'
 *          getNextAutoNumericId('cat-', categories) -> 'cat-9'
 *          getNextAutoNumericId('style-', styles) -> 'style-7'
 *          getNextAutoNumericId('tag-', tags) -> 'tag-9'
 */
export const getNextAutoNumericId = (prefix: string, items?: { id: string }[]): string => {
  if (!items || items.length === 0) {
    return `${prefix}1`;
  }

  let maxNum = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  items.forEach((item) => {
    if (item.id) {
      const match = item.id.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      } else {
        const anyDigits = item.id.match(/\d+/g);
        if (anyDigits) {
          anyDigits.forEach((d) => {
            const num = parseInt(d, 10);
            if (!isNaN(num) && num < 1000000 && num > maxNum) {
              maxNum = num;
            }
          });
        }
      }
    }
  });

  return `${prefix}${maxNum + 1}`;
};

/**
 * Convierte cualquier fecha (ISO, string o Date) al formato español estándar DD/MM/AAAA.
 * Si no se proporciona valor, devuelve la fecha actual en DD/MM/AAAA.
 */
export const getSpanishFormattedDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Si ya viene en formato DD/MM/AAAA (ej: '23/10/2026')
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Si viene en formato YYYY-MM-DD (ej: '2026-10-23')
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const [year, month, day] = trimmed.split('T')[0].split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    // Si viene en formato MM/DD/YYYY (ej: '10/23/2026')
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      if (parseInt(parts[0], 10) > 12) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};


