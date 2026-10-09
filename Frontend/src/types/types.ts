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

export interface CategoryItem {
  id: string; // Primary Key
  name: string;
  emoji?: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
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

export const getDefaultVariationsForCategory = (category: string): ProductVariationGroup[] => {
  const catUpper = (category || '').trim().toUpperCase();
  
  if (catUpper.includes('COLLAR')) {
    return [
      { name: 'LARGO DE CADENA', options: [{ label: '40 cm (Gargantilla)', stock: 10 }, { label: '45 cm (Standard)', stock: 15 }, { label: '50 cm (Larga)', priceDelta: 500, stock: 5 }] },
      { name: 'ACABADO METALICO', options: ['Acero Quirúrgico 316L', { label: 'Plateado Oxidado', priceDelta: 800 }, { label: 'Negro Pavonado', priceDelta: 1200 }] }
    ];
  }
  if (catUpper.includes('ARITO')) {
    return [
      { name: 'MATERIAL DEL ANZUELO', options: [{ label: 'Acero Quirúrgico 316L', stock: 20 }, { label: 'Plata 925', priceDelta: 2500, stock: 5 }, { label: 'Clip (Sin Perforación)', stock: 8 }] },
      { name: 'CONFIGURACIÓN', options: ['Par Simétrico (2 iguales)', { label: 'Par Asimétrico', priceDelta: 600 }, 'Aro Individual'] }
    ];
  }
  if (catUpper.includes('REMERA')) {
    return [
      { name: 'TALLE DE PRENDA', options: [{ label: 'S', stock: 15 }, { label: 'M', stock: 20 }, { label: 'L', stock: 12 }, { label: 'XL', priceDelta: 800, stock: 8 }, { label: 'XXL', priceDelta: 1500, stock: 0 }] },
      { name: 'COLOR DE REMERA', options: ['Negro Azabache', 'Blanco Puro', 'Rosa Neobrutal', { label: 'Violeta Neón', priceDelta: 500 }] }
    ];
  }
  if (catUpper.includes('PIN')) {
    return [
      { name: 'DIÁMETRO DEL PIN', options: [{ label: '38 mm (Standard)', stock: 40 }, { label: '55 mm (Grande)', priceDelta: 300, stock: 20 }, { label: '75 mm (XL Max)', priceDelta: 600, stock: 10 }] },
      { name: 'ACABADO SUPERFICIAL', options: ['Brillante Clásico', 'Mate Soft-Touch', { label: 'Holográfico', priceDelta: 400 }] }
    ];
  }
  if (catUpper.includes('STICKER')) {
    return [
      { name: 'MATERIAL', options: ['Vinilo Impermeable', { label: 'Holográfico Estelar', priceDelta: 200 }, { label: 'Metalizado Espejo', priceDelta: 350 }] },
      { name: 'TAMAÑO', options: [{ label: 'Mini (5 cm)', stock: 50 }, { label: 'Standard (8 cm)', stock: 35 }, { label: 'Max XL (12 cm)', priceDelta: 300, stock: 24 }] }
    ];
  }
  if (catUpper.includes('POSTER')) {
    return [
      { name: 'TAMAÑO DE PAPEL', options: [{ label: 'A4 (21x29.7 cm)', stock: 25 }, { label: 'A3 (29.7x42 cm)', priceDelta: 1200, stock: 15 }, { label: 'A2 (42x59.4 cm)', priceDelta: 2500, stock: 0 }] },
      { name: 'TIPO DE PAPEL', options: ['Matte 300g Premium', { label: 'Brillante Satinado 250g', priceDelta: 400 }] }
    ];
  }
  if (catUpper.includes('PELUCHE') || catUpper.includes('LLAVERO')) {
    return [
      { name: 'TAMAÑO', options: [{ label: 'Mini Charm (10 cm)', stock: 10 }, { label: 'Standard (20 cm)', stock: 8 }, { label: 'Grande (35 cm)', priceDelta: 3500, stock: 3 }] },
      { name: 'ENGANCHE', options: ['Mosquetón Metálico', 'Argolla Clásica'] }
    ];
  }

  return [
    { name: 'EDICIÓN', options: ['Standard', { label: 'Limitada Dark', priceDelta: 1000 }] }
  ];
};

export const getDefaultOptionsForProduct = (product: Product): Record<string, string> => {
  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

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
  if (!options) return product.price;
  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

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

export const getAllCombinations = (product: Product): Record<string, string>[] => {
  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

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
  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

  if (!groups || groups.length === 0) {
    return product.stock !== undefined ? product.stock : 15;
  }

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

  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

  const outOfStockNames: string[] = [];

  groups.forEach((g) => {
    g.options.forEach((opt) => {
      const stk = getOptionStock(opt);
      if (stk !== undefined && stk === 0) {
        outOfStockNames.push(`${g.name}: ${getOptionLabel(opt)}`);
      }
    });
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
  image: string;
  badge?: string;
  badgeId?: string; // Relación -> BadgeItem.id (Etiqueta asociada admin)
  badgeBg?: string;
  description: string;
  isCustomizable?: boolean;
  stock: number;
  isUnique?: boolean; // Pieza única de stock 1 (ej: peluche o pintura irrepetible)
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
  variations?: ProductVariationGroup[]; // Variaciones personalizadas administrables
  variantStocks?: Record<string, number>; // Stock específico por combinación de variaciones ("M:S | C:Negro")
  // ATRIBUTOS DE ADMINISTRACIÓN
  sku?: string;
  salesChannel?: 'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL';
  dateAdded?: string;
  costPrice?: number;
  material?: string;
}

export interface CustomizationSpecs {
  category: CustomizableCategory;
  options: Record<string, string>;
  calculatedPrice: number;
  summaryText: string;
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
  | 'PINTURAS';

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
  points?: number;
}

export interface CustomerAddress {
  id: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
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

export type RewardCategory = 'VOUCHER' | 'DESCUENTO' | 'PRODUCTO' | 'ENVIO' | 'REGALO';

export interface RewardItem {
  id: string; // Primary Key
  title: string;
  description: string;
  pointsCost: number;
  category: RewardCategory;
  discountValue: string;
  image: string;
  badge?: string;
  badgeBg?: string;
  stock?: number;
  codePrefix: string;
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
}

export type OrderStatus = 'PENDIENTE' | 'EN_CONFECCION' | 'ENVIADO' | 'ENTREGADO';

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
  trackingNumber?: string;
  shippingAddress?: string;
  paymentMethod?: string;
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

export const isProductMatchingSearch = (product: Product, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const matchesName = Boolean(product.name && product.name.toLowerCase().includes(q));
  const matchesDesc = Boolean(product.description && product.description.toLowerCase().includes(q));
  const matchesCategory = Boolean(product.category && product.category.toLowerCase().includes(q));
  const matchesBadge = Boolean(product.badge && product.badge.toLowerCase().includes(q));
  const matchesVibe = Array.isArray(product.vibe)
    ? product.vibe.some((v) => v.toLowerCase().includes(q))
    : false;

  return matchesName || matchesDesc || matchesCategory || matchesBadge || matchesVibe;
};

