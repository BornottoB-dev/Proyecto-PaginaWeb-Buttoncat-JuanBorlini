import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import type { Product, CartItem, CustomizationSpecs, CustomizableCategory, User, CategoryItem, StyleItem, BadgeItem, RedeemedCoupon, AdminOrder, OrderStatus, UserAddress, SavedDesign } from './types/types';
import { getDefaultOptionsForProduct, calculateEffectiveProductPrice, calculateEffectiveProductStock, getCartItemMaxStock, getOptionLabel } from './types/types';
import { MOCK_PRODUCTS } from './data/mockProducts';
import { Header } from './components/layout/Header';
import { MarqueeTicker } from './components/layout/MarqueeTicker';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProfilePage } from './pages/ProfilePage';
import { CustomizerPage } from './pages/CustomizerPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { RewardsPage } from './pages/RewardsPage';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/cart/CheckoutModal';
import { Button } from './components/ui/Button';

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'LLAVEROS / PELUCHES', description: 'Llaveros y peluches góticos artesanales confeccionados a mano.', basePrice: 15.00, bgColor: 'bg-brand-pink text-white' },
  { id: 'cat-2', name: 'STICKERS', description: 'Stickers de vinilo mate y holográficos impermeables.', basePrice: 12.00, bgColor: 'bg-brand-orange text-white' },
  { id: 'cat-3', name: 'POSTERS', description: 'Posters e ilustraciones de alta resolución en papel brutalist.', basePrice: 18.00, bgColor: 'bg-brand-yellow text-black' },
  { id: 'cat-4', name: 'PINES', description: 'Pines metálicos y prendedores oscurecidos con doble cierre.', basePrice: 10.50, bgColor: 'bg-brand-cyan text-black' },
  { id: 'cat-5', name: 'ARITOS', description: 'Aros y argollas de acero quirúrgico e inoxidable hipoalergénico.', basePrice: 14.00, bgColor: 'bg-brand-purple text-white' },
  { id: 'cat-6', name: 'COLLARES', description: 'Gargantillas y cadenas de capas múltiples con dijes alternativos.', basePrice: 25.00, bgColor: 'bg-brand-pink text-white' },
  { id: 'cat-7', name: 'REMERAS', description: 'Remeras 100% algodón peinado estampadas con serigrafía.', basePrice: 32.00, bgColor: 'bg-brand-yellow text-black' },
  { id: 'cat-8', name: 'PINTURAS', description: 'Obras y pinturas en lienzo originales hechas a mano.', basePrice: 45.00, bgColor: 'bg-brand-orange text-white' },
];

const INITIAL_STYLES: StyleItem[] = [
  { id: 'style-1', name: 'GOTH', badgeBg: 'bg-black text-white' },
  { id: 'style-2', name: 'Y2K', badgeBg: 'bg-brand-pink text-white' },
  { id: 'style-3', name: 'KAWAII', badgeBg: 'bg-brand-yellow text-black' },
  { id: 'style-4', name: 'PUNK', badgeBg: 'bg-brand-orange text-white' },
  { id: 'style-5', name: 'ROCK', badgeBg: 'bg-brand-purple text-white' },
  { id: 'style-6', name: 'NEÓN', badgeBg: 'bg-brand-cyan text-black' },
];

const INITIAL_TAGS: BadgeItem[] = [
  { id: 'tag-1', name: '¡NUEVO!', badgeBg: 'bg-brand-orange text-white' },
  { id: 'tag-2', name: 'TOP SALES', badgeBg: 'bg-brand-yellow text-black' },
  { id: 'tag-3', name: 'OFERTA', badgeBg: 'bg-brand-pink text-white' },
  { id: 'tag-4', name: 'EDICIÓN LIMITADA', badgeBg: 'bg-brand-purple text-white' },
  { id: 'tag-5', name: 'ARTESANAL', badgeBg: 'bg-brand-cyan text-black' },
  { id: 'tag-6', name: 'BESTSELLER', badgeBg: 'bg-brand-pink text-white' },
  { id: 'tag-7', name: 'NUEVO DROP', badgeBg: 'bg-brand-orange text-white' },
  { id: 'tag-8', name: 'HOLO', badgeBg: 'bg-brand-pink text-white' },
];

function ProductDetailWrapper({
  productsList,
  selectedProduct,
  activeWishlist,
  cartItems,
  currentUser,
  handleNavigate,
  handleAddToCart,
  handleOpenStudioForCategory,
  handleSelectProduct,
  handleToggleWishlist,
  handleAddReview,
}: {
  productsList: Product[];
  selectedProduct: Product | null;
  activeWishlist: Product[];
  cartItems: CartItem[];
  currentUser: User | null;
  handleNavigate: (tab: string) => void;
  handleAddToCart: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  handleOpenStudioForCategory: (cat: CustomizableCategory) => void;
  handleSelectProduct: (p: Product) => void;
  handleToggleWishlist: (p: Product) => void;
  handleAddReview: (productId: string, newReview: { rating: number; comment: string; userName: string }) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const product = productsList.find((p) => p.id === (selectedProduct?.id || id)) || selectedProduct;

  if (!product) {
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <ProductDetailPage
      product={product}
      allProducts={productsList}
      wishlist={activeWishlist}
      cartItems={cartItems}
      currentUser={currentUser}
      onBackToCatalog={() => handleNavigate('catalogo')}
      onAddToCart={handleAddToCart}
      onOpenCustomizerStudio={handleOpenStudioForCategory}
      onSelectProduct={handleSelectProduct}
      onToggleFavorite={handleToggleWishlist}
      onAddReview={handleAddReview}
    />
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'inicio';
    if (path.startsWith('/catalogo') || path.startsWith('/producto')) return 'catalogo';
    if (path.startsWith('/personalizar')) return 'personalizar';
    if (path.startsWith('/premios')) return 'premios';
    if (path.startsWith('/perfil')) return 'perfil';
    if (path.startsWith('/admin')) return 'admin';
    return 'inicio';
  };

  const currentTab = getCurrentTab();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [stylesList, setStylesList] = useState<StyleItem[]>(INITIAL_STYLES);
  const [tagsList, setTagsList] = useState<BadgeItem[]>(INITIAL_TAGS);

  // TAG / BADGE CRUD HANDLERS
  const handleAddTag = (newTag: BadgeItem) => {
    setTagsList((prev) => [...prev, newTag]);
  };

  const handleEditTag = (updatedTag: BadgeItem) => {
    setTagsList((prev) =>
      prev.map((t) => (t.id === updatedTag.id ? updatedTag : t))
    );
  };

  const handleDeleteTag = (tagId: string) => {
    setTagsList((prev) => prev.filter((t) => t.id !== tagId));
  };
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userPoints, setUserPoints] = useState<number>(450);
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedCoupon[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([
    {
      id: 'addr-1',
      label: 'CASA',
      street: 'Av. Corrientes',
      number: '1234',
      floorDept: 'Piso 4B',
      city: 'CABA',
      zipCode: 'C1043',
      province: 'Ciudad Autónoma de Buenos Aires',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'TRABAJO',
      street: 'Av. Córdoba',
      number: '5678',
      floorDept: 'Piso 8A',
      city: 'CABA',
      zipCode: 'C1054',
      province: 'Ciudad Autónoma de Buenos Aires',
      isDefault: false,
    },
  ]);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([
    {
      id: 'BTC-9842',
      customerName: 'Juan Borlini',
      customerEmail: 'juan.borlini@email.com',
      date: '24/09/2026',
      subtotal: 39500,
      discountAmount: 5000,
      appliedCouponCode: 'KAWAII-15OFF',
      total: 34500,
      status: 'EN_CONFECCION',
      itemsCount: 3,
      itemsSummary: '2x STICKER DINOSAURIO DE GOOGLE (Acabado: Holográfico), 1x PELUCHE VOID BEAR (Variante: Edición Limitada Gótica)',
      isCustomOrder: true,
      trackingNumber: 'AR982341293AR',
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA, Ciudad Autónoma de Buenos Aires',
      paymentMethod: 'Mercado Pago',
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      carrier: 'Andreani',
      paymentStatus: 'PAGADO',
    },
    {
      id: 'BTC-8102',
      customerName: 'Juan Borlini',
      customerEmail: 'juan.borlini@email.com',
      date: '10/08/2026',
      subtotal: 20000,
      discountAmount: 2000,
      appliedCouponCode: 'DESCUENTO TRANSFERENCIA',
      total: 18000,
      status: 'ENTREGADO',
      itemsCount: 1,
      itemsSummary: '1x POSTER ARTWORK CYBERPUNK (Papel: Mate 300g - Tamaño: A3)',
      isCustomOrder: false,
      trackingNumber: 'AR810239102AR',
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA, Ciudad Autónoma de Buenos Aires',
      paymentMethod: 'Transferencia Bancaria',
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      carrier: 'Correo Argentino',
      paymentStatus: 'PAGADO',
    },
    {
      id: 'ORD-8942',
      customerName: 'Luna Lovecraft',
      customerEmail: 'luna@buttoncat.com',
      date: '2026-09-04',
      estimatedDeliveryDate: '2026-09-12',
      subtotal: 15000,
      discountAmount: 2500,
      appliedCouponCode: 'WELCOME-VIP',
      total: 12500,
      status: 'EN_CONFECCION',
      itemsCount: 1,
      itemsSummary: '1x REMERA OVERSIZE CUSTOM (Color: Negro Azabache - Talle: M - Estampa: Frente A4)',
      isCustomOrder: true,
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      shippingDestination: 'Av. Corrientes 4500, CABA, Ciudad Autónoma de Buenos Aires',
      carrier: 'Andreani',
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'PAGADO',
    },
    {
      id: 'ORD-8941',
      customerName: 'Santiago Rossi',
      customerEmail: 'santi@gmail.com',
      date: '2026-09-04',
      estimatedDeliveryDate: '2026-09-09',
      total: 8400,
      status: 'PENDIENTE',
      itemsCount: 2,
      itemsSummary: '1x COLLAR GARGANTILLA GOTHIC (Acabado: Plata Oscurecida), 1x PINES MEMES (Tamaño: 55mm Soft Touch)',
      isCustomOrder: true,
      salesChannel: 'REDES_SOCIALES',
      hasShipping: false,
      shippingDestination: 'Retiro en Local Buttoncat (Palermo)',
      carrier: 'Retiro Presencial',
      paymentMethod: 'Transferencia Bancaria',
      paymentStatus: 'PENDIENTE',
    },
    {
      id: 'ORD-8940',
      customerName: 'Valeria Gomez',
      customerEmail: 'valeria@hotmail.com',
      date: '2026-09-03',
      estimatedDeliveryDate: '2026-09-06',
      total: 15600,
      status: 'ENVIADO',
      itemsCount: 2,
      itemsSummary: '1x PELUCHE GÓTICO GATO FRANKEN (Modelo: Costuras Verdes), 1x STICKER VINYL PACK (Acabado: Holográfico)',
      isCustomOrder: false,
      salesChannel: 'VENTA_FISICA',
      hasShipping: true,
      shippingDestination: 'Calle 50 #720, La Plata, Buenos Aires',
      carrier: 'Correo Argentino',
      paymentMethod: 'Efectivo / Local',
      paymentStatus: 'PAGADO',
    },
    {
      id: 'ORD-8939',
      customerName: 'Facundo Diaz',
      customerEmail: 'facundo@yahoo.com',
      date: '2026-09-02',
      estimatedDeliveryDate: '2026-09-04',
      total: 3500,
      status: 'ENTREGADO',
      itemsCount: 1,
      itemsSummary: '1x AROS PLATA 925 PAR ASIMÉTRICO (Diseño: Cruz & Calavera)',
      isCustomOrder: false,
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      shippingDestination: 'San Martín 120, Rosario, Santa Fe',
      carrier: 'Andreani',
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'PAGADO',
    },
  ]);

  const handleSaveAdminOrder = (orderData: AdminOrder) => {
    setAllOrders((prev) => {
      const exists = prev.some((o) => o.id === orderData.id);
      if (exists) return prev.map((o) => (o.id === orderData.id ? orderData : o));
      return [orderData, ...prev];
    });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteAdminOrder = (orderId: string) => {
    setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const userOrders = currentUser
    ? allOrders.filter(
        (o) =>
          (o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (o.customerName && o.customerName.toLowerCase() === currentUser.name.toLowerCase())
      )
    : allOrders.filter((o) => o.customerName === 'Juan Borlini');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const p0 = MOCK_PRODUCTS[0];
    const p1 = MOCK_PRODUCTS[1];
    const opt0 = getDefaultOptionsForProduct(p0);
    const opt1 = getDefaultOptionsForProduct(p1);
    return [
      {
        id: 'cart-init-1',
        product: { ...p0, price: calculateEffectiveProductPrice(p0, opt0) },
        quantity: 1,
        selectedOptions: opt0,
        customizationDetails: Object.entries(opt0).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | '),
      },
      {
        id: 'cart-init-2',
        product: { ...p1, price: calculateEffectiveProductPrice(p1, opt1) },
        quantity: 2,
        selectedOptions: opt1,
        customizationDetails: Object.entries(opt1).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | '),
      },
    ];
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const activeWishlist = currentUser ? wishlist : [];

  const handleRedeemReward = (coupon: RedeemedCoupon) => {
    setUserPoints((prev) => Math.max(0, prev - coupon.pointsSpent));
    setRedeemedCoupons((prev) => [coupon, ...prev]);
  };

  const handleNavigate = (tab: string, subTab?: string) => {
    switch (tab) {
      case 'inicio':
        navigate('/');
        break;
      case 'catalogo':
        navigate('/catalogo');
        break;
      case 'personalizar':
        navigate('/personalizar');
        break;
      case 'premios':
        navigate('/premios');
        break;
      case 'perfil':
        const targetSubTab = (subTab || 'PEDIDOS').toLowerCase();
        navigate(`/perfil?tab=${targetSubTab}`, {
          state: { forceTab: targetSubTab.toUpperCase(), timestamp: Date.now() },
        });
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // PRODUCT CRUD HANDLERS
  const handleAddProduct = (newProduct: Product) => {
    setProductsList((prev) => [newProduct, ...prev]);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProductsList((prev) => prev.filter((p) => p.id !== productId));
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
      handleNavigate('catalogo');
    }
  };

  // REVIEWS & RATINGS HANDLER
  const handleAddReview = (productId: string, newReview: { rating: number; comment: string; userName: string }) => {
    const reviewObj = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userName: newReview.userName.trim() || 'Cliente Buttoncat',
      rating: newReview.rating,
      date: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      comment: newReview.comment.trim(),
    };

    setProductsList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updatedReviews = [reviewObj, ...(p.reviews || [])];
          const avgRating = Number(
            (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
          );
          return {
            ...p,
            reviews: updatedReviews,
            rating: avgRating,
            reviewsCount: updatedReviews.length,
          };
        }
        return p;
      })
    );

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct((prev) => {
        if (!prev) return null;
        const updatedReviews = [reviewObj, ...(prev.reviews || [])];
        const avgRating = Number(
          (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
        );
        return {
          ...prev,
          reviews: updatedReviews,
          rating: avgRating,
          reviewsCount: updatedReviews.length,
        };
      });
    }
  };

  // CATEGORY CRUD HANDLERS
  const handleAddCategory = (newCategory: CategoryItem) => {
    setCategoriesList((prev) => [...prev, newCategory]);
  };

  const handleEditCategory = (updatedCategory: CategoryItem) => {
    setCategoriesList((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // STYLE CRUD HANDLERS
  const handleAddStyle = (newStyle: StyleItem) => {
    setStylesList((prev) => [...prev, newStyle]);
  };

  const handleEditStyle = (updatedStyle: StyleItem) => {
    setStylesList((prev) =>
      prev.map((v) => (v.id === updatedStyle.id ? updatedStyle : v))
    );
  };

  const handleDeleteStyle = (styleId: string) => {
    setStylesList((prev) => prev.filter((v) => v.id !== styleId));
  };

  const INITIAL_SAVED_DESIGNS: SavedDesign[] = [
    {
      id: 'des-1',
      name: 'Mi Pin Custom Goth Cat',
      category: 'PINES',
      summaryText: 'Acabado: Metálico Oscuro | Tamaño: 45mm | Cierre: Doble Broche',
      customImage: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop',
      options: { Acabado: 'Metálico Oscuro', Tamaño: '45mm', Cierre: 'Doble Broche' },
      createdAt: '20/09/2026',
    },
    {
      id: 'des-2',
      name: 'Remera Neon Oversized Art',
      category: 'REMERAS',
      summaryText: 'Talle: XL | Color: Negro Faded | Serigrafía: Frontal HD',
      customImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop',
      options: { Talle: 'XL', Color: 'Negro Faded', Serigrafía: 'Frontal HD' },
      createdAt: '15/09/2026',
    },
  ];

  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [userSavedDesigns, setUserSavedDesigns] = useState<SavedDesign[]>(INITIAL_SAVED_DESIGNS);
  const [editingCustomDesign, setEditingCustomDesign] = useState<{
    category: CustomizableCategory;
    options?: Record<string, string>;
    customImage?: string | null;
  } | null>(null);

  const handleSaveDesignCustomized = (savedDesign: SavedDesign) => {
    setUserSavedDesigns((prev) => [savedDesign, ...prev]);
  };

  const handleDeleteSavedDesignCustomized = (designId: string) => {
    setUserSavedDesigns((prev) => prev.filter((d) => d.id !== designId));
  };

  // AUTH LOGIC
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (wishlist.length === 0) {
      setWishlist([MOCK_PRODUCTS[2], MOCK_PRODUCTS[3]]);
    }
    if (user.role === 'ADMIN') {
      handleNavigate('admin');
    } else if (pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (location.pathname.startsWith('/perfil') || location.pathname.startsWith('/admin')) {
      handleNavigate('inicio');
    }
  };

  // CART LOGIC
  const handleAddToCart = (product: Product, quantity: number = 1, selectedOptions?: Record<string, string>) => {
    // Retrieve fresh product from productsList to ensure stock is up to date
    const freshProduct = productsList.find((p) => p.id === product.id) || product;
    const finalOptions = selectedOptions || getDefaultOptionsForProduct(freshProduct);
    const maxStock = calculateEffectiveProductStock(freshProduct, finalOptions);

    if (maxStock <= 0) return;

    const effectivePrice = calculateEffectiveProductPrice(freshProduct, finalOptions);
    const detailsStr = Object.keys(finalOptions).length > 0
      ? Object.entries(finalOptions).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ')
      : undefined;

    const productToCart: Product = {
      ...freshProduct,
      price: effectivePrice,
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === freshProduct.id && item.customizationDetails === detailsStr
      );
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = Math.min(maxStock, currentQty + quantity);
        if (newQty === currentQty) return prev;
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        );
      }
      const actualQty = Math.min(maxStock, quantity);
      if (actualQty <= 0) return prev;

      const newItemId = `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return [...prev, { id: newItemId, product: productToCart, quantity: actualQty, selectedOptions: finalOptions, customizationDetails: detailsStr }];
    });
    setIsCartOpen(true);
  };

  const handleAddToCartCustomized = (product: Product, specs: CustomizationSpecs) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => {
        if (!item.customizationSpecs) return false;
        if (item.customizationSpecs.category !== specs.category) return false;

        const img1 = item.customizationSpecs.customImage || null;
        const img2 = specs.customImage || null;
        if (img1 !== img2) return false;

        const t1 = item.customizationSpecs.imageTransforms;
        const t2 = specs.imageTransforms;
        if (t1 || t2) {
          if (!t1 || !t2) return false;
          if (
            t1.posX !== t2.posX ||
            t1.posY !== t2.posY ||
            t1.zoom !== t2.zoom ||
            t1.rotate !== t2.rotate
          ) {
            return false;
          }
        }

        const opts1 = item.customizationSpecs.options || {};
        const opts2 = specs.options || {};
        const keys1 = Object.keys(opts1);
        const keys2 = Object.keys(opts2);
        if (keys1.length !== keys2.length) return false;

        for (const k of keys1) {
          if (opts1[k] !== opts2[k]) return false;
        }

        return true;
      });

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        const maxStock = getCartItemMaxStock(existingItem);
        const newQty = Math.min(maxStock, existingItem.quantity + 1);
        updated[existingIndex] = { ...existingItem, quantity: newQty };
        return updated;
      }

      const uniqueId = `custom-${specs.category.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const uniqueProduct: Product = {
        ...product,
        id: uniqueId,
      };
      const cartItemId = `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return [
        ...prev,
        {
          id: cartItemId,
          product: uniqueProduct,
          quantity: 1,
          customizationSpecs: specs,
          customizationDetails: specs.summaryText,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    navigate(`/producto/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStudioForCategory = (_category: CustomizableCategory) => {
    handleNavigate('personalizar');
  };

  const handleUpdateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if ((item.id || item.product.id) === cartItemId) {
          const maxStock = getCartItemMaxStock(item);
          const validQuantity = Math.min(maxStock, quantity);
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => (item.id || item.product.id) !== cartItemId));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCompleteCheckout = (order: AdminOrder, pointsEarned: number, usedCouponCode?: string) => {
    // Deduct stock for all items purchased in this order
    setProductsList((prevProducts) =>
      prevProducts.map((prod) => {
        const matchingCartItems = cartItems.filter(
          (item) => (item.product?.id === prod.id || item.productId === prod.id)
        );

        if (matchingCartItems.length === 0) return prod;

        const totalPurchasedQty = matchingCartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
        const newStock = Math.max(0, (prod.stock || 0) - totalPurchasedQty);

        // Deduct stock for specific variation options if present
        let updatedVariations = prod.variations;
        if (updatedVariations && updatedVariations.length > 0) {
          updatedVariations = updatedVariations.map((group) => ({
            ...group,
            options: group.options.map((opt) => {
              const optLabel = getOptionLabel(opt);
              const qtyDeductedForOpt = matchingCartItems.reduce((acc, item) => {
                if (item.selectedOptions && item.selectedOptions[group.name] === optLabel) {
                  return acc + (item.quantity || 1);
                }
                return acc;
              }, 0);

              if (qtyDeductedForOpt > 0 && typeof opt !== 'string' && opt.stock !== undefined) {
                return {
                  ...opt,
                  stock: Math.max(0, opt.stock - qtyDeductedForOpt),
                };
              }
              return opt;
            }),
          }));
        }

        return {
          ...prod,
          stock: newStock,
          badge: newStock === 0 ? 'AGOTADO' : prod.badge === 'AGOTADO' ? undefined : prod.badge,
          variations: updatedVariations,
        };
      })
    );

    setAllOrders((prev) => [order, ...prev]);
    setUserPoints((prev) => prev + pointsEarned);
    setWishlist((prevWishlist) =>
      prevWishlist.map((item) => {
        const matchingCartItems = cartItems.filter(
          (cartItem) => (cartItem.product?.id === item.id || cartItem.productId === item.id)
        );
        if (matchingCartItems.length === 0) return item;
        const totalPurchasedQty = matchingCartItems.reduce((acc, cartItem) => acc + (cartItem.quantity || 1), 0);
        const newStock = Math.max(0, (item.stock || 0) - totalPurchasedQty);
        return {
          ...item,
          stock: newStock,
          badge: newStock === 0 ? 'AGOTADO' : item.badge === 'AGOTADO' ? undefined : item.badge,
        };
      })
    );
    setCartItems([]);
    if (usedCouponCode) {
      setRedeemedCoupons((prev) =>
        prev.map((c) => (c.code.toUpperCase() === usedCouponCode.toUpperCase() ? { ...c, isUsed: true } : c))
      );
    }
  };

  const handleToggleWishlist = (product: Product) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // PROTECTED ADMIN VIEW (ONLY ACCESSIBLE TO LOGGED-IN USERS WITH 'ADMIN' ROLE)
  if (location.pathname.startsWith('/admin')) {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-brutal-xl text-center space-y-4">
            <div className="w-16 h-16 bg-brand-orange border-3 border-black flex items-center justify-center mx-auto shadow-brutal">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase text-black font-display">ACCESO RESTRINGIDO</h2>
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              Esta sección está reservada exclusivamente para personal autorizado. Por favor, ingresa con tus credenciales de administrador.
            </p>
            <div className="pt-2 space-y-2">
              <Button variant="purple" size="md" fullWidth onClick={() => setIsAuthModalOpen(true)}>
                INICIAR SESIÓN COMO ADMIN
              </Button>
              <Button variant="white" size="md" fullWidth onClick={() => handleNavigate('inicio')}>
                VOLVER AL INICIO
              </Button>
            </div>
          </div>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AdminDashboardPage
          products={productsList}
          categories={categoriesList}
          vibes={stylesList}
          tags={tagsList}
          orders={allOrders}
          onSaveOrder={handleSaveAdminOrder}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteAdminOrder}
          currentUser={currentUser}
          onLogout={handleLogout}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddVibe={handleAddStyle}
          onEditVibe={handleEditStyle}
          onDeleteVibe={handleDeleteStyle}
          onAddTag={handleAddTag}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FDFBF7]">
      <div>
        {/* STOREFRONT HEADER */}
        <Header
          currentTab={currentTab}
          onNavigate={handleNavigate}
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          productsList={productsList}
          onSelectProduct={handleSelectProduct}
        />

        {/* MARQUEE ANNOUNCEMENT TICKER (CLIENT ONLY) */}
        <MarqueeTicker />

        {/* MAIN VIEW CONTENT */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onNavigate={handleNavigate}
                  featuredProducts={productsList}
                  wishlist={activeWishlist}
                  cartItems={cartItems}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onSelectProduct={handleSelectProduct}
                  onToggleFavorite={handleToggleWishlist}
                />
              }
            />
            <Route
              path="/catalogo"
              element={
                <CatalogPage
                  products={productsList}
                  categories={categoriesList.map((c) => c.name)}
                  vibes={stylesList.map((v) => v.name)}
                  tags={tagsList}
                  wishlist={activeWishlist}
                  cartItems={cartItems}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onSelectProduct={handleSelectProduct}
                  onOpenQuoteForm={() => handleNavigate('personalizar')}
                  onToggleFavorite={handleToggleWishlist}
                  initialSearchQuery={searchQuery}
                />
              }
            />
            <Route
              path="/producto/:id"
              element={
                <ProductDetailWrapper
                  productsList={productsList}
                  selectedProduct={selectedProduct}
                  activeWishlist={activeWishlist}
                  cartItems={cartItems}
                  currentUser={currentUser}
                  handleNavigate={handleNavigate}
                  handleAddToCart={handleAddToCart}
                  handleOpenStudioForCategory={handleOpenStudioForCategory}
                  handleSelectProduct={handleSelectProduct}
                  handleToggleWishlist={handleToggleWishlist}
                  handleAddReview={handleAddReview}
                />
              }
            />
            <Route
              path="/personalizar"
              element={
                <CustomizerPage
                  currentUser={currentUser}
                  userSavedDesigns={userSavedDesigns}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onAddToCartCustomized={handleAddToCartCustomized}
                  onSaveDesignCustomized={handleSaveDesignCustomized}
                  onDeleteSavedDesignCustomized={handleDeleteSavedDesignCustomized}
                  onNavigateToProfile={(tab) => navigate(tab ? `/perfil?tab=${tab.toLowerCase()}` : '/perfil')}
                  initialDesignToEdit={editingCustomDesign}
                />
              }
            />
            <Route
              path="/premios"
              element={
                <RewardsPage
                  userPoints={userPoints}
                  currentUser={currentUser}
                  redeemedCoupons={redeemedCoupons}
                  onRedeemReward={handleRedeemReward}
                  onNavigateToCatalog={() => handleNavigate('catalogo')}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              }
            />
            <Route
              path="/perfil"
              element={
                currentUser ? (
                  <ProfilePage
                    currentUser={currentUser}
                    allProducts={productsList}
                    userPoints={userPoints}
                    redeemedCoupons={redeemedCoupons}
                    userOrders={userOrders}
                    wishlist={activeWishlist}
                    cartItems={cartItems}
                    savedDesigns={userSavedDesigns}
                    userAddresses={userAddresses}
                    onNavigateToRewards={() => handleNavigate('premios')}
                    onNavigateToStudio={(designData) => {
                      if (designData && designData.category) {
                        const catUpper = designData.category.toUpperCase() as CustomizableCategory;
                        setEditingCustomDesign({
                          category: catUpper,
                          options: designData.options,
                          customImage: designData.customImage,
                        });
                      } else {
                        setEditingCustomDesign(null);
                      }
                      handleNavigate('personalizar');
                    }}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onAddToCartCustomized={handleAddToCartCustomized}
                    onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((p) => p.id !== id))}
                    onSelectProduct={handleSelectProduct}
                    onUpdateAddresses={(addrs) => setUserAddresses(addrs)}
                  />
                ) : (
                  <div className="max-w-md mx-auto my-12 p-8 border-4 border-black bg-white shadow-brutal-xl text-center space-y-4">
                    <div className="w-16 h-16 bg-brand-yellow border-3 border-black flex items-center justify-center mx-auto shadow-brutal">
                      <UserIcon className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl font-black uppercase text-black font-display">DEBES INICIAR SESIÓN</h2>
                    <p className="text-xs font-bold text-gray-600">
                      Para acceder a tu perfil, ver tus pedidos, administrar tus favoritos y cupones canjeados, por favor ingresa a tu cuenta.
                    </p>
                    <Button variant="purple" size="md" fullWidth onClick={() => setIsAuthModalOpen(true)}>
                      INICIAR SESIÓN / REGISTRARSE
                    </Button>
                  </div>
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* FOOTER */}
      <Footer onNavigate={handleNavigate} />

      {/* AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* SIDEBAR CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onSelectProduct={handleSelectProduct}
        onCheckout={() => {
          setIsCartOpen(false);
          if (!currentUser) {
            setPendingCheckout(true);
            setIsAuthModalOpen(true);
            return;
          }
          setIsCheckoutOpen(true);
        }}
      />

      {/* MULTI-STEP CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        currentUser={currentUser}
        redeemedCoupons={redeemedCoupons}
        userAddresses={userAddresses}
        defaultAddress={userAddresses.find((a) => a.isDefault)}
        onCompleteCheckout={handleCompleteCheckout}
        onNavigateToProfile={(tab) => handleNavigate('perfil', tab || 'PEDIDOS')}
      />
    </div>
  );
}

export default App;

