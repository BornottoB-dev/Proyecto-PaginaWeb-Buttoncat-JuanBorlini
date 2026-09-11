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

export interface VibeItem {
  id: string;
  name: string;
  emoji?: string;
  badgeBg?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | string;
  vibe: ProductVibe[];
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

export interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
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
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type OrderStatus = 'PENDIENTE' | 'EN_CONFECCION' | 'ENVIADO' | 'ENTREGADO';

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemsCount: number;
  itemsSummary: string;
  isCustomOrder?: boolean;
}
