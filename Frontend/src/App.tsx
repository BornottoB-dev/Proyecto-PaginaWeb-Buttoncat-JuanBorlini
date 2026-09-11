import { useState } from 'react';
import type { Product, CartItem, CustomizationSpecs, CustomizableCategory, User, CategoryItem, VibeItem } from './types/types';
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
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'LLAVEROS / PELUCHES', emoji: '🧸', description: 'Llaveros y peluches góticos artesanales confeccionados a mano.', basePrice: 15.00, bgColor: 'bg-brand-pink text-white' },
  { id: 'cat-2', name: 'STICKERS', emoji: '✨', description: 'Stickers de vinilo mate y holográficos impermeables.', basePrice: 12.00, bgColor: 'bg-brand-orange text-white' },
  { id: 'cat-3', name: 'POSTERS', emoji: '🖼️', description: 'Posters e ilustraciones de alta resolución en papel brutalist.', basePrice: 18.00, bgColor: 'bg-brand-yellow text-black' },
  { id: 'cat-4', name: 'PINES', emoji: '📍', description: 'Pines metálicos y prendedores oscurecidos con doble cierre.', basePrice: 10.50, bgColor: 'bg-brand-cyan text-black' },
  { id: 'cat-5', name: 'ARITOS', emoji: '⚡', description: 'Aros y argollas de acero quirúrgico e inoxidable hipoalergénico.', basePrice: 14.00, bgColor: 'bg-brand-purple text-white' },
  { id: 'cat-6', name: 'COLLARES', emoji: '⛓️', description: 'Gargantillas y cadenas de capas múltiples con dijes alternativos.', basePrice: 25.00, bgColor: 'bg-brand-pink text-white' },
  { id: 'cat-7', name: 'REMERAS', emoji: '👕', description: 'Remeras 100% algodón peinado estampadas con serigrafía.', basePrice: 32.00, bgColor: 'bg-brand-yellow text-black' },
  { id: 'cat-8', name: 'PINTURAS', emoji: '🎨', description: 'Obras y pinturas en lienzo originales hechas a mano.', basePrice: 45.00, bgColor: 'bg-brand-orange text-white' },
];

const INITIAL_VIBES: VibeItem[] = [
  { id: 'vibe-1', name: 'GOTH', emoji: '🖤', badgeBg: 'bg-black text-white' },
  { id: 'vibe-2', name: 'Y2K', emoji: '💿', badgeBg: 'bg-brand-pink text-white' },
  { id: 'vibe-3', name: 'KAWAII', emoji: '🎀', badgeBg: 'bg-brand-yellow text-black' },
  { id: 'vibe-4', name: 'PUNK', emoji: '⚡', badgeBg: 'bg-brand-orange text-white' },
  { id: 'vibe-5', name: 'ROCK', emoji: '🎸', badgeBg: 'bg-brand-purple text-white' },
  { id: 'vibe-6', name: 'NEÓN', emoji: '💡', badgeBg: 'bg-brand-cyan text-black' },
];

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [vibesList, setVibesList] = useState<VibeItem[]>(INITIAL_VIBES);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: MOCK_PRODUCTS[0], quantity: 1 },
    { product: MOCK_PRODUCTS[1], quantity: 2 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
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

  // AUTH LOGIC
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      handleNavigate('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (currentTab === 'admin') {
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
    handleNavigate('producto');
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
    if (query.trim() && currentTab !== 'catalogo') {
      handleNavigate('catalogo');
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FDFBF7]">
      <div>
        {/* HEADER */}
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

        {/* MARQUEE ANNOUNCEMENT TICKER */}
        <MarqueeTicker />

        {/* MAIN VIEW CONTENT */}
        <main className="flex-1">
          {currentTab === 'inicio' && (
            <HomePage
              onNavigate={handleNavigate}
              featuredProducts={productsList}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentTab === 'catalogo' && (
            <CatalogPage
              products={productsList}
              categories={categoriesList.map((c) => c.name)}
              vibes={vibesList.map((v) => v.name)}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onSelectProduct={handleSelectProduct}
              onOpenQuoteForm={() => handleNavigate('personalizar')}
              initialSearchQuery={searchQuery}
            />
          )}

          {currentTab === 'producto' && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              allProducts={productsList}
              onBackToCatalog={() => handleNavigate('catalogo')}
              onAddToCart={handleAddToCart}
              onOpenCustomizerStudio={handleOpenStudioForCategory}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentTab === 'personalizar' && (
            <CustomizerPage
              onAddToCartCustomized={handleAddToCartCustomized}
            />
          )}

          {currentTab === 'perfil' && <ProfilePage />}

          {currentTab === 'admin' && (
            <AdminDashboardPage
              products={productsList}
              categories={categoriesList}
              vibes={vibesList}
              onBackToStore={() => handleNavigate('inicio')}
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
          )}
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
          alert('¡Redirigiendo a Checkout con Mercado Pago (RF-15)...');
        }}
      />
    </div>
  );
}

export default App;
