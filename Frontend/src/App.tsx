import { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import type { Product, CartItem, CustomizationSpecs, CustomizableCategory, User, CategoryItem, StyleItem, BadgeItem, RedeemedCoupon, AdminOrder, OrderStatus, UserAddress, SavedDesign, RewardItem, RewardCategoryItem } from './types/types';
import { getDefaultOptionsForProduct, calculateEffectiveProductPrice, calculateEffectiveProductStock, getCartItemMaxStock, getOptionLabel, getOptionPriceDelta, getNextAutoNumericId } from './types/types';
import { catalogApi, paymentsRewardsApi, ordersApi, customProductsApi, authApi, clientsApi } from './services/api';
import { syncTemplatesFromBackend } from './data/customStore';
import {
  mapBackendProductToFrontend,
  mapBackendCategoryToFrontend,
  mapBackendStyleToFrontend,
  mapBackendTagToFrontend,
  mapBackendRewardToFrontend,
  mapBackendRewardCategoryToFrontend,
  mapBackendClientRewardToFrontend,
  mapBackendDomicilioToFrontend,
  mapBackendSavedDesignToFrontend,
  mapBackendOrderToFrontend,
  mapFrontendProductToBackend,
  mapFrontendRewardToBackend,
} from './services/mappers';
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
import { CustomQuotePage } from './pages/CustomQuotePage';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/cart/CheckoutModal';
import { Button } from './components/ui/Button';
import { FullPageLoadingScreen } from './components/ui/LoadingScreen';

const INITIAL_CATEGORIES: CategoryItem[] = [];
const INITIAL_STYLES: StyleItem[] = [];
const INITIAL_TAGS: BadgeItem[] = [];

function ProductDetailWrapper({
  productsList,
  tagsList,
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
  isCatalogLoading,
}: {
  productsList: Product[];
  tagsList?: BadgeItem[];
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
  isCatalogLoading?: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const product = (id ? productsList.find((p) => p.id === id) : null) || (selectedProduct && (!id || selectedProduct.id === id) ? selectedProduct : null) || selectedProduct;

  if (isCatalogLoading && !product) {
    return (
      <FullPageLoadingScreen
        title="CARGANDO PRODUCTO..."
        subtitle="Obteniendo detalles y variantes del producto"
      />
    );
  }

  if (
    !product ||
    product.hiddenFromCatalog ||
    product.isRewardOnly ||
    (product.id && product.id.toString().startsWith('custom-'))
  ) {
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <ProductDetailPage
      product={product}
      allProducts={productsList}
      tags={tagsList}
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
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>('');

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handleSearchSubmit = (q: string) => {
    setAppliedSearchQuery(q);
    handleNavigate('catalogo');
  };

  const handleClearSearch = () => {
    setAppliedSearchQuery('');
    setSearchQuery('');
  };

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
  const [rewardCategoriesList, setRewardCategoriesList] = useState<RewardCategoryItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [stylesList, setStylesList] = useState<StyleItem[]>(INITIAL_STYLES);
  const [tagsList, setTagsList] = useState<BadgeItem[]>(INITIAL_TAGS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedCoupon[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);

  const loadClientUserData = (userId: number, role?: string) => {
    if (isNaN(userId) || userId <= 0) return;

    ordersApi.getAll(role === 'ADMIN' ? undefined : { idCliente: userId }).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setAllOrders(res.data.map(mapBackendOrderToFrontend));
      }
    }).catch(() => {});

    clientsApi.getDomicilios(userId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setUserAddresses(res.data.map(mapBackendDomicilioToFrontend));
      }
    }).catch(() => {});

    paymentsRewardsApi.getClientRewards(userId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setRedeemedCoupons(res.data.map(mapBackendClientRewardToFrontend));
      }
    }).catch(() => {});

    clientsApi.getFavoritos(userId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const mappedFavs: Product[] = res.data
          .filter((item: any) => item.producto)
          .map((item: any) => mapBackendProductToFrontend(item.producto));
        setWishlist(mappedFavs);
      }
    }).catch(() => {});

    customProductsApi.getClientFavorites(userId).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setUserSavedDesigns(res.data.map(mapBackendSavedDesignToFrontend));
      }
    }).catch(() => {});
  };

  // CARGA DE DATOS REALES DESDE LA API DEL BACKEND
  useEffect(() => {
    // Restaurar sesion si existe token valido (limpiando posibles sesiones demo antiguas)
    const savedToken = localStorage.getItem('buttoncat_token');
    const savedUserStr = localStorage.getItem('buttoncat_user');
    if (savedUserStr && !savedToken) {
      localStorage.removeItem('buttoncat_user');
    }
    if (savedToken && savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (!u.id || isNaN(Number(u.id))) {
          localStorage.removeItem('buttoncat_token');
          localStorage.removeItem('buttoncat_user');
        } else {
          setCurrentUser(u);
          setUserPoints(u.points || 0);
          loadClientUserData(Number(u.id), u.role);
        }
      } catch {
        localStorage.removeItem('buttoncat_token');
        localStorage.removeItem('buttoncat_user');
      }

      authApi.getMe().then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
          setUserPoints(res.data.points || 0);
          localStorage.setItem('buttoncat_user', JSON.stringify(res.data));
          if (res.data.id && !isNaN(Number(res.data.id))) {
            loadClientUserData(Number(res.data.id), res.data.role);
          }
        } else {
          localStorage.removeItem('buttoncat_token');
          localStorage.removeItem('buttoncat_user');
          setCurrentUser(null);
        }
      });
    }

    catalogApi.getCategories().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setCategoriesList(res.data.map(mapBackendCategoryToFrontend));
      }
    });

    catalogApi.getStyles().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setStylesList(res.data.map(mapBackendStyleToFrontend));
      }
    });

    catalogApi.getTags().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setTagsList(res.data.map(mapBackendTagToFrontend));
      }
    });

    catalogApi
      .getProducts()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setProductsList(res.data.map(mapBackendProductToFrontend));
        }
      })
      .finally(() => {
        setIsCatalogLoading(false);
      });

    paymentsRewardsApi.getRewardCategories().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setRewardCategoriesList(res.data.map(mapBackendRewardCategoryToFrontend));
      }
    });

    paymentsRewardsApi.getRewards().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setRewardsList(res.data.map(mapBackendRewardToFrontend));
      }
    });

    customProductsApi.getTemplates().then((res) => {
      if (res.success && res.data) {
        syncTemplatesFromBackend(res.data);
      }
    });
  }, []);

  const handleSaveReward = async (rewardData: RewardItem) => {
    try {
      const idNum = Number(rewardData.id);
      const payload = mapFrontendRewardToBackend(rewardData, rewardCategoriesList);
      if (!isNaN(idNum) && idNum > 0) {
        const res = await paymentsRewardsApi.updateReward(idNum, payload);
        if (res.success && res.data) {
          const mapped = mapBackendRewardToFrontend(res.data);
          setRewardsList((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
          return;
        }
      } else {
        const res = await paymentsRewardsApi.createReward(payload);
        if (res.success && res.data) {
          const mapped = mapBackendRewardToFrontend(res.data);
          setRewardsList((prev) => [mapped, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.error('[SaveReward API Error]:', err);
    }
    setRewardsList((prev) => {
      const exists = prev.some((r) => r.id === rewardData.id);
      if (exists) return prev.map((r) => (r.id === rewardData.id ? rewardData : r));
      return [rewardData, ...prev];
    });
  };

  const handleDeleteReward = async (rewardId: string) => {
    try {
      const idNum = Number(rewardId);
      if (!isNaN(idNum)) {
        await paymentsRewardsApi.deleteReward(idNum);
      }
    } catch (err) {
      console.error('[DeleteReward API Error]:', err);
    }
    setRewardsList((prev) => prev.filter((r) => r.id !== rewardId));
  };

  const handleSaveRewardCategory = async (categoryData: RewardCategoryItem) => {
    try {
      const idNum = Number(categoryData.id);
      if (!isNaN(idNum) && idNum > 0) {
        const res = await paymentsRewardsApi.updateRewardCategory(idNum, categoryData.name);
        if (res.success && res.data) {
          const mapped = mapBackendRewardCategoryToFrontend(res.data);
          setRewardCategoriesList((prev) => prev.map((c) => (c.id === mapped.id ? mapped : c)));
          return;
        }
      } else {
        const res = await paymentsRewardsApi.createRewardCategory(categoryData.name);
        if (res.success && res.data) {
          const mapped = mapBackendRewardCategoryToFrontend(res.data);
          setRewardCategoriesList((prev) => [...prev, mapped]);
          return;
        }
      }
    } catch (err) {
      console.error('[SaveRewardCategory API Error]:', err);
    }
    setRewardCategoriesList((prev) => {
      const exists = prev.some((c) => c.id === categoryData.id);
      if (exists) return prev.map((c) => (c.id === categoryData.id ? categoryData : c));
      return [...prev, categoryData];
    });
  };

  const handleDeleteRewardCategory = async (categoryId: string) => {
    try {
      const idNum = Number(categoryId);
      if (!isNaN(idNum)) {
        await paymentsRewardsApi.deleteRewardCategory(idNum);
      }
    } catch (err) {
      console.error('[DeleteRewardCategory API Error]:', err);
    }
    setRewardCategoriesList((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const visibleProductsList = useMemo(
    () => productsList.filter((p) => !p.hiddenFromCatalog && !p.isRewardOnly),
    [productsList]
  );

  const handleClaimRewardProduct = (product: Product, couponCode: string) => {
    const freshProduct = productsList.find((p) => p.id === product.id) || product;
    const rewardProduct: Product = {
      ...freshProduct,
      price: 0,
    };
    const newItemId = `cart-reward-${freshProduct.id}-${Date.now()}`;
    setCartItems((prev) => {
      const alreadyInCart = prev.some((item) => item.rewardCouponCode === couponCode);
      if (alreadyInCart) {
        return prev;
      }
      return [
        ...prev,
        {
          id: newItemId,
          product: rewardProduct,
          quantity: 1,
          isRewardClaim: true,
          rewardCouponCode: couponCode,
          customizationDetails: `PREMIO RECLAMADO (CUPÓN: ${couponCode})`,
        },
      ];
    });
    setIsCartOpen(true);
  };

  // TAG / BADGE CRUD HANDLERS
  const handleAddTag = async (newTag: BadgeItem) => {
    try {
      const res = await catalogApi.createTag({
        nombreEtiqueta: newTag.name,
        color: newTag.badgeBg || 'bg-brand-orange text-white',
      });
      if (res.success && res.data) {
        const mapped = mapBackendTagToFrontend(res.data);
        setTagsList((prev) => [...prev, mapped]);
        return;
      }
    } catch (err) {
      console.error('[AddTag API Error]:', err);
    }
    setTagsList((prev) => [...prev, newTag]);
  };

  const handleEditTag = async (updatedTag: BadgeItem) => {
    try {
      const idNum = Number(updatedTag.id);
      if (!isNaN(idNum)) {
        const res = await catalogApi.updateTag(idNum, {
          nombreEtiqueta: updatedTag.name,
          color: updatedTag.badgeBg,
        });
        if (res.success && res.data) {
          const mapped = mapBackendTagToFrontend(res.data);
          setTagsList((prev) =>
            prev.map((t) => (t.id === mapped.id ? mapped : t))
          );
          return;
        }
      }
    } catch (err) {
      console.error('[EditTag API Error]:', err);
    }
    setTagsList((prev) =>
      prev.map((t) => (t.id === updatedTag.id ? updatedTag : t))
    );
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const idNum = Number(tagId);
      if (!isNaN(idNum)) {
        await catalogApi.deleteTag(idNum);
      }
    } catch (err) {
      console.error('[DeleteTag API Error]:', err);
    }
    setTagsList((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleSaveAdminOrder = async (orderData: AdminOrder) => {
    const isExistingBackendOrder =
      orderData.id !== 'NEW' &&
      !orderData.id.startsWith('ORD-') &&
      !isNaN(Number(orderData.id)) &&
      allOrders.some((o) => o.id === orderData.id);

    try {
      if (isExistingBackendOrder) {
        const res = await ordersApi.update(orderData.id, {
          idMetodoPago: orderData.idMetodoPago,
          nombreCompleto: orderData.customerName,
          correoContacto: orderData.customerEmail,
          telefonoContacto: orderData.customerPhone || '11-5544-3322',
          provinciaEntrega: orderData.shippingProvince || undefined,
          localidadEntrega: orderData.shippingCity || undefined,
          calleEntrega: orderData.shippingAddress || orderData.shippingDestination || undefined,
          costoDeEnvio: orderData.shippingCost ?? 0,
          descuento: orderData.discountAmount ?? 0,
          total: orderData.total,
          estado: orderData.status,
          codigoSeguimiento: orderData.trackingNumber,
        });
        if (res.success && res.data) {
          const mapped = mapBackendOrderToFrontend(res.data);
          setAllOrders((prev) =>
            prev.map((o) =>
              o.id === orderData.id
                ? {
                    ...orderData,
                    ...mapped,
                    id: mapped.id,
                    isCustomOrder: Boolean(orderData.isCustomOrder || mapped.isCustomOrder),
                  }
                : o
            )
          );
          return;
        }
      } else {
        const mappedItems =
          orderData.items && orderData.items.length > 0
            ? orderData.items.map((line) => {
                if (line.isCustom || !line.productId || isNaN(Number(line.productId))) {
                  const isWorkshopItem = line.customType === 'WORKSHOP' && Boolean(line.templateCategory);
                  return {
                    customProduct: {
                      nombre: line.productName,
                      categoria: isWorkshopItem ? line.templateCategory : 'ITEM_A_MEDIDA',
                      precio: line.unitPrice,
                      comentario: line.optionsText,
                    },
                    cantidad: line.quantity || 1,
                  };
                }
                return {
                  idVariante: line.variantId,
                  idProducto: !line.variantId ? Number(line.productId) : undefined,
                  cantidad: line.quantity || 1,
                };
              })
            : [
                {
                  customProduct: {
                    nombre: orderData.itemsSummary || 'Pedido Manual Admin',
                    categoria: 'ITEM_A_MEDIDA',
                    precio: orderData.subtotal || orderData.total || 1500,
                  },
                  cantidad: 1,
                },
              ];

        const res = await ordersApi.create({
          idCliente: orderData.customerId && !isNaN(Number(orderData.customerId)) ? Number(orderData.customerId) : undefined,
          idMetodoPago: orderData.idMetodoPago,
          nombreCompleto: orderData.customerName,
          correoContacto: orderData.customerEmail,
          telefonoContacto: orderData.customerPhone || '11-5544-3322',
          provinciaEntrega: orderData.shippingProvince || undefined,
          localidadEntrega: orderData.shippingCity || undefined,
          calleEntrega: orderData.shippingAddress || orderData.shippingDestination || undefined,
          costoDeEnvio: orderData.shippingCost || 0,
          descuentoManual: orderData.discountAmount || 0,
          codigoPremio: orderData.appliedCouponCode || undefined,
          estado: orderData.status,
          items: mappedItems,
        });
        if (res.success && res.data) {
          const mapped = mapBackendOrderToFrontend(res.data);
          setAllOrders((prev) => [
            {
              ...orderData,
              ...mapped,
              id: mapped.id,
              isCustomOrder: Boolean(orderData.isCustomOrder || mapped.isCustomOrder),
            },
            ...prev.filter((o) => o.id !== orderData.id && o.id !== mapped.id),
          ]);
          catalogApi.getProducts().then((prodRes) => {
            if (prodRes.success && prodRes.data) {
              setProductsList(prodRes.data.map(mapBackendProductToFrontend));
            }
          });
          return;
        }
      }
    } catch (err) {
      console.error('[SaveAdminOrder API Error]:', err);
    }
    setAllOrders((prev) => {
      const exists = prev.some((o) => o.id === orderData.id);
      if (exists) return prev.map((o) => (o.id === orderData.id ? orderData : o));
      const fallbackNumericId = getNextAutoNumericId('', prev);
      return [{ ...orderData, id: fallbackNumericId }, ...prev];
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
    } catch (err) {
      console.error('[UpdateOrderStatus API Error]:', err);
    }
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteAdminOrder = async (orderId: string) => {
    try {
      await ordersApi.deleteOrder(orderId);
    } catch (err) {
      console.error('[DeleteAdminOrder API Error]:', err);
    }
    setAllOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const userOrders = currentUser
    ? allOrders.filter(
        (o) =>
          (o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (o.customerName && o.customerName.toLowerCase() === currentUser.name.toLowerCase())
      )
    : [];

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const activeWishlist = currentUser ? wishlist : [];

  const handleRedeemReward = (coupon: RedeemedCoupon) => {
    const nextPoints = Math.max(0, userPoints - coupon.pointsSpent);
    setUserPoints(nextPoints);
    if (currentUser) {
      const updatedUser = { ...currentUser, points: nextPoints };
      setCurrentUser(updatedUser);
      localStorage.setItem('buttoncat_user', JSON.stringify(updatedUser));
    }
    setRedeemedCoupons((prev) => [coupon, ...prev.filter((c) => c.id !== coupon.id)]);
    setRewardsList((prev) =>
      prev.map((r) =>
        r.id === coupon.rewardId && r.stock !== undefined
          ? { ...r, stock: Math.max(0, r.stock - 1) }
          : r
      )
    );
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
      case 'presupuesto':
        navigate('/presupuesto');
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
  const handleAddProduct = async (newProduct: Product) => {
    try {
      const payload = mapFrontendProductToBackend(newProduct, categoriesList, tagsList, stylesList);
      const res = await catalogApi.createProduct(payload);
      if (res.success && res.data) {
        const mapped = mapBackendProductToFrontend(res.data);
        const merged: Product = {
          ...newProduct,
          ...mapped,
          hasVariations: newProduct.hasVariations ?? mapped.hasVariations,
          variations: (newProduct.variations && newProduct.variations.length > 0) ? newProduct.variations : mapped.variations,
          variantStocks: (newProduct.variantStocks && Object.keys(newProduct.variantStocks).length > 0) ? newProduct.variantStocks : mapped.variantStocks,
          variantImages: (newProduct.variantImages && Object.keys(newProduct.variantImages).length > 0) ? newProduct.variantImages : mapped.variantImages,
        };
        setProductsList((prev) => [merged, ...prev]);
        return;
      }
    } catch (err) {
      console.error('[AddProduct API Error]:', err);
    }
    setProductsList((prev) => [newProduct, ...prev]);
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      const idNum = Number(updatedProduct.id);
      if (!isNaN(idNum)) {
        const payload = mapFrontendProductToBackend(updatedProduct, categoriesList, tagsList, stylesList);
        const res = await catalogApi.updateProduct(idNum, payload);
        if (res.success && res.data) {
          const mapped = mapBackendProductToFrontend(res.data);
          const merged: Product = {
            ...updatedProduct,
            ...mapped,
            hasVariations: updatedProduct.hasVariations ?? mapped.hasVariations,
            variations: (updatedProduct.variations && updatedProduct.variations.length > 0) ? updatedProduct.variations : mapped.variations,
            variantStocks: (updatedProduct.variantStocks && Object.keys(updatedProduct.variantStocks).length > 0) ? updatedProduct.variantStocks : mapped.variantStocks,
            variantImages: (updatedProduct.variantImages && Object.keys(updatedProduct.variantImages).length > 0) ? updatedProduct.variantImages : mapped.variantImages,
          };
          setProductsList((prev) =>
            prev.map((p) => (p.id === merged.id ? merged : p))
          );
          if (selectedProduct && selectedProduct.id === merged.id) {
            setSelectedProduct(merged);
          }
          return;
        }
      }
    } catch (err) {
      console.error('[EditProduct API Error]:', err);
    }
    setProductsList((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const idNum = Number(productId);
      if (!isNaN(idNum)) {
        await catalogApi.deleteProduct(idNum, true);
      }
    } catch (err) {
      console.error('[DeleteProduct API Error]:', err);
    }
    setProductsList((prev) => prev.filter((p) => p.id !== productId));
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
      handleNavigate('catalogo');
    }
  };

  // REVIEWS & RATINGS HANDLER
  const handleAddReview = async (productId: string, newReview: { rating: number; comment: string; userName: string }) => {
    const reviewObj = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userName: newReview.userName.trim() || 'Cliente Buttoncat',
      rating: newReview.rating,
      date: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      comment: newReview.comment.trim(),
    };

    const idNum = Number(productId);
    if (!isNaN(idNum)) {
      try {
        await catalogApi.addProductReview(idNum, {
          idCliente: currentUser?.id && !isNaN(Number(currentUser.id)) ? Number(currentUser.id) : 1,
          calificacion: newReview.rating,
          comentario: newReview.comment.trim(),
        });
      } catch (err) {
        console.error('[AddReview API Error]:', err);
      }
    }

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
  const mapCategoryVariationTypesToBackend = (variationTypes?: CategoryItem['variationTypes']) => {
    if (!variationTypes) return undefined;
    return variationTypes.map((vt) => ({
      nombreVariacion: vt.name,
      opciones: (vt.options || []).map((opt) => ({
        nombreOpcion: getOptionLabel(opt),
        precioExtra: getOptionPriceDelta(opt),
      })),
    }));
  };

  const handleAddCategory = async (newCategory: CategoryItem) => {
    try {
      const res = await catalogApi.createCategory({
        nombreCategoria: newCategory.name,
        precioBase: newCategory.basePrice || 0,
        color: newCategory.bgColor || 'bg-brand-pink text-white',
        descripcion: newCategory.description || '',
        variaciones: mapCategoryVariationTypesToBackend(newCategory.variationTypes),
      });
      if (res.success && res.data) {
        const mapped = mapBackendCategoryToFrontend(res.data);
        setCategoriesList((prev) => [...prev, mapped]);
        return;
      }
    } catch (err) {
      console.error('[AddCategory API Error]:', err);
    }
    setCategoriesList((prev) => [...prev, newCategory]);
  };

  const handleEditCategory = async (updatedCategory: CategoryItem) => {
    try {
      const idNum = Number(updatedCategory.id);
      if (!isNaN(idNum)) {
        const res = await catalogApi.updateCategory(idNum, {
          nombreCategoria: updatedCategory.name,
          precioBase: updatedCategory.basePrice || 0,
          color: updatedCategory.bgColor,
          descripcion: updatedCategory.description,
          variaciones: mapCategoryVariationTypesToBackend(updatedCategory.variationTypes),
        });
        if (res.success && res.data) {
          const mapped = mapBackendCategoryToFrontend(res.data);
          setCategoriesList((prev) =>
            prev.map((c) => (c.id === mapped.id ? mapped : c))
          );
          return;
        }
      }
    } catch (err) {
      console.error('[EditCategory API Error]:', err);
    }
    setCategoriesList((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const idNum = Number(categoryId);
      if (!isNaN(idNum)) {
        await catalogApi.deleteCategory(idNum);
      }
    } catch (err) {
      console.error('[DeleteCategory API Error]:', err);
    }
    setCategoriesList((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // STYLE CRUD HANDLERS
  const handleAddStyle = async (newStyle: StyleItem) => {
    try {
      const res = await catalogApi.createStyle({
        estilo: newStyle.name,
        color: newStyle.badgeBg || 'bg-black text-white',
      });
      if (res.success && res.data) {
        const mapped = mapBackendStyleToFrontend(res.data);
        setStylesList((prev) => [...prev, mapped]);
        return;
      }
    } catch (err) {
      console.error('[AddStyle API Error]:', err);
    }
    setStylesList((prev) => [...prev, newStyle]);
  };

  const handleEditStyle = async (updatedStyle: StyleItem) => {
    try {
      const idNum = Number(updatedStyle.id);
      if (!isNaN(idNum)) {
        const res = await catalogApi.updateStyle(idNum, {
          estilo: updatedStyle.name,
          color: updatedStyle.badgeBg,
        });
        if (res.success && res.data) {
          const mapped = mapBackendStyleToFrontend(res.data);
          setStylesList((prev) =>
            prev.map((s) => (s.id === mapped.id ? mapped : s))
          );
          return;
        }
      }
    } catch (err) {
      console.error('[EditStyle API Error]:', err);
    }
    setStylesList((prev) =>
      prev.map((v) => (v.id === updatedStyle.id ? updatedStyle : v))
    );
  };

  const handleDeleteStyle = async (styleId: string) => {
    try {
      const idNum = Number(styleId);
      if (!isNaN(idNum)) {
        await catalogApi.deleteStyle(idNum);
      }
    } catch (err) {
      console.error('[DeleteStyle API Error]:', err);
    }
    setStylesList((prev) => prev.filter((v) => v.id !== styleId));
  };

  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [userSavedDesigns, setUserSavedDesigns] = useState<SavedDesign[]>([]);
  const [editingCustomDesign, setEditingCustomDesign] = useState<{
    category: CustomizableCategory;
    options?: Record<string, string>;
    customImage?: string | null;
    name?: string;
    description?: string;
  } | null>(null);

  const handleSaveDesignCustomized = async (savedDesign: SavedDesign) => {
    setUserSavedDesigns((prev) => [savedDesign, ...prev]);

    try {
      const res = await customProductsApi.createCustomProduct({
        nombrePlantilla: savedDesign.category,
        nombreCustom: savedDesign.name,
        opciones: savedDesign.options,
        idCliente: currentUser?.id && !isNaN(Number(currentUser.id)) ? Number(currentUser.id) : undefined,
        imagenSubidaClienteUrl: savedDesign.customImage,
        transformImagenSubida: savedDesign.imageTransforms,
        comentarioCliente: savedDesign.description,
      });
      if (res.success && res.data) {
        const persisted = mapBackendSavedDesignToFrontend(res.data);
        setUserSavedDesigns((prev) =>
          prev.map((d) => (d.id === savedDesign.id ? persisted : d))
        );
      }
    } catch (err) {
      console.error('[SaveCustomDesign API Error]:', err);
    }
  };

  const handleDeleteSavedDesignCustomized = async (designId: string) => {
    setUserSavedDesigns((prev) => prev.filter((d) => d.id !== designId));

    if (currentUser?.id && !isNaN(Number(currentUser.id)) && !designId.startsWith('des-')) {
      try {
        await customProductsApi.toggleFavorite(Number(currentUser.id), designId);
      } catch (err) {
        console.error('[DeleteCustomDesign API Error]:', err);
      }
    }
  };

  // AUTH LOGIC
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUserPoints(user.points || 0);
    localStorage.setItem('buttoncat_user', JSON.stringify(user));
    if (user.id && !isNaN(Number(user.id))) {
      loadClientUserData(Number(user.id), user.role);
    }
    if (user.role === 'ADMIN') {
      handleNavigate('admin');
    } else if (pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('buttoncat_token');
    localStorage.removeItem('buttoncat_user');
    setCurrentUser(null);
    setUserPoints(0);
    setUserAddresses([]);
    setRedeemedCoupons([]);
    setWishlist([]);
    setUserSavedDesigns([]);
    setAllOrders([]);
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
      return [...prev, { id: newItemId, product: productToCart, quantity: actualQty, selectedOptions: Object.keys(finalOptions).length > 0 ? finalOptions : undefined, customizationDetails: detailsStr }];
    });
    setIsCartOpen(true);
  };

  const handleAddToCartCustomized = (product: Product, specs: CustomizationSpecs) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => {
        if (!item.customizationSpecs) return false;
        if (item.customizationSpecs.category !== specs.category) return false;
        if ((item.customizationSpecs.customName || '') !== (specs.customName || '')) return false;
        if ((item.customizationSpecs.customDescription || '') !== (specs.customDescription || '')) return false;

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
        name: specs.customName || product.name,
        description: specs.customDescription 
          ? `${specs.customDescription} • Detalle: ${specs.summaryText}` 
          : product.description,
      };
      const cartItemId = `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return [
        ...prev,
        {
          id: cartItemId,
          product: uniqueProduct,
          quantity: 1,
          customizationSpecs: specs,
          customizationDetails: specs.customDescription 
            ? `Nota: "${specs.customDescription}" • ${specs.summaryText}`
            : specs.summaryText,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (
      product.hiddenFromCatalog ||
      product.isRewardOnly ||
      (product.id && product.id.toString().startsWith('custom-'))
    ) {
      return;
    }
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

  const handleCompleteCheckout = (order: AdminOrder, pointsEarned: number, usedCouponCode?: string) => {
    // 1. Agregar pedido persistido a la lista de pedidos
    setAllOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);

    // 2. Acreditar puntos de fidelizacion
    setUserPoints((prev) => prev + pointsEarned);
    if (currentUser) {
      const updatedUser = { ...currentUser, points: (currentUser.points || 0) + pointsEarned };
      setCurrentUser(updatedUser);
      localStorage.setItem('buttoncat_user', JSON.stringify(updatedUser));
    }

    // 3. Limpiar carrito de compras
    setCartItems([]);

    // 4. Marcar cupon como utilizado si aplica
    if (usedCouponCode) {
      setRedeemedCoupons((prev) =>
        prev.map((c) => (c.code.toUpperCase() === usedCouponCode.toUpperCase() ? { ...c, isUsed: true } : c))
      );
    }

    // 5. Sincronizar catalogo de productos y stock actualizado desde PostgreSQL
    catalogApi.getProducts().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setProductsList(res.data.map(mapBackendProductToFrontend));
      }
    }).catch(() => {});
  };

  const handleToggleWishlist = (product: Product) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const clientIdNum = Number(currentUser.id);
    const prodIdNum = Number(product.id);
    if (!isNaN(clientIdNum) && clientIdNum > 0 && !isNaN(prodIdNum) && prodIdNum > 0) {
      clientsApi.toggleFavorito(clientIdNum, prodIdNum).catch((err) => {
        console.error('[ToggleFavorito API Error]:', err);
      });
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
          rewards={rewardsList}
          onSaveReward={handleSaveReward}
          onDeleteReward={handleDeleteReward}
          rewardCategories={rewardCategoriesList}
          onSaveRewardCategory={handleSaveRewardCategory}
          onDeleteRewardCategory={handleDeleteRewardCategory}
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
          onSearchSubmit={handleSearchSubmit}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          productsList={visibleProductsList}
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
                  featuredProducts={visibleProductsList}
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
                  products={visibleProductsList}
                  isLoading={isCatalogLoading}
                  categories={categoriesList.map((c) => c.name)}
                  vibes={stylesList.map((v) => v.name)}
                  tags={tagsList}
                  wishlist={activeWishlist}
                  cartItems={cartItems}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onSelectProduct={handleSelectProduct}
                  onOpenQuoteForm={() => handleNavigate('presupuesto')}
                  onToggleFavorite={handleToggleWishlist}
                  initialSearchQuery={appliedSearchQuery}
                  onClearSearch={handleClearSearch}
                />
              }
            />
            <Route
              path="/producto/:id"
              element={
                <ProductDetailWrapper
                  productsList={productsList}
                  isCatalogLoading={isCatalogLoading}
                  tagsList={tagsList}
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
            <Route path="/presupuesto" element={<CustomQuotePage />} />
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
                  productsList={productsList}
                  rewardsList={rewardsList}
                  rewardCategoriesList={rewardCategoriesList}
                  onClaimRewardProduct={handleClaimRewardProduct}
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
                          name: designData.name,
                          description: designData.description,
                        });
                      } else {
                        setEditingCustomDesign(null);
                      }
                      handleNavigate('personalizar');
                    }}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onAddToCartCustomized={handleAddToCartCustomized}
                    onDeleteSavedDesign={handleDeleteSavedDesignCustomized}
                    onRemoveFromWishlist={(id) => {
                      const clientIdNum = Number(currentUser.id);
                      const prodIdNum = Number(id);
                      if (!isNaN(clientIdNum) && clientIdNum > 0 && !isNaN(prodIdNum) && prodIdNum > 0) {
                        clientsApi.toggleFavorito(clientIdNum, prodIdNum).catch((err) => {
                          console.error('[RemoveWishlist API Error]:', err);
                        });
                      }
                      setWishlist((prev) => prev.filter((p) => p.id !== id));
                    }}
                    onSelectProduct={handleSelectProduct}
                    onUpdateAddresses={(addrs) => setUserAddresses(addrs)}
                    onUpdateUser={(updatedUser) => {
                      setCurrentUser(updatedUser);
                      localStorage.setItem('buttoncat_user', JSON.stringify(updatedUser));
                    }}
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

