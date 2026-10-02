import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Package, 
  Award, 
  MapPin, 
  CheckCircle, 
  Heart, 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Tag, 
  Truck, 
  ShoppingBag,
  Edit,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ARGENTINA_PROVINCES, PROVINCE_NAMES } from '../data/argentinaLocations';
import type { RedeemedCoupon, AdminOrder, Product, SavedDesign, UserAddress, User, CartItem, CustomizableCategory, CustomizationSpecs } from '../types/types';
import { handleProductImageError } from '../types/types';
import { CustomProductPreview } from '../components/customizer/CustomProductPreview';
import { calculateCustomProductPrice, CATEGORY_OPTIONS_MAP } from '../components/customizer/ProductCustomizerStudio';
import { getCategoryThumbnail } from '../components/customizer/CustomizerCatalogGrid';

interface ProfilePageProps {
  currentUser?: User | null;
  allProducts?: Product[];
  userPoints?: number;
  redeemedCoupons?: RedeemedCoupon[];
  userOrders?: AdminOrder[];
  wishlist?: Product[];
  cartItems?: CartItem[];
  savedDesigns?: SavedDesign[];
  userAddresses?: UserAddress[];
  onNavigateToRewards?: () => void;
  onNavigateToStudio?: (designData?: { category: string; options?: Record<string, string>; customImage?: string | null }) => void;
  onAddToCart?: (product: Product) => void;
  onAddToCartCustomized?: (product: Product, specs: CustomizationSpecs) => void;
  onRemoveFromWishlist?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  onUpdateAddresses?: (addresses: UserAddress[]) => void;
}

interface ParsedOrderItem {
  id: string;
  qty: number;
  name: string;
  varietyDetails?: string;
  isSpecificVariety?: boolean;
  image: string;
  unitPrice?: number;
  customCategory?: CustomizableCategory;
  customOptions?: Record<string, string>;
  customImage?: string;
  imageTransforms?: { zoom: number; posX: number; posY: number; rotate: number };
}

const parseOrderItems = (
  itemsSummary: string, 
  allProducts: Product[], 
  savedDesigns: SavedDesign[] = []
): ParsedOrderItem[] => {
  if (!itemsSummary) return [];

  // Split on commas NOT inside parentheses so "Talle: XL, Color: Negro" stays intact
  const rawList = itemsSummary.split(/,\s*(?![^()]*\))/).map((s) => s.trim()).filter(Boolean);

  return rawList.map((raw, idx) => {
    const match = raw.match(/^(\d+)x?\s*(.*)/i);
    const qty = match ? parseInt(match[1], 10) : 1;
    let fullTitle = match ? match[2].trim() : raw.trim();

    let varietyDetails = '';
    let isSpecificVariety = false;
    const parentheticalMatch = fullTitle.match(/^(.*?)\s*\((.*?)\)$/);
    if (parentheticalMatch) {
      fullTitle = parentheticalMatch[1].trim();
      varietyDetails = parentheticalMatch[2].trim();
      isSpecificVariety = true;
    }

    const foundProduct = allProducts.find(
      (p) =>
        p.name.toLowerCase() === fullTitle.toLowerCase() ||
        fullTitle.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(fullTitle.toLowerCase())
    );

    const foundDesign = savedDesigns.find(
      (d) =>
        d.name.toLowerCase() === fullTitle.toLowerCase() ||
        fullTitle.toLowerCase().includes(d.name.toLowerCase()) ||
        d.name.toLowerCase().includes(fullTitle.toLowerCase())
    );

    let customCategory: CustomizableCategory | undefined;
    let customOptions: Record<string, string> | undefined;
    let customImage: string | undefined = foundDesign?.customImage;
    let imageTransforms: { zoom: number; posX: number; posY: number; rotate: number } | undefined = foundDesign?.imageTransforms;

    if (foundDesign) {
      customCategory = foundDesign.category as CustomizableCategory;
      customOptions = foundDesign.options;
    } else {
      const titleUpper = (fullTitle + ' ' + (foundProduct?.category || '')).toUpperCase();
      if (titleUpper.includes('LLAVERO') || titleUpper.includes('PELUCHE') || titleUpper.includes('BUTTONCAT')) {
        customCategory = 'LLAVEROS / PELUCHES';
      } else if (titleUpper.includes('REMERA') || titleUpper.includes('SHIRT')) {
        customCategory = 'REMERAS';
      } else if (titleUpper.includes('PIN')) {
        customCategory = 'PINES';
      } else if (titleUpper.includes('ARO') || titleUpper.includes('ARITO')) {
        customCategory = 'ARITOS';
      } else if (titleUpper.includes('COLLAR')) {
        customCategory = 'COLLARES';
      } else if (titleUpper.includes('STICKER') || titleUpper.includes('PEGATINA')) {
        customCategory = 'STICKERS';
      } else if (titleUpper.includes('POSTER')) {
        customCategory = 'POSTERS';
      } else if (titleUpper.includes('PINTURA') || titleUpper.includes('LIENZO')) {
        customCategory = 'PINTURAS';
      } else if (foundProduct && foundProduct.isCustomizable) {
        customCategory = foundProduct.category as CustomizableCategory;
      }

      if (customCategory) {
        customOptions = {};
        const groups = CATEGORY_OPTIONS_MAP[customCategory] || [];
        const specTokens = varietyDetails.split(/[\|\,\-\:]+/).map((t) => t.trim()).filter(Boolean);

        groups.forEach((group) => {
          for (const choice of group.choices) {
            const choiceClean = choice.name.toLowerCase();
            const foundInDetails =
              varietyDetails.toLowerCase().includes(choiceClean) ||
              specTokens.some((tok) => tok.toLowerCase() === choiceClean || choiceClean.includes(tok.toLowerCase()));

            if (foundInDetails) {
              customOptions![group.key] = choice.name;
              break;
            }
          }
          if (!customOptions![group.key] && group.choices.length > 0) {
            customOptions![group.key] = group.choices[0].name;
          }
        });
      }
    }

    const image = foundDesign?.customImage || foundProduct?.image || 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop';
    const unitPrice = foundProduct?.price;

    return {
      id: `parsed-item-${idx}`,
      qty,
      name: fullTitle,
      varietyDetails: varietyDetails || (foundProduct ? `Categoría: ${foundProduct.category}` : ''),
      isSpecificVariety,
      image,
      unitPrice,
      customCategory,
      customOptions,
      customImage,
      imageTransforms,
    };
  });
};

const getCleanOrderSummaryText = (itemsSummary: string, itemsCount?: number): string => {
  if (!itemsSummary) {
    const qty = itemsCount || 1;
    return `${qty} producto${qty > 1 ? 's' : ''}`;
  }

  // Remove long parenthetical specs like (TAMAÑO DE PAPEL: A4...) for history row preview
  const cleanNames = itemsSummary
    .replace(/\s*\([^)]*\)/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  const totalQty = itemsCount || 1;
  return `${totalQty} producto${totalQty > 1 ? 's' : ''} • ${cleanNames}`;
};

interface OrderItemsCartViewProps {
  itemsSummary: string;
  allProducts: Product[];
  savedDesigns?: SavedDesign[];
  maxInitial?: number;
  isSelected?: boolean;
  onSelectOrder?: () => void;
}

const OrderItemsCartView: React.FC<OrderItemsCartViewProps> = ({
  itemsSummary,
  allProducts,
  savedDesigns = [],
  maxInitial = 2,
  isSelected = true,
  onSelectOrder,
}) => {
  const [expanded, setExpanded] = useState(false);
  const parsedItems = parseOrderItems(itemsSummary, allProducts, savedDesigns);

  useEffect(() => {
    if (!isSelected) {
      setExpanded(false);
    }
  }, [isSelected]);

  if (parsedItems.length === 0) return null;

  const isCurrentlyExpanded = expanded && isSelected;
  const displayItems = isCurrentlyExpanded ? parsedItems : parsedItems.slice(0, maxInitial);
  const hiddenCount = parsedItems.length - maxInitial;

  return (
    <div className="space-y-2 mt-2">
      <div
        className={
          isCurrentlyExpanded && parsedItems.length > maxInitial
            ? 'max-h-60 sm:max-h-64 overflow-y-auto pr-1.5 p-2 bg-yellow-50/60 border-2 border-black shadow-brutal-xs'
            : ''
        }
        style={
          isCurrentlyExpanded && parsedItems.length > maxInitial
            ? { scrollbarWidth: 'thin', scrollbarColor: '#000000 #fef08a' }
            : undefined
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="border-2 border-black bg-white p-2.5 flex items-center gap-3 shadow-brutal-sm relative group hover:-translate-y-0.5 transition-transform"
            >
              {/* THUMBNAIL */}
              <div className="relative shrink-0">
                {item.customCategory ? (
                  <div className="w-14 h-14 border-2 border-black bg-yellow-100 overflow-hidden relative shadow-brutal-xs">
                    <CustomProductPreview
                      category={item.customCategory}
                      options={item.customOptions || {}}
                      customImage={item.customImage}
                      imageTransforms={item.imageTransforms}
                      compact
                      hideHeader
                    />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={handleProductImageError}
                    className="w-14 h-14 object-cover border-2 border-black bg-yellow-100"
                  />
                )}
                <span className="absolute -top-2 -left-2 bg-black text-brand-yellow text-[10px] font-black px-1.5 py-0.5 border border-black shadow-brutal-xs z-10">
                  {item.qty}x
                </span>
              </div>

              {/* PRODUCT INFO & VARIETY */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="text-xs font-black uppercase text-black line-clamp-1 leading-snug">
                  {item.name}
                </h4>

                {item.varietyDetails && (
                  <div
                    className={`inline-block border border-black px-1.5 py-0.5 text-[9px] uppercase line-clamp-1 ${
                      item.isSpecificVariety
                        ? 'bg-brand-yellow text-black font-black shadow-brutal-xs'
                        : 'bg-yellow-50 text-gray-800 font-extrabold'
                    }`}
                  >
                    {item.varietyDetails}
                  </div>
                )}

                {item.unitPrice && (
                  <p className="text-[11px] font-black text-gray-700">
                    ${item.unitPrice.toLocaleString('es-AR')} c/u
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {parsedItems.length > maxInitial && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectOrder) {
              onSelectOrder();
            }
            setExpanded(!expanded);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-yellow text-black border-2 border-black text-[11px] font-black uppercase shadow-brutal-sm hover:bg-black hover:text-white transition-all cursor-pointer mt-1"
        >
          {expanded && isSelected ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>OCULTAR DETALLE DE PRODUCTOS</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ {hiddenCount} PRODUCTO{hiddenCount > 1 ? 'S' : ''} MÁS (TOTAL: {parsedItems.length})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  allProducts = [],
  userPoints = 450,
  redeemedCoupons = [],
  userOrders = [],
  wishlist = [],
  cartItems = [],
  savedDesigns = [],
  userAddresses = [],
  onNavigateToRewards,
  onNavigateToStudio,
  onAddToCart,
  onAddToCartCustomized,
  onRemoveFromWishlist,
  onSelectProduct,
  onUpdateAddresses,
}) => {
  const location = useLocation();
  const trackingRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'PEDIDOS' | 'PUNTOS' | 'FAVORITOS' | 'DISENOS' | 'DIRECCIONES'>(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = (searchParams.get('tab') || '').toUpperCase();
    if (tabParam === 'DISENOS' || tabParam === 'DISEÑOS') return 'DISENOS';
    if (tabParam === 'FAVORITOS') return 'FAVORITOS';
    if (tabParam === 'PUNTOS') return 'PUNTOS';
    if (tabParam === 'DIRECCIONES') return 'DIRECCIONES';
    return 'PEDIDOS';
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = (searchParams.get('tab') || '').toUpperCase();
    if (tabParam === 'DISENOS' || tabParam === 'DISEÑOS') {
      setActiveTab('DISENOS');
    } else if (tabParam === 'FAVORITOS') {
      setActiveTab('FAVORITOS');
    } else if (tabParam === 'PUNTOS') {
      setActiveTab('PUNTOS');
    } else if (tabParam === 'DIRECCIONES') {
      setActiveTab('DIRECCIONES');
    }
  }, [location.search]);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Address Modal / Editing State
  const [addresses, setAddresses] = useState<UserAddress[]>(
    userAddresses.length > 0
      ? userAddresses
      : []
  );

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNum, setAddrNum] = useState('');
  const [addrFloorDept, setAddrFloorDept] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrZipCode, setAddrZipCode] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Sync addresses back to parent whenever local state changes
  useEffect(() => {
    if (onUpdateAddresses) {
      onUpdateAddresses(addresses);
    }
  }, [addresses]);

  // Sync from parent when userAddresses prop changes
  useEffect(() => {
    if (userAddresses.length > 0) {
      setAddresses(userAddresses);
    }
  }, [userAddresses]);

  // Validation modal state (replaces browser alert)
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Default mock orders if none passed
  const displayOrders: AdminOrder[] = userOrders.length > 0 ? userOrders : [
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
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA, Ciudad Autónoma de Buenos Aires',
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
      shippingAddress: 'Av. Corrientes 1234, Piso 4B, CABA, Ciudad Autónoma de Buenos Aires',
      paymentMethod: 'Transferencia Bancaria',
    },
  ];

  // Saved Custom Designs state and handlers
  const INITIAL_DESIGNS: SavedDesign[] = [
    {
      id: 'des-1',
      name: 'Mi Pin Custom Goth Cat',
      category: 'PINES',
      summaryText: 'Tamaño: 38 mm (Standard), Acabado: Brillante Clásico',
      customImage: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop',
      options: { tamano: '38 mm (Standard)', acabado: 'Brillante Clásico' },
      createdAt: '20/09/2026',
    },
    {
      id: 'des-2',
      name: 'Remera Neon Oversized Art',
      category: 'REMERAS',
      summaryText: 'Color: Negro Azabache, Talle: XL (Extra Large), Ubicación: Frente (Pecho)',
      customImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop',
      options: { color: 'Negro Azabache', talle: 'XL (Extra Large)', ubicacion: 'Frente (Pecho)' },
      createdAt: '15/09/2026',
    },
  ];

  const [mySavedDesigns, setMySavedDesigns] = useState<SavedDesign[]>(
    savedDesigns.length > 0 ? savedDesigns : INITIAL_DESIGNS
  );

  useEffect(() => {
    if (savedDesigns.length > 0) {
      setMySavedDesigns(savedDesigns);
    }
  }, [savedDesigns]);

  const [addedDesignId, setAddedDesignId] = useState<string | null>(null);
  const [selectedDesignModal, setSelectedDesignModal] = useState<SavedDesign | null>(null);
  const [deleteConfirmDesignId, setDeleteConfirmDesignId] = useState<string | null>(null);

  const handleAddToCartDesign = (design: SavedDesign) => {
    const validCategory = (design.category as CustomizableCategory) || 'LLAVEROS / PELUCHES';
    const calculatedPrice = calculateCustomProductPrice(validCategory, design.options || {});

    const specs: CustomizationSpecs = {
      category: validCategory,
      options: design.options || {},
      calculatedPrice,
      summaryText: design.summaryText || Object.values(design.options || {}).join(', '),
      customImage: design.customImage,
      imageTransforms: design.imageTransforms,
    };

    const designProduct: Product = {
      id: `custom-${design.id}`,
      name: design.name,
      price: calculatedPrice,
      category: validCategory as any,
      vibe: ['CUSTOM'],
      image: getCategoryThumbnail(validCategory, design.customImage),
      badge: design.customImage ? 'DISEÑO PROPIO' : 'CUSTOM MAKER',
      badgeBg: 'bg-brand-pink',
      description: `Diseño personalizado. ${specs.summaryText}`,
      isCustomizable: true,
      stock: 99,
    };

    if (onAddToCartCustomized) {
      onAddToCartCustomized(designProduct, specs);
    } else if (onAddToCart) {
      onAddToCart(designProduct);
    }
    setAddedDesignId(design.id);
    setTimeout(() => setAddedDesignId(null), 2000);
  };

  const handleDeleteDesign = (id: string) => {
    setMySavedDesigns((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirmDesignId(null);
    if (selectedDesignModal?.id === id) {
      setSelectedDesignModal(null);
    }
  };

  const currentActiveOrder = displayOrders.find((o) => o.id === selectedOrderId) || displayOrders[0];
  const orderStatus = currentActiveOrder?.status || 'PENDIENTE';

  const steps = [
    { title: 'Pedido Realizado', status: 'completed' },
    { 
      title: 'Pago Pendiente', 
      status: orderStatus === 'PENDIENTE' ? 'active' : 'completed' 
    },
    { 
      title: 'En Confección', 
      status: orderStatus === 'EN_CONFECCION' 
        ? 'active' 
        : (orderStatus === 'ENVIADO' || orderStatus === 'ENTREGADO') 
        ? 'completed' 
        : 'pending' 
    },
    { 
      title: 'Listo para Despacho', 
      status: (orderStatus === 'ENVIADO' || orderStatus === 'ENTREGADO') ? 'completed' : 'pending' 
    },
    { 
      title: 'Enviado (Tracking)', 
      status: orderStatus === 'ENVIADO' 
        ? 'active' 
        : orderStatus === 'ENTREGADO' 
        ? 'completed' 
        : 'pending' 
    },
    { 
      title: 'Entregado', 
      status: orderStatus === 'ENTREGADO' ? 'completed' : 'pending' 
    },
  ];

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(code);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTab('PEDIDOS');
    setTimeout(() => {
      if (trackingRef.current) {
        trackingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOpenAddAddress = () => {
    setValidationMessage(null);
    setEditingAddressId(null);
    setAddrLabel('');
    setAddrStreet('');
    setAddrNum('');
    setAddrFloorDept('');
    setAddrCity('Buenos Aires');
    setAddrZipCode('C1000');
    setAddrProvince('Buenos Aires');
    setAddrIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setValidationMessage(null);
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrStreet(addr.street);
    setAddrNum(addr.number);
    setAddrFloorDept(addr.floorDept || '');
    setAddrCity(addr.city);
    setAddrZipCode(addr.zipCode);
    setAddrProvince(addr.province);
    setAddrIsDefault(!!addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = () => {
    if (!addrLabel.trim() || !addrStreet.trim() || !addrNum.trim() || !addrProvince.trim() || !addrCity.trim() || !addrZipCode.trim()) {
      setValidationMessage('Por favor completa todos los campos obligatorios para guardar la dirección (Etiqueta, Calle, Número, Código Postal, Provincia y Ciudad/Localidad).');
      return;
    }

    if (editingAddressId) {
      setAddresses((prev) =>
        prev.map((a) => {
          if (a.id === editingAddressId) {
            return {
              ...a,
              label: addrLabel.trim().toUpperCase(),
              street: addrStreet.trim(),
              number: addrNum.trim(),
              floorDept: addrFloorDept.trim(),
              city: addrCity.trim(),
              zipCode: addrZipCode.trim(),
              province: addrProvince.trim(),
              isDefault: addrIsDefault,
            };
          }
          return addrIsDefault ? { ...a, isDefault: false } : a;
        })
      );
    } else {
      const newId = `addr-${Date.now()}`;
      const newAddr: UserAddress = {
        id: newId,
        label: addrLabel.trim().toUpperCase(),
        street: addrStreet.trim(),
        number: addrNum.trim(),
        floorDept: addrFloorDept.trim(),
        city: addrCity.trim(),
        zipCode: addrZipCode.trim(),
        province: addrProvince.trim(),
        isDefault: addrIsDefault || addresses.length === 0,
      };

      setAddresses((prev) => {
        if (newAddr.isDefault) {
          return [...prev.map((a) => ({ ...a, isDefault: false })), newAddr];
        }
        return [...prev, newAddr];
      });
    }

    setValidationMessage(null);
    setIsAddressModalOpen(false);
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* USER PROFILE HEADER (RF-02) */}
      <div className="border-4 border-black bg-brand-yellow p-6 shadow-brutal-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"}
            alt={currentUser?.name || "Juan Borlini"}
            className="w-20 h-20 rounded-full border-3 border-black object-cover shadow-brutal-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
                {currentUser?.role === 'ADMIN' ? 'CLIENTE VIP ADMIN' : 'CLIENTE VIP'}
              </span>
              <span className="bg-brand-pink text-white border border-black text-[10px] font-black uppercase px-2 py-0.5">
                ID: {currentUser?.id ? currentUser.id.toUpperCase() : 'USR-9821'}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-black font-display leading-tight mt-1">
              {currentUser?.name || 'JUAN BORLINI'}
            </h1>
            <p className="text-xs font-bold text-gray-800">
              {currentUser?.email || 'juan.borlini@email.com'} • Miembro desde 2024
            </p>
          </div>
        </div>

        {/* POINTS BALANCE SUMMARY (RF-13) */}
        <div className="border-3 border-black bg-white p-4 shadow-brutal text-center min-w-[220px] space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-brand-purple">
            <Award className="w-5 h-5 stroke-[2.5]" />
            <span className="text-xs font-black uppercase">PUNTOS BUTTONCAT</span>
          </div>
          <p className="text-3xl font-black text-black">{userPoints} PTS</p>
          <span className="block text-[10px] font-bold text-gray-500">
            Equivale a ${(userPoints * 10).toLocaleString('es-AR')} ARS en premios
          </span>

          {onNavigateToRewards && (
            <Button
              variant="purple"
              size="sm"
              fullWidth
              onClick={onNavigateToRewards}
              className="mt-2 text-xs font-black uppercase"
            >
              CANJEAR PREMIOS
            </Button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS (NO EMOJIS, LUCIDE ICONS ONLY) */}
      <div className="relative border-b-4 border-black flex items-end gap-2 overflow-x-auto pt-3 pb-0 no-scrollbar">
        <button
          onClick={() => setActiveTab('PEDIDOS')}
          className={`px-4 py-2.5 font-black text-xs uppercase flex items-center gap-2 border-3 border-black transition-all whitespace-nowrap -mb-[4px] relative ${
            activeTab === 'PEDIDOS'
              ? 'bg-brand-yellow text-black z-20 shadow-brutal-sm border-b-brand-yellow'
              : 'bg-white text-gray-700 hover:bg-gray-100 z-0 opacity-90'
          }`}
        >
          <Package className="w-4 h-4" /> SEGUIMIENTO Y PEDIDOS ({displayOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('PUNTOS')}
          className={`px-4 py-2.5 font-black text-xs uppercase flex items-center gap-2 border-3 border-black transition-all whitespace-nowrap -mb-[4px] relative ${
            activeTab === 'PUNTOS'
              ? 'bg-brand-purple text-white z-20 shadow-brutal-sm border-b-brand-purple'
              : 'bg-white text-gray-700 hover:bg-gray-100 z-0 opacity-90'
          }`}
        >
          <Award className="w-4 h-4" /> MIS PUNTOS Y CUPONES ({redeemedCoupons.length})
        </button>

        <button
          onClick={() => setActiveTab('FAVORITOS')}
          className={`px-4 py-2.5 font-black text-xs uppercase flex items-center gap-2 border-3 border-black transition-all whitespace-nowrap -mb-[4px] relative ${
            activeTab === 'FAVORITOS'
              ? 'bg-brand-pink text-white z-20 shadow-brutal-sm border-b-brand-pink'
              : 'bg-white text-gray-700 hover:bg-gray-100 z-0 opacity-90'
          }`}
        >
          <Heart className="w-4 h-4" /> MIS FAVORITOS ({wishlist.length})
        </button>

        <button
          onClick={() => setActiveTab('DISENOS')}
          className={`px-4 py-2.5 font-black text-xs uppercase flex items-center gap-2 border-3 border-black transition-all whitespace-nowrap -mb-[4px] relative ${
            activeTab === 'DISENOS'
              ? 'bg-brand-cyan text-black z-20 shadow-brutal-sm border-b-brand-cyan'
              : 'bg-white text-gray-700 hover:bg-gray-100 z-0 opacity-90'
          }`}
        >
          <Sparkles className="w-4 h-4" /> MIS DISEÑOS CUSTOM ({mySavedDesigns.length})
        </button>

        <button
          onClick={() => setActiveTab('DIRECCIONES')}
          className={`px-4 py-2.5 font-black text-xs uppercase flex items-center gap-2 border-3 border-black transition-all whitespace-nowrap -mb-[4px] relative ${
            activeTab === 'DIRECCIONES'
              ? 'bg-brand-orange text-white z-20 shadow-brutal-sm border-b-brand-orange'
              : 'bg-white text-gray-700 hover:bg-gray-100 z-0 opacity-90'
          }`}
        >
          <MapPin className="w-4 h-4" /> MIS DIRECCIONES ({addresses.length})
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: HISTORIAL DE PEDIDOS Y TIMELINE DE SEGUIMIENTO (RF-17 / RF-18) */}
      {activeTab === 'PEDIDOS' && (
        <div className="space-y-6">
          
          {/* TRACKING TIMELINE FOR CURRENT SELECTED ORDER */}
          {currentActiveOrder && (
            <div ref={trackingRef} className="border-4 border-black bg-white p-6 shadow-brutal-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-3 border-black pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-black stroke-[2.5]" />
                  <div>
                    <h2 className="text-xl font-black uppercase text-black font-display leading-tight">
                      SEGUIMIENTO EN VIVO DE PEDIDO #{currentActiveOrder.id}
                    </h2>
                    <p className="text-xs font-bold text-gray-500">
                      Fecha de compra: {currentActiveOrder.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* TIMELINE STEPS - CENTERED 6 STEPS GRID */}
              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {steps.map((step, idx) => {
                    const isCompleted = step.status === 'completed';
                    const isActive = step.status === 'active';

                    return (
                      <div key={idx} className="flex flex-col items-center space-y-2">
                        <div
                          className={`w-10 h-10 border-3 border-black flex items-center justify-center text-sm font-black shadow-brutal-sm transition-all ${
                            isCompleted
                              ? 'bg-green-400 text-black'
                              : isActive
                              ? 'bg-brand-yellow text-black animate-pulse'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold uppercase text-black leading-tight">
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ORDER DETAILS SUMMARY & CART-STYLE PRODUCTS */}
              <div className="space-y-4 pt-2">
                <div className="bg-yellow-50/80 border-3 border-black p-4 space-y-4 text-xs font-bold shadow-brutal-sm">
                  {/* TOP ROW: SHIPPING, PAYMENT METHOD & TRACKING WITH GENEROUS SPACING */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border-2 border-black p-4 shadow-brutal-xs">
                    <div className="lg:col-span-5 space-y-1">
                      <p className="font-black uppercase text-black mb-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-black shrink-0" /> DIRECCIÓN DE ENTREGA:
                      </p>
                      <p className="text-gray-700 leading-relaxed break-words pl-5.5">{currentActiveOrder.shippingAddress || 'Av. Corrientes 1234, CABA, Ciudad Autónoma de Buenos Aires'}</p>
                    </div>

                    <div className="lg:col-span-4 border-t-2 lg:border-t-0 lg:border-l-2 border-black/10 pt-3 lg:pt-0 lg:pl-6 space-y-1">
                      <p className="font-black uppercase text-black mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-black shrink-0" /> MÉTODO DE PAGO:
                      </p>
                      <p className="text-gray-700 pl-5.5">{currentActiveOrder.paymentMethod || 'Mercado Pago'}</p>
                    </div>

                    <div className="lg:col-span-3 border-t-2 lg:border-t-0 lg:border-l-2 border-black/10 pt-3 lg:pt-0 lg:pl-6 space-y-1">
                      <p className="font-black uppercase text-black mb-1 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-black shrink-0" /> CÓDIGO DE SEGUIMIENTO:
                      </p>
                      <p className="text-gray-700 font-black pl-5.5">{currentActiveOrder.trackingNumber || 'AR982341293AR'}</p>
                    </div>
                  </div>

                  {/* BOTTOM ROW: TRANSPARENT MATHEMATICAL PRICE BREAKDOWN */}
                  {(() => {
                    const discountVal = currentActiveOrder.discountAmount || 0;
                    const shippingVal = currentActiveOrder.shippingCost ?? (currentActiveOrder.hasShipping === false ? 0 : 2500);
                    const subtotalVal = currentActiveOrder.subtotal ?? (currentActiveOrder.total + discountVal - shippingVal);

                    return (
                      <div className="bg-white border-2 border-black p-4 space-y-3 shadow-brutal-xs">
                        <div className="flex items-center justify-between border-b-2 border-black pb-2 flex-wrap gap-2">
                          <span className="font-black uppercase text-xs text-black flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-black stroke-[2.5]" /> DESGLOSE DETALLADO DEL PAGO
                          </span>
                          {currentActiveOrder.appliedCouponCode && (
                            <span className="bg-emerald-300 text-black border border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shadow-brutal-xs">
                              <Tag className="w-3.5 h-3.5 stroke-[2.5]" /> CUPÓN: {currentActiveOrder.appliedCouponCode}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-gray-700 pt-1">
                          <div className="bg-yellow-50 border border-black p-2.5 space-y-0.5">
                            <span className="block text-[10px] font-black uppercase text-gray-500">1. Subtotal Productos</span>
                            <span className="text-sm font-black text-black">${subtotalVal.toLocaleString('es-AR')}</span>
                          </div>

                          <div className="bg-yellow-50 border border-black p-2.5 space-y-0.5">
                            <span className="block text-[10px] font-black uppercase text-emerald-800">2. Descuento Aplicado</span>
                            <span className="text-sm font-black text-emerald-700">
                              {discountVal > 0 ? `-$${discountVal.toLocaleString('es-AR')}` : '$0'}
                            </span>
                          </div>

                          <div className="bg-yellow-50 border border-black p-2.5 space-y-0.5">
                            <span className="block text-[10px] font-black uppercase text-gray-500">3. Costo de Envío</span>
                            <span className="text-sm font-black text-black">
                              {shippingVal > 0 ? `$${shippingVal.toLocaleString('es-AR')}` : 'GRATIS'}
                            </span>
                          </div>
                        </div>

                        <div className="border-2 border-black pt-3 flex items-center justify-between bg-yellow-100 p-3 mt-2 shadow-brutal-xs">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-black">TOTAL</span>
                            <span className="text-[10px] font-bold text-gray-600">Importe cobrado en la transacción</span>
                          </div>
                          <span className="text-lg sm:text-xl font-black bg-brand-yellow border-2 border-black px-3 py-1 text-black shadow-brutal-sm">
                            ${currentActiveOrder.total.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <p className="font-black uppercase text-black text-xs flex items-center gap-1">
                    <Package className="w-4 h-4 text-black" /> PRODUCTOS EN ESTE PEDIDO ({currentActiveOrder.itemsCount || 1}):
                  </p>
                  <OrderItemsCartView itemsSummary={currentActiveOrder.itemsSummary} allProducts={allProducts} savedDesigns={mySavedDesigns} maxInitial={3} isSelected={true} />
                </div>
              </div>
            </div>
          )}

          {/* ALL ORDERS LIST */}
          <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
            <h3 className="text-base font-black uppercase text-black border-b-2 border-black pb-2 flex items-center justify-between">
              <span>HISTORIAL DE COMPRAS ANTERIORES</span>
              <span className="text-xs font-bold text-gray-500">{displayOrders.length} PEDIDOS REGISTRADOS</span>
            </h3>

            <div className="space-y-3">
              {displayOrders.map((order) => {
                const isSelected = order.id === currentActiveOrder.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={`border-3 border-black p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected ? 'bg-yellow-100 border-black shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm uppercase text-black">#{order.id}</span>
                        <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase ${
                          order.status === 'ENTREGADO' 
                            ? 'bg-emerald-300 text-black' 
                            : order.status === 'ENVIADO' 
                            ? 'bg-cyan-300 text-black' 
                            : order.status === 'EN_CONFECCION' 
                            ? 'bg-purple-300 text-black' 
                            : 'bg-brand-yellow text-black'
                        }`}>
                          {order.status === 'PENDIENTE'
                            ? 'PAGO PENDIENTE'
                            : order.status === 'EN_CONFECCION'
                            ? 'EN CONFECCIÓN'
                            : order.status === 'ENVIADO'
                            ? 'ENVIADO'
                            : 'ENTREGADO'}
                        </span>
                        {order.isCustomOrder && (
                          <span className="bg-brand-pink text-white border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                            CUSTOM ORDER
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-gray-400">Fecha: {order.date}</span>
                      </div>

                      <p className="text-xs font-bold text-gray-700 truncate max-w-xl">
                        <span className="text-black font-black">Resumen:</span> {getCleanOrderSummaryText(order.itemsSummary, order.itemsCount)}
                      </p>

                      {order.discountAmount && (
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 pt-0.5">
                          <Tag className="w-3 h-3 stroke-[2.5]" />
                          <span>Descuento aplicado: -${order.discountAmount.toLocaleString('es-AR')} {order.appliedCouponCode ? `(${order.appliedCouponCode})` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-[10px] font-black uppercase text-gray-500">TOTAL</span>
                        <span className="text-base font-black text-black">${order.total.toLocaleString('es-AR')}</span>
                      </div>
                      <Button
                        variant={isSelected ? 'purple' : 'white'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrder(order.id);
                        }}
                        className="text-xs font-black uppercase"
                      >
                        {isSelected ? 'VIENDO SEGUIMIENTO' : 'VER SEGUIMIENTO'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PUNTOS Y CUPONES CANJEADOS (RF-13 / RF-14) */}
      {activeTab === 'PUNTOS' && (
        <div className="space-y-6">
          <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
              <div>
                <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-purple" /> MIS CUPONES DE DESCUENTO CANJEADOS
                </h3>
                <p className="text-xs font-bold text-gray-600">
                  Copia el código para utilizarlo durante el checkout de tu próxima compra.
                </p>
              </div>
              {onNavigateToRewards && (
                <Button variant="yellow" size="sm" onClick={onNavigateToRewards} className="text-xs font-black uppercase">
                  + CANJEAR MÁS PREMIOS
                </Button>
              )}
            </div>

            {redeemedCoupons.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 space-y-3">
                <Tag className="w-12 h-12 text-gray-400 mx-auto stroke-[1.5]" />
                <h4 className="text-sm font-black uppercase text-gray-700">NO TIENES CUPONES ACTIVOS</h4>
                <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                  Acumula puntos con cada compra y canjéalos por cupones de descuento exclusivos.
                </p>
                {onNavigateToRewards && (
                  <Button variant="purple" size="sm" onClick={onNavigateToRewards}>
                    IR A LA TIENDA DE PREMIOS
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {redeemedCoupons.map((coupon) => (
                  <div key={coupon.id} className="border-3 border-black bg-yellow-50 p-4 shadow-brutal space-y-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-brand-purple text-white text-[9px] font-black uppercase px-2 py-0.5">
                            {coupon.discountValue}
                          </span>
                          <span className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            coupon.isUsed ? 'bg-gray-300 text-gray-700' : 'bg-green-400 text-black'
                          }`}>
                            {coupon.isUsed ? 'USADO' : 'DISPONIBLE'}
                          </span>
                        </div>
                        <h4 className={`text-base font-black uppercase text-black mt-1 ${coupon.isUsed ? 'line-through opacity-60' : ''}`}>{coupon.rewardTitle}</h4>
                        <p className="text-[11px] font-bold text-gray-500">Canjeado el {coupon.redeemedAt}</p>
                      </div>
                      <span className="text-xs font-black text-brand-purple">-{coupon.pointsSpent} PTS</span>
                    </div>

                    <div className="flex items-center justify-between border-2 border-black bg-white p-2">
                      <span className="font-mono text-sm font-black uppercase tracking-wider text-black">{coupon.code}</span>
                      <button
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className="px-2 py-1 bg-brand-yellow border border-black text-xs font-black uppercase hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                      >
                        {copiedCouponId === coupon.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-700" /> COPIADO
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> COPIAR CÓDIGO
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MIS FAVORITOS / WISHLIST */}
      {activeTab === 'FAVORITOS' && (
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
          <h3 className="text-base font-black uppercase text-black border-b-2 border-black pb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-pink fill-brand-pink" /> MIS PRODUCTOS FAVORITOS ({wishlist.length})
          </h3>

          {wishlist.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 space-y-3">
              <Heart className="w-12 h-12 text-gray-300 mx-auto stroke-[1.5]" />
              <h4 className="text-sm font-black uppercase text-gray-700">TU LISTA DE FAVORITOS ESTÁ VACÍA</h4>
              <p className="text-xs font-bold text-gray-500 max-w-sm mx-auto">
                Explora el catálogo y guarda tus productos favoritos haciendo clic en el corazón.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishlist.map((item) => {
                const freshProduct = (allProducts || []).find((p) => p.id === item.id) || item;
                const isOutOfStock = freshProduct.stock === 0;
                const totalQtyInCart = cartItems
                  ? cartItems.filter((cartItem) => cartItem.product.id === freshProduct.id).reduce((acc, cartItem) => acc + cartItem.quantity, 0)
                  : 0;
                const isMaxStockInCart = !isOutOfStock && freshProduct.stock > 0 && totalQtyInCart >= freshProduct.stock;
                const isAddDisabled = isOutOfStock || isMaxStockInCart;

                return (
                  <div key={item.id} className="border-3 border-black bg-white p-3 shadow-brutal space-y-2 flex flex-col justify-between">
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => onSelectProduct && onSelectProduct(freshProduct)}
                    >
                      <img src={freshProduct.image} alt={freshProduct.name} className={`w-full h-40 object-cover border-2 border-black bg-yellow-100 transition-transform group-hover:scale-[1.02] ${isOutOfStock ? 'grayscale opacity-60' : ''}`} />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 pointer-events-none">
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 border border-black shadow-brutal-sm -rotate-3">
                            SIN STOCK DISPONIBLE
                          </span>
                        </div>
                      )}
                      {onRemoveFromWishlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromWishlist(item.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors z-20"
                          title="Eliminar de favoritos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-500">{freshProduct.category}</span>
                      <h4 
                        onClick={() => onSelectProduct && onSelectProduct(freshProduct)}
                        className="text-sm font-black uppercase text-black line-clamp-1 cursor-pointer hover:underline hover:text-brand-purple transition-colors"
                      >
                        {freshProduct.name}
                      </h4>
                      <p className="text-base font-black text-black">${freshProduct.price.toLocaleString('es-AR')}</p>
                    </div>
                    {onAddToCart && (
                      <Button
                        variant={isAddDisabled ? "white" : "yellow"}
                        size="sm"
                        fullWidth
                        disabled={isAddDisabled}
                        onClick={() => !isAddDisabled && onAddToCart(freshProduct)}
                        className={`text-xs font-black uppercase ${
                          isAddDisabled ? 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none' : ''
                        }`}
                      >
                        {isOutOfStock ? (
                          'SIN STOCK'
                        ) : isMaxStockInCart ? (
                          'MÁX. EN CARRITO'
                        ) : (
                          <>AGREGAR AL CARRITO <ShoppingBag className="w-3.5 h-3.5 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MIS DISEÑOS CUSTOMIZADOS */}
      {activeTab === 'DISENOS' && (
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
            <div>
              <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-cyan" /> MIS DISEÑOS PERSONALIZADOS EN EL STUDIO
              </h3>
              <p className="text-xs font-bold text-gray-600">
                Guarda tus creaciones del Studio, vuelve a editarlas o agrégalas al carrito directamente.
              </p>
            </div>
            {onNavigateToStudio && (
              <Button
                variant="yellow"
                size="sm"
                onClick={() => onNavigateToStudio()}
                className="text-xs font-black uppercase shadow-brutal-sm self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" /> CREAR EN STUDIO
              </Button>
            )}
          </div>

          {mySavedDesigns.length === 0 ? (
            <div className="bg-yellow-50 border-3 border-black p-8 text-center space-y-4 my-4">
              <div className="w-14 h-14 bg-brand-yellow border-2 border-black flex items-center justify-center mx-auto shadow-brutal-sm">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black uppercase text-black">Aún no tienes diseños personalizados</h4>
                <p className="text-xs font-bold text-gray-600 max-w-md mx-auto">
                  Entra a nuestro Studio Interactivo para crear pines, parches o prendas a tu medida con tus propias imágenes y acabados.
                </p>
              </div>
              {onNavigateToStudio && (
                <Button variant="yellow" onClick={() => onNavigateToStudio()} className="text-xs font-black uppercase shadow-brutal mt-2">
                  <Sparkles className="w-4 h-4 mr-1.5" /> IR AL STUDIO CUSTOM
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySavedDesigns.map((design) => {
                const isAdded = addedDesignId === design.id;
                const designPrice = calculateCustomProductPrice(design.category as CustomizableCategory, design.options || {});
                return (
                  <div key={design.id} className="border-3 border-black bg-white p-4 shadow-brutal flex flex-col justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div 
                        onClick={() => setSelectedDesignModal(design)}
                        className="relative cursor-pointer group shrink-0"
                      >
                        <div className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-black bg-yellow-100 overflow-hidden relative shadow-brutal-xs pointer-events-none">
                          <CustomProductPreview
                            category={design.category as CustomizableCategory}
                            options={design.options || {}}
                            customImage={design.customImage}
                            imageTransforms={design.imageTransforms}
                            compact
                            hideHeader
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-black text-white text-[9px] font-black uppercase px-1.5 py-0.5">
                            {design.category}
                          </span>
                          <span className="bg-emerald-300 text-black border border-black text-[10px] font-black px-1.5 py-0.5">
                            ${designPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <h4 
                          onClick={() => setSelectedDesignModal(design)}
                          className="text-sm font-black uppercase text-black truncate cursor-pointer hover:underline"
                        >
                          {design.name}
                        </h4>
                        <p className="text-xs font-bold text-gray-600 line-clamp-2">{design.summaryText}</p>
                        <p className="text-[10px] font-extrabold text-gray-400">Creado el {design.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t-2 border-black">
                      <Button
                        variant="yellow"
                        size="sm"
                        onClick={() => handleAddToCartDesign(design)}
                        className={`flex-1 text-[11px] font-black uppercase ${
                          isAdded ? 'bg-emerald-400 text-black border-black' : ''
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> AGREGADO
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" /> AL CARRITO
                          </>
                        )}
                      </Button>

                      {onNavigateToStudio && (
                        <Button
                          variant="white"
                          size="sm"
                          onClick={() => onNavigateToStudio({ category: design.category, options: design.options, customImage: design.customImage })}
                          className="text-[11px] font-black uppercase bg-white hover:bg-gray-100"
                          title="Editar este diseño en el Studio"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> EDITAR
                        </Button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmDesignId(design.id)}
                        className="p-1.5 border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                        title="Eliminar diseño"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DIRECCIONES Y DATOS PERSONALES (RF-02) */}
      {activeTab === 'DIRECCIONES' && (
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-2 gap-3">
            <div>
              <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" /> DIRECCIONES DE ENVÍO Y RETIRO
              </h3>
              <p className="text-xs font-bold text-gray-600">
                Gestiona tus direcciones de entrega, edítalas o establece cuál es la predeterminada.
              </p>
            </div>
            <Button
              variant="yellow"
              size="sm"
              onClick={handleOpenAddAddress}
              className="text-xs font-black uppercase shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" /> NUEVA DIRECCIÓN
            </Button>
          </div>

          {/* LIST OF ADDRESSES WITH FULL EDIT & DEFAULT CAPABILITIES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`border-3 border-black p-5 bg-white shadow-brutal flex flex-col justify-between space-y-4 relative ${
                  addr.isDefault ? 'ring-2 ring-black bg-yellow-50/60' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand-purple stroke-[2.5]" />
                      <h4 className="font-extrabold text-base uppercase text-black">{addr.label}</h4>
                    </div>
                    {addr.isDefault ? (
                      <span className="bg-green-400 border-2 border-black text-black text-[10px] font-black uppercase px-2 py-0.5 shadow-brutal-sm flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> PREDETERMINADA
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[10px] font-black uppercase bg-yellow-200 hover:bg-brand-yellow border border-black px-2 py-0.5 transition-colors cursor-pointer"
                        title="Establecer como dirección predeterminada"
                      >
                        CAMBIAR A PREDETERMINADA
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-bold text-gray-800 space-y-0.5 pt-1">
                    <p className="text-sm font-extrabold text-black">{addr.street} {addr.number} {addr.floorDept ? `(${addr.floorDept})` : ''}</p>
                    <p className="text-gray-600">{addr.city}, {addr.province} (CP: {addr.zipCode})</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/20">
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleOpenEditAddress(addr)}
                    className="text-xs font-black uppercase flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> EDITAR
                  </Button>
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-xs font-black uppercase text-red-600 hover:bg-red-50 flex items-center gap-1"
                    title="Eliminar dirección"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" /> ELIMINAR
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ADDRESS MODAL FOR CREATE & EDIT (RENDERED VIA PORTAL TO BODY) */}
      {isAddressModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 min-h-screen"
          onClick={() => {
            setValidationMessage(null);
            setIsAddressModalOpen(false);
          }}
        >
          <div 
            className="bg-white border-4 border-black shadow-brutal-xl max-w-lg w-full p-6 space-y-4 my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <h3 className="text-lg font-black uppercase text-black font-display flex items-center gap-2">
                <MapPin className="w-6 h-6 text-brand-orange" />
                {editingAddressId ? 'EDITAR DIRECCIÓN' : 'NUEVA DIRECCIÓN DE ENVÍO'}
              </h3>
              <button
                onClick={() => {
                  setValidationMessage(null);
                  setIsAddressModalOpen(false);
                }}
                className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* INLINE WARNING BANNER FOR MISSING MANDATORY FIELDS */}
            {validationMessage && (
              <div className="bg-red-100 border-3 border-black text-red-800 p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{validationMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs font-bold text-black">
              <div>
                <label className="block text-[11px] font-black uppercase mb-1">Nombre / Etiqueta de la Dirección *</label>
                <input
                  type="text"
                  placeholder="Ej: CASA, TRABAJO, DEPARTAMENTO"
                  value={addrLabel}
                  onChange={(e) => {
                    setAddrLabel(e.target.value);
                    if (validationMessage) setValidationMessage(null);
                  }}
                  className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                    validationMessage && !addrLabel.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-black uppercase mb-1">Calle / Avenida *</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Corrientes"
                    value={addrStreet}
                    onChange={(e) => {
                      setAddrStreet(e.target.value);
                      if (validationMessage) setValidationMessage(null);
                    }}
                    className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                      validationMessage && !addrStreet.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase mb-1">Número / Altura *</label>
                  <input
                    type="text"
                    placeholder="Ej: 1234"
                    value={addrNum}
                    onChange={(e) => {
                      setAddrNum(e.target.value);
                      if (validationMessage) setValidationMessage(null);
                    }}
                    className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                      validationMessage && !addrNum.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase mb-1">Piso / Depto / Aclaraciones</label>
                  <input
                    type="text"
                    placeholder="Ej: Piso 4B, Timbre 12"
                    value={addrFloorDept}
                    onChange={(e) => setAddrFloorDept(e.target.value)}
                    className="w-full border-2 border-black p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase mb-1">Código Postal *</label>
                  <input
                    type="text"
                    placeholder="Ej: C1043"
                    value={addrZipCode}
                    onChange={(e) => {
                      setAddrZipCode(e.target.value);
                      if (validationMessage) setValidationMessage(null);
                    }}
                    className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                      validationMessage && !addrZipCode.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase mb-1">Provincia *</label>
                  <select
                    value={addrProvince}
                    onChange={(e) => {
                      setAddrProvince(e.target.value);
                      setAddrCity('');
                      if (validationMessage) setValidationMessage(null);
                    }}
                    className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer ${
                      validationMessage && !addrProvince.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    {PROVINCE_NAMES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase mb-1">Ciudad / Localidad *</label>
                  <select
                    value={addrCity}
                    onChange={(e) => {
                      setAddrCity(e.target.value);
                      if (validationMessage) setValidationMessage(null);
                    }}
                    className={`w-full border-2 p-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer ${
                      validationMessage && !addrCity.trim() ? 'border-red-600 bg-red-50' : 'border-black'
                    }`}
                    disabled={!addrProvince}
                  >
                    <option value="">{addrProvince ? 'Seleccionar...' : 'Elegir provincia primero'}</option>
                    {addrProvince && (ARGENTINA_PROVINCES[addrProvince] || []).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-black border-2 border-black cursor-pointer"
                />
                <label htmlFor="chkDefault" className="text-xs font-black uppercase cursor-pointer">
                  Establecer como dirección predeterminada
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t-2 border-black">
              <Button variant="white" size="md" onClick={() => {
                setValidationMessage(null);
                setIsAddressModalOpen(false);
              }}>
                CANCELAR
              </Button>
              <Button variant="purple" size="md" onClick={handleSaveAddress}>
                {editingAddressId ? 'GUARDAR CAMBIOS' : 'CREAR DIRECCIÓN'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM DESIGN PREVIEW MODAL */}
      {selectedDesignModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-brutal-xl max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
              <div>
                <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5">
                  {selectedDesignModal.category}
                </span>
                <h3 className="text-base sm:text-lg font-black uppercase text-black font-display mt-1">
                  {selectedDesignModal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDesignModal(null)}
                className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* COMPACT & SLEEK IMAGE PREVIEW */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto bg-yellow-100 border-3 border-black overflow-hidden relative shadow-brutal-sm shrink-0">
              <CustomProductPreview
                category={selectedDesignModal.category as CustomizableCategory}
                options={selectedDesignModal.options || {}}
                customImage={selectedDesignModal.customImage}
                imageTransforms={selectedDesignModal.imageTransforms}
                compact
                hideHeader
              />
            </div>

            <div className="bg-gray-50 border-2 border-black p-3 space-y-2 text-xs font-bold shadow-brutal-xs">
              <div className="flex items-center justify-between border-b border-gray-300 pb-1">
                <span className="text-gray-500 font-extrabold uppercase">Especificaciones:</span>
                <span className="text-emerald-800 font-black text-sm">
                  ${calculateCustomProductPrice(selectedDesignModal.category as CustomizableCategory, selectedDesignModal.options || {}).toLocaleString('es-AR')}
                </span>
              </div>
              <p className="text-black font-black leading-snug">{selectedDesignModal.summaryText}</p>
              {selectedDesignModal.options && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(selectedDesignModal.options).map(([key, val]) => (
                    <span key={key} className="bg-white border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-brutal-xs">
                      {key}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t-2 border-black">
              <Button
                variant="yellow"
                size="md"
                onClick={() => {
                  handleAddToCartDesign(selectedDesignModal);
                  setSelectedDesignModal(null);
                }}
                className="flex-1 text-xs font-black uppercase shadow-brutal-sm"
              >
                <ShoppingBag className="w-4 h-4 mr-1.5" /> AGREGAR AL CARRITO
              </Button>
              {onNavigateToStudio && (
                <Button
                  variant="white"
                  size="md"
                  onClick={() => {
                    const d = selectedDesignModal;
                    setSelectedDesignModal(null);
                    onNavigateToStudio({ category: d.category, options: d.options, customImage: d.customImage });
                  }}
                  className="text-xs font-black uppercase bg-white hover:bg-gray-100 shadow-brutal-sm"
                >
                  <Edit className="w-4 h-4 mr-1.5" /> EDITAR EN STUDIO
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE DESIGN CONFIRMATION MODAL */}
      {deleteConfirmDesignId && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-brutal-xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 border-2 border-black flex items-center justify-center mx-auto text-rose-600 shadow-brutal-sm">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black uppercase text-black">¿Eliminar este diseño?</h4>
              <p className="text-xs font-bold text-gray-600">
                Esta acción removerá el diseño de tu colección guardada en el perfil.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="white"
                size="sm"
                onClick={() => setDeleteConfirmDesignId(null)}
                className="flex-1 text-xs font-black uppercase"
              >
                CANCELAR
              </Button>
              <Button
                variant="purple"
                size="sm"
                onClick={() => handleDeleteDesign(deleteConfirmDesignId)}
                className="flex-1 text-xs font-black uppercase bg-rose-600 hover:bg-rose-700 text-white border-black"
              >
                SÍ, ELIMINAR
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
