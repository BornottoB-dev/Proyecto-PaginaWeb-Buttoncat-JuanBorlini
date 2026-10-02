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
      { name: 'LARGO DE CADENA', options: ['40 cm (Gargantilla)', '45 cm (Standard)', { label: '50 cm (Larga)', priceDelta: 500, stock: 0 }] },
      { name: 'ACABADO METALICO', options: ['Acero Quirúrgico 316L', { label: 'Plateado Oxidado', priceDelta: 800 }, { label: 'Negro Pavonado', priceDelta: 1200 }] }
    ];
  }
  if (catUpper.includes('ARITO')) {
    return [
      { name: 'MATERIAL DEL ANZUELO', options: ['Acero Quirúrgico 316L', { label: 'Plata 925', priceDelta: 2500 }, 'Clip (Sin Perforación)'] },
      { name: 'CONFIGURACIÓN', options: ['Par Simétrico (2 iguales)', { label: 'Par Asimétrico', priceDelta: 600 }, 'Aro Individual'] }
    ];
  }
  if (catUpper.includes('REMERA')) {
    return [
      { name: 'TALLE DE PRENDA', options: ['S', 'M', 'L', { label: 'XL', priceDelta: 800 }, { label: 'XXL', priceDelta: 1500, stock: 0 }] },
      { name: 'COLOR DE REMERA', options: ['Negro Azabache', 'Blanco Puro', 'Rosa Neobrutal', { label: 'Violeta Neón', priceDelta: 500 }] }
    ];
  }
  if (catUpper.includes('PIN')) {
    return [
      { name: 'DIÁMETRO DEL PIN', options: ['38 mm (Standard)', { label: '55 mm (Grande)', priceDelta: 300 }, { label: '75 mm (XL Max)', priceDelta: 600 }] },
      { name: 'ACABADO SUPERFICIAL', options: ['Brillante Clásico', 'Mate Soft-Touch', { label: 'Holográfico', priceDelta: 400 }] }
    ];
  }
  if (catUpper.includes('STICKER')) {
    return [
      { name: 'MATERIAL', options: ['Vinilo Impermeable', { label: 'Holográfico Estelar', priceDelta: 200 }, { label: 'Metalizado Espejo', priceDelta: 350 }] },
      { name: 'TAMAÑO', options: ['Mini (5 cm)', 'Standard (8 cm)', { label: 'Max XL (12 cm)', priceDelta: 300 }] }
    ];
  }
  if (catUpper.includes('POSTER')) {
    return [
      { name: 'TAMAÑO DE PAPEL', options: ['A4 (21x29.7 cm)', { label: 'A3 (29.7x42 cm)', priceDelta: 1200 }, { label: 'A2 (42x59.4 cm)', priceDelta: 2500, stock: 0 }] },
      { name: 'TIPO DE PAPEL', options: ['Matte 300g Premium', { label: 'Brillante Satinado 250g', priceDelta: 400 }] }
    ];
  }
  if (catUpper.includes('PELUCHE') || catUpper.includes('LLAVERO')) {
    return [
      { name: 'TAMAÑO', options: ['Mini Charm (10 cm)', 'Standard (20 cm)', { label: 'Grande (35 cm)', priceDelta: 3500 }] },
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
      options[g.name] = getOptionLabel(g.options[0]);
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

export const calculateEffectiveProductStock = (product: Product, options?: Record<string, string>): number => {
  if (product.stock === undefined || product.stock === 0) return 0;
  if (!options || Object.keys(options).length === 0) return product.stock;

  const groups = (product.variations && product.variations.length > 0)
    ? product.variations
    : getDefaultVariationsForCategory(product.category);

  let minStock = product.stock;

  groups.forEach((g) => {
    const chosenLabel = options[g.name];
    if (chosenLabel) {
      const foundOpt = g.options.find((opt) => getOptionLabel(opt) === chosenLabel);
      if (foundOpt) {
        const optStock = getOptionStock(foundOpt);
        if (optStock !== undefined && optStock < minStock) {
          minStock = optStock;
        }
      }
    }
  });

  return minStock;
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

export interface AdminCustomer {
  id: string; // Primary Key
  name: string;
  email: string;
  role: string;
  ordersCount: number;
  totalSpent: number;
  points: number;
  joinedDate: string;
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

