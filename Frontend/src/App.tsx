import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import type { Product, CartItem, CustomizationSpecs, CustomizableCategory, User, CategoryItem, VibeItem, RewardItem, RedeemedCoupon, AdminOrder } from './types/types';
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

const INITIAL_VIBES: VibeItem[] = [
  { id: 'vibe-1', name: 'GOTH', badgeBg: 'bg-black text-white' },
  { id: 'vibe-2', name: 'Y2K', badgeBg: 'bg-brand-pink text-white' },
  { id: 'vibe-3', name: 'KAWAII', badgeBg: 'bg-brand-yellow text-black' },
  { id: 'vibe-4', name: 'PUNK', badgeBg: 'bg-brand-orange text-white' },
  { id: 'vibe-5', name: 'ROCK', badgeBg: 'bg-brand-purple text-white' },
  { id: 'vibe-6', name: 'NEÓN', badgeBg: 'bg-brand-cyan text-black' },
];

function ProductDetailWrapper({
  productsList,
  selectedProduct,
  activeWishlist,
  handleNavigate,
  handleAddToCart,
  handleOpenStudioForCategory,
  handleSelectProduct,
  handleToggleWishlist,
}: {
  productsList: Product[];
  selectedProduct: Product | null;
  activeWishlist: Product[];
  handleNavigate: (tab: string) => void;
  handleAddToCart: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  handleOpenStudioForCategory: (cat: CustomizableCategory) => void;
  handleSelectProduct: (p: Product) => void;
  handleToggleWishlist: (p: Product) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const product = selectedProduct && selectedProduct.id === id 
    ? selectedProduct 
    : productsList.find((p) => p.id === id);

  if (!product) {
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <ProductDetailPage
      product={product}
      allProducts={productsList}
      wishlist={activeWishlist}
      onBackToCatalog={() => handleNavigate('catalogo')}
      onAddToCart={handleAddToCart}
      onOpenCustomizerStudio={handleOpenStudioForCategory}
      onSelectProduct={handleSelectProduct}
      onToggleFavorite={handleToggleWishlist}
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
  const [vibesList, setVibesList] = useState<VibeItem[]>(INITIAL_VIBES);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userPoints, setUserPoints] = useState<number>(450);
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedCoupon[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<AdminOrder[]>([
    {
      id: 'BTC-9842',
      customerName: 'Juan Borlini',
      customerEmail: 'juan.borlini@email.com',
      date: '24/09/2026',
      total: 34500,
      status: 'EN_CONFECCION',
      itemsCount: 3,
      itemsSummary: '2x PACK PEGATINAS KAWAII, 1x PELUCHE VOID BEAR',
      isCustomOrder: true,
      trackingNumber: 'AR982341293AR',
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA',
      paymentMethod: 'Mercado Pago',
    },
    {
      id: 'BTC-8102',
      customerName: 'Juan Borlini',
      customerEmail: 'juan.borlini@email.com',
      date: '10/08/2026',
      total: 18000,
      status: 'ENTREGADO',
      itemsCount: 1,
      itemsSummary: '1x POSTER ARTWORK CYBERPUNK',
      isCustomOrder: false,
      trackingNumber: 'AR810239102AR',
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA',
      paymentMethod: 'Transferencia Bancaria',
    },
  ]);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: MOCK_PRODUCTS[0], quantity: 1 },
    { product: MOCK_PRODUCTS[1], quantity: 2 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const activeWishlist = currentUser ? wishlist : [];

  const handleRedeemReward = (reward: RewardItem) => {
    setUserPoints((prev) => Math.max(0, prev - reward.pointsCost));
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCoupon: RedeemedCoupon = {
      id: `coupon-${Date.now()}`,
      rewardId: reward.id,
      rewardTitle: reward.title,
      code: `${reward.codePrefix}-${randomSuffix}`,
      discountValue: reward.discountValue,
      pointsSpent: reward.pointsCost,
      redeemedAt: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      isUsed: false,
    };
    setRedeemedCoupons((prev) => [newCoupon, ...prev]);
  };

  const handleNavigate = (tab: string) => {
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
        navigate('/perfil');
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

  // VIBE CRUD HANDLERS
  const handleAddVibe = (newVibe: VibeItem) => {
    setVibesList((prev) => [...prev, newVibe]);
  };

  const handleEditVibe = (updatedVibe: VibeItem) => {
    setVibesList((prev) =>
      prev.map((v) => (v.id === updatedVibe.id ? updatedVibe : v))
    );
  };

  const handleDeleteVibe = (vibeId: string) => {
    setVibesList((prev) => prev.filter((v) => v.id !== vibeId));
  };

  const [pendingCheckout, setPendingCheckout] = useState(false);

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
    const detailsStr = selectedOptions
      ? Object.entries(selectedOptions).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ')
      : undefined;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.customizationDetails === detailsStr
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, customizationDetails: detailsStr }];
    });
    setIsCartOpen(true);
  };

  const handleAddToCartCustomized = (product: Product, specs: CustomizationSpecs) => {
    const uniqueId = `custom-${specs.category.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const uniqueProduct: Product = {
      ...product,
      id: uniqueId,
    };
    setCartItems((prev) => [
      ...prev,
      {
        product: uniqueProduct,
        quantity: 1,
        customizationSpecs: specs,
        customizationDetails: specs.summaryText,
      },
    ]);
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

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !location.pathname.startsWith('/catalogo')) {
      handleNavigate('catalogo');
    }
  };

  const handleCompleteCheckout = (order: AdminOrder, pointsEarned: number) => {
    setUserOrders((prev) => [order, ...prev]);
    setUserPoints((prev) => prev + pointsEarned);
    setCartItems([]);
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

  // ISOLATED ADMIN VIEW (NO STOREFRONT HEADER, NO MARQUEE TICKER, NO STOREFRONT FOOTER)
  if (location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AdminDashboardPage
          products={productsList}
          categories={categoriesList}
          vibes={vibesList}
          currentUser={currentUser}
          onLogout={handleLogout}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddVibe={handleAddVibe}
          onEditVibe={handleEditVibe}
          onDeleteVibe={handleDeleteVibe}
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
                  vibes={vibesList.map((v) => v.name)}
                  wishlist={activeWishlist}
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
                  handleNavigate={handleNavigate}
                  handleAddToCart={handleAddToCart}
                  handleOpenStudioForCategory={handleOpenStudioForCategory}
                  handleSelectProduct={handleSelectProduct}
                  handleToggleWishlist={handleToggleWishlist}
                />
              }
            />
            <Route
              path="/personalizar"
              element={
                <CustomizerPage
                  onAddToCartCustomized={handleAddToCartCustomized}
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
                    userPoints={userPoints}
                    redeemedCoupons={redeemedCoupons}
                    userOrders={userOrders}
                    wishlist={activeWishlist}
                    onNavigateToRewards={() => handleNavigate('premios')}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onRemoveFromWishlist={(id) => setWishlist((prev) => prev.filter((p) => p.id !== id))}
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
        onCompleteCheckout={handleCompleteCheckout}
        onNavigateToProfile={() => handleNavigate('perfil')}
      />
    </div>
  );
}

export default App;

