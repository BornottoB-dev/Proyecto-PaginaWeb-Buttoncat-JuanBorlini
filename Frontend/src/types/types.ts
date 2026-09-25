export type ProductCategory = 
  | 'LLAVEROS / PELUCHES' 
  | 'STICKERS' 
  | 'POSTERS' 
  | 'PINES' 
  | 'ARITOS' 
  | 'COLLARES' 
  | 'REMERAS'
  | 'PINTURAS';

export type ProductVibe = string;

export interface CategoryItem {
  id: string; // Primary Key
  name: string;
  emoji?: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
}

export interface VibeItem {
  id: string; // Primary Key
  name: string;
  emoji?: string;
  badgeBg?: string;
}

export interface Product {
  id: string; // Primary Key
  categoryId?: string; // Relación -> CategoryItem.id
  category: ProductCategory | string;
  vibeIds?: string[]; // Relación -> VibeItem.id
  vibe: ProductVibe[];
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  badgeBg?: string;
  description: string;
  isCustomizable?: boolean;
  stock: number;
  rating?: number;
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
  customizationDetails?: string;
  customizationSpecs?: CustomizationSpecs;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string | null;
  selectedVibes: ProductVibe[];
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
  date: string;
  total: number;
  status: OrderStatus;
  itemsCount: number;
  itemsSummary: string;
  isCustomOrder?: boolean;
  trackingNumber?: string;
  shippingAddress?: string;
  paymentMethod?: string;
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
  zipCode: string;
  couponCode: string;
  paymentMethod: 'MERCADO_PAGO' | 'TRANSFER' | 'CASH';
}

