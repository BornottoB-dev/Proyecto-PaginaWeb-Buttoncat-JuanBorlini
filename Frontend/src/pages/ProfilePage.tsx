import React, { useState } from 'react';
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
  ShoppingBag 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { RedeemedCoupon, AdminOrder, Product, SavedDesign, UserAddress, User } from '../types/types';

interface ProfilePageProps {
  currentUser?: User | null;
  userPoints?: number;
  redeemedCoupons?: RedeemedCoupon[];
  userOrders?: AdminOrder[];
  wishlist?: Product[];
  savedDesigns?: SavedDesign[];
  userAddresses?: UserAddress[];
  onNavigateToRewards?: () => void;
  onAddToCart?: (product: Product) => void;
  onRemoveFromWishlist?: (productId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  userPoints = 450,
  redeemedCoupons = [],
  userOrders = [],
  wishlist = [],
  savedDesigns = [],
  userAddresses = [],
  onNavigateToRewards,
  onAddToCart,
  onRemoveFromWishlist,
}) => {
  const [activeTab, setActiveTab] = useState<'PEDIDOS' | 'PUNTOS' | 'FAVORITOS' | 'DISENOS' | 'DIRECCIONES'>('PEDIDOS');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Address Modal / State
  const [addresses, setAddresses] = useState<UserAddress[]>(
    userAddresses.length > 0
      ? userAddresses
      : [
          {
            id: 'addr-1',
            label: 'CASA (Predeterminada)',
            street: 'Av. Corrientes',
            number: '1234',
            floorDept: 'Piso 4B',
            city: 'Ciudad Autónoma de Buenos Aires',
            zipCode: 'C1043',
            province: 'Buenos Aires',
            isDefault: true,
          },
        ]
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrNum, setNewAddrNum] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');

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
  ];

  // Default mock saved designs if none
  const displayDesigns: SavedDesign[] = savedDesigns.length > 0 ? savedDesigns : [
    {
      id: 'des-1',
      name: 'Mi Pin Custom Goth Cat',
      category: 'PINES',
      summaryText: 'Acabado: Metálico Oscuro | Tamaño: 45mm | Cierre: Doble Broche',
      customImage: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop',
      options: { Acabado: 'Metálico Oscuro', Tamaño: '45mm' },
      createdAt: '20/09/2026',
    },
    {
      id: 'des-2',
      name: 'Remera Neon Oversized Art',
      category: 'REMERAS',
      summaryText: 'Talle: XL | Color: Negro Faded | Serigrafía: Frontal HD',
      customImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300&auto=format&fit=crop',
      options: { Talle: 'XL', Color: 'Negro' },
      createdAt: '15/09/2026',
    },
  ];

  const currentActiveOrder = displayOrders.find((o) => o.id === selectedOrderId) || displayOrders[0];

  const steps = [
    { title: 'Pedido Realizado', status: 'completed' },
    { title: 'Pago Confirmado', status: 'completed' },
    { title: 'En Preparación', status: 'completed' },
    { title: 'En Producción', status: currentActiveOrder?.status === 'EN_CONFECCION' ? 'active' : currentActiveOrder?.status === 'ENTREGADO' || currentActiveOrder?.status === 'ENVIADO' ? 'completed' : 'pending' },
    { title: 'Listo para Despacho', status: currentActiveOrder?.status === 'ENVIADO' || currentActiveOrder?.status === 'ENTREGADO' ? 'completed' : 'pending' },
    { title: 'Enviado (Tracking)', status: currentActiveOrder?.status === 'ENVIADO' ? 'active' : currentActiveOrder?.status === 'ENTREGADO' ? 'completed' : 'pending' },
    { title: 'Entregado', status: currentActiveOrder?.status === 'ENTREGADO' ? 'completed' : 'pending' },
  ];

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(code);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  const handleCreateAddress = () => {
    if (!newAddrLabel || !newAddrStreet || !newAddrNum) {
      alert('Completa los campos obligatorios para agregar la dirección.');
      return;
    }
    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      label: newAddrLabel.toUpperCase(),
      street: newAddrStreet,
      number: newAddrNum,
      city: newAddrCity || 'Buenos Aires',
      zipCode: 'C1000',
      province: 'Buenos Aires',
    };
    setAddresses([...addresses, newAddr]);
    setNewAddrLabel('');
    setNewAddrStreet('');
    setNewAddrNum('');
    setNewAddrCity('');
    setIsAddingAddress(false);
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
          <Sparkles className="w-4 h-4" /> MIS DISEÑOS CUSTOM ({displayDesigns.length})
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
            <div className="border-4 border-black bg-white p-6 shadow-brutal-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-3 border-black pb-3 gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-black stroke-[2.5]" />
                  <div>
                    <h2 className="text-xl font-black uppercase text-black font-display leading-tight">
                      SEGUIMIENTO EN VIVO DE PEDIDO #{currentActiveOrder.id}
                    </h2>
                    <p className="text-xs font-bold text-gray-600">
                      Fecha de compra: {currentActiveOrder.date} • Total: ${currentActiveOrder.total.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <span className="bg-brand-cyan border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-1">
                  <Truck className="w-4 h-4" /> {currentActiveOrder.trackingNumber || 'PAQ.AR: AR982341293AR'}
                </span>
              </div>

              {/* TIMELINE STEPS */}
              <div className="py-2">
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-center">
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

              {/* ORDER DETAILS SUMMARY */}
              <div className="bg-yellow-50 border-2 border-black p-4 flex flex-col md:flex-row justify-between gap-4 text-xs font-bold">
                <div>
                  <p className="font-black uppercase text-black mb-1">RESUMEN DEL PEDIDO:</p>
                  <p className="text-gray-700">{currentActiveOrder.itemsSummary}</p>
                </div>
                <div>
                  <p className="font-black uppercase text-black mb-1">DIRECCIÓN DE ENTREGA:</p>
                  <p className="text-gray-700">{currentActiveOrder.shippingAddress || 'Av. Corrientes 1234, CABA'}</p>
                </div>
                <div>
                  <p className="font-black uppercase text-black mb-1">MÉTODO DE PAGO:</p>
                  <p className="text-gray-700">{currentActiveOrder.paymentMethod || 'Mercado Pago'}</p>
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
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`border-3 border-black p-4 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected ? 'bg-yellow-100 border-black shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm uppercase text-black">#{order.id}</span>
                        <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase ${
                          order.status === 'ENTREGADO' ? 'bg-green-300 text-black' : 'bg-brand-yellow text-black'
                        }`}>
                          {order.status}
                        </span>
                        {order.isCustomOrder && (
                          <span className="bg-brand-pink text-white border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                            CUSTOM ORDER
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-600">{order.itemsSummary}</p>
                      <p className="text-[11px] font-semibold text-gray-400">Fecha: {order.date}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-lg font-black text-black">${order.total.toLocaleString('es-AR')}</span>
                      <Button variant={isSelected ? 'purple' : 'white'} size="sm" className="text-xs font-black uppercase">
                        {isSelected ? 'VIENDO TRAZA' : 'VER DETALLES'}
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
                        <span className="bg-brand-purple text-white text-[9px] font-black uppercase px-2 py-0.5">
                          {coupon.discountValue}
                        </span>
                        <h4 className="text-base font-black uppercase text-black mt-1">{coupon.rewardTitle}</h4>
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
              {wishlist.map((product) => (
                <div key={product.id} className="border-3 border-black bg-white p-3 shadow-brutal space-y-2 flex flex-col justify-between">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="w-full h-40 object-cover border-2 border-black bg-yellow-100" />
                    {onRemoveFromWishlist && (
                      <button
                        onClick={() => onRemoveFromWishlist(product.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors"
                        title="Eliminar de favoritos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-500">{product.category}</span>
                    <h4 className="text-sm font-black uppercase text-black line-clamp-1">{product.name}</h4>
                    <p className="text-base font-black text-black">${product.price.toLocaleString('es-AR')}</p>
                  </div>
                  {onAddToCart && (
                    <Button variant="yellow" size="sm" fullWidth onClick={() => onAddToCart(product)} className="text-xs font-black uppercase">
                      AGREGAR AL CARRITO <ShoppingBag className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MIS DISEÑOS CUSTOMIZADOS (RF-24) */}
      {activeTab === 'DISENOS' && (
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-4">
          <h3 className="text-base font-black uppercase text-black border-b-2 border-black pb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-cyan" /> MIS DISEÑOS PERSONALIZADOS EN EL STUDIO (RF-24)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayDesigns.map((design) => (
              <div key={design.id} className="border-3 border-black bg-white p-4 shadow-brutal flex gap-4 items-start">
                <img
                  src={design.customImage || 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop'}
                  alt={design.name}
                  className="w-20 h-20 object-cover border-2 border-black bg-yellow-100 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <span className="bg-black text-white text-[9px] font-black uppercase px-1.5 py-0.5">
                    {design.category}
                  </span>
                  <h4 className="text-sm font-black uppercase text-black">{design.name}</h4>
                  <p className="text-xs font-bold text-gray-600 leading-tight">{design.summaryText}</p>
                  <p className="text-[10px] font-extrabold text-gray-400">Creado el {design.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DIRECCIONES Y DATOS PERSONALES (RF-02) */}
      {activeTab === 'DIRECCIONES' && (
        <div className="border-3 border-black bg-white p-6 shadow-brutal space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className="text-base font-black uppercase text-black flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-orange" /> DIRECCIONES DE ENVÍO Y RETIRO (RF-02)
            </h3>
            <Button variant="yellow" size="sm" onClick={() => setIsAddingAddress(!isAddingAddress)} className="text-xs font-black uppercase">
              <Plus className="w-4 h-4 mr-1" /> NUEVA DIRECCIÓN
            </Button>
          </div>

          {/* FORM TO ADD NEW ADDRESS */}
          {isAddingAddress && (
            <div className="border-3 border-black bg-yellow-50 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-black">REGISTRAR NUEVO DOMICILIO</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Nombre / Etiqueta *</label>
                  <input
                    type="text"
                    placeholder="Ej: TRABAJO, CASA DE MAMA"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Calle / Av *</label>
                  <input
                    type="text"
                    placeholder="Calle principal"
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Altura *</label>
                  <input
                    type="text"
                    placeholder="Número"
                    value={newAddrNum}
                    onChange={(e) => setNewAddrNum(e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-bold bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="white" size="sm" onClick={() => setIsAddingAddress(false)}>
                  CANCELAR
                </Button>
                <Button variant="purple" size="sm" onClick={handleCreateAddress}>
                  GUARDAR DIRECCIÓN
                </Button>
              </div>
            </div>
          )}

          {/* LIST OF ADDRESSES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="border-2 border-black p-4 bg-white shadow-brutal-sm space-y-2 relative">
                {addr.isDefault && (
                  <span className="bg-green-400 border border-black text-black text-[9px] font-black uppercase px-2 py-0.5 absolute top-3 right-3">
                    PREDETERMINADA
                  </span>
                )}
                <h4 className="font-extrabold text-sm uppercase text-black">{addr.label}</h4>
                <p className="text-xs font-bold text-gray-700">{addr.street} {addr.number} {addr.floorDept}</p>
                <p className="text-xs font-bold text-gray-500">{addr.city}, {addr.zipCode}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
