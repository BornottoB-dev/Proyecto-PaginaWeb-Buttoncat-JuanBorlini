import React, { useState } from 'react';
import { ShieldCheck, Package, ShoppingBag, DollarSign, Clock, ArrowLeft, Search, Plus, Edit, Trash2, Tag, Sparkles } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus, CategoryItem, VibeItem } from '../types/types';
import { AddEditProductModal } from '../components/admin/AddEditProductModal';
import { AddCategoryModal } from '../components/admin/AddCategoryModal';
import { AddEditVibeModal } from '../components/admin/AddEditVibeModal';

interface AdminDashboardPageProps {
  products: Product[];
  categories: CategoryItem[];
  vibes: VibeItem[];
  onBackToStore: () => void;
  // Product CRUD
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  // Category CRUD
  onAddCategory: (category: CategoryItem) => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  // Vibe CRUD
  onAddVibe: (vibe: VibeItem) => void;
  onEditVibe: (vibe: VibeItem) => void;
  onDeleteVibe: (vibeId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  products,
  categories,
  vibes,
  onBackToStore,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddVibe,
  onEditVibe,
  onDeleteVibe,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'categories' | 'vibes'>('inventory');

  // Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Vibe Modal state
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [editingVibe, setEditingVibe] = useState<VibeItem | null>(null);

  // Mock Admin Orders List
  const [orders, setOrders] = useState<AdminOrder[]>([
    {
      id: 'ORD-8942',
      customerName: 'Luna Lovecraft',
      customerEmail: 'luna@buttoncat.com',
      date: '2026-09-04',
      total: 12500,
      status: 'EN_CONFECCION',
      itemsCount: 1,
      itemsSummary: 'Remera Custom (Negro Azabache - Talle M - Estampa A4 Frente)',
      isCustomOrder: true,
    },
    {
      id: 'ORD-8941',
      customerName: 'Santiago Rossi',
      customerEmail: 'santi@gmail.com',
      date: '2026-09-04',
      total: 8400,
      status: 'PENDIENTE',
      itemsCount: 2,
      itemsSummary: 'Collar Gargantilla Gothic + Pin 55mm Soft Touch',
      isCustomOrder: true,
    },
    {
      id: 'ORD-8940',
      customerName: 'Valeria Gomez',
      customerEmail: 'valeria@hotmail.com',
      date: '2026-09-03',
      total: 15600,
      status: 'ENVIADO',
      itemsCount: 2,
      itemsSummary: 'Peluche Gótico Gato Franken + Sticker Vinyl Pack',
      isCustomOrder: false,
    },
    {
      id: 'ORD-8939',
      customerName: 'Facundo Diaz',
      customerEmail: 'facundo@yahoo.com',
      date: '2026-09-02',
      total: 3500,
      status: 'ENTREGADO',
      itemsCount: 1,
      itemsSummary: 'Aros Plata 925 Par Asimétrico',
      isCustomOrder: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Orders status change & delete
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido #${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  // Product CRUD triggers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      onEditProduct(product);
    } else {
      onAddProduct(product);
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${product.name}" del catálogo?`)) {
      onDeleteProduct(product.id);
    }
  };

  // Category CRUD triggers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: CategoryItem) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (category: CategoryItem) => {
    if (editingCategory) {
      onEditCategory(category);
    } else {
      onAddCategory(category);
    }
  };

  const handleDeleteCategoryClick = (category: CategoryItem) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
      onDeleteCategory(category.id);
    }
  };

  // Vibe CRUD triggers
  const handleOpenAddVibe = () => {
    setEditingVibe(null);
    setIsVibeModalOpen(true);
  };

  const handleOpenEditVibe = (vibe: VibeItem) => {
    setEditingVibe(vibe);
    setIsVibeModalOpen(true);
  };

  const handleSaveVibe = (vibe: VibeItem) => {
    if (editingVibe) {
      onEditVibe(vibe);
    } else {
      onAddVibe(vibe);
    }
  };

  const handleDeleteVibeClick = (vibe: VibeItem) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la Vibe "${vibe.name}"?`)) {
      onDeleteVibe(vibe.id);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return 'bg-brand-yellow text-black border-2 border-black';
      case 'EN_CONFECCION':
        return 'bg-brand-purple text-white border-2 border-black';
      case 'ENVIADO':
        return 'bg-brand-cyan text-black border-2 border-black';
      case 'ENTREGADO':
        return 'bg-green-400 text-black border-2 border-black';
    }
  };

  const filteredInventory = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDIENTE' || o.status === 'EN_CONFECCION').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* HEADER BAR */}
      <div className="border-4 border-black bg-black text-white p-6 shadow-brutal-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-brand-yellow text-black px-3 py-1 text-xs font-black uppercase border-2 border-black shadow-brutal-sm tracking-wider">
            <ShieldCheck className="w-4 h-4 text-black stroke-[3]" /> PANEL DE CONTROL ADMINISTRATIVO
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sedgwick tracking-wider text-brand-yellow uppercase leading-none drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            BUTTONCAT ADMIN STUDIO
          </h1>
        </div>

        <button
          onClick={onBackToStore}
          className="bg-brand-pink text-white border-3 border-white px-5 py-2.5 text-xs font-black uppercase hover:bg-brand-yellow hover:text-black transition-all shadow-brutal-sm flex items-center gap-2 active:translate-y-0.5 cursor-pointer tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> VOLVER A LA TIENDA
        </button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-3 border-black bg-brand-yellow p-5 shadow-brutal-md space-y-1">
          <div className="flex items-center justify-between text-black">
            <span className="text-[11px] font-black uppercase tracking-wider text-black">INGRESOS TOTALES</span>
            <DollarSign className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-black font-display tracking-tight block py-1">${totalRevenue.toLocaleString()}</span>
          <span className="text-[10px] font-black uppercase text-black/80 tracking-wide block">ÚLTIMOS 30 DÍAS</span>
        </div>

        <div className="border-3 border-black bg-cyan-200 p-5 shadow-brutal-md space-y-1">
          <div className="flex items-center justify-between text-black">
            <span className="text-[11px] font-black uppercase tracking-wider text-black">PEDIDOS PENDIENTES</span>
            <Clock className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-black font-display tracking-tight block py-1">{pendingOrdersCount} PEDIDOS</span>
          <span className="text-[10px] font-black uppercase text-black/80 tracking-wide block">REQUIEREN ATENCIÓN</span>
        </div>

        <div className="border-3 border-black bg-pink-200 p-5 shadow-brutal-md space-y-1">
          <div className="flex items-center justify-between text-black">
            <span className="text-[11px] font-black uppercase tracking-wider text-black">PRODUCTOS EN CATÁLOGO</span>
            <Package className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-black font-display tracking-tight block py-1">{products.length} ITEMS</span>
          <span className="text-[10px] font-black uppercase text-black/80 tracking-wide block">CATÁLOGO ACTIVO</span>
        </div>

        <div className="border-3 border-black bg-purple-200 p-5 shadow-brutal-md space-y-1">
          <div className="flex items-center justify-between text-black">
            <span className="text-[11px] font-black uppercase tracking-wider text-black">CATEGORÍAS Y VIBES</span>
            <Tag className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-black font-display tracking-tight block py-1">{categories.length} CATS / {vibes.length} VIBES</span>
          <span className="text-[10px] font-black uppercase text-black/80 tracking-wide block">BUTTONCAT STUDIO</span>
        </div>
      </div>

      {/* TABS NAVIGATION & QUICK CRUD ACTIONS */}
      <div className="border-4 border-black bg-white shadow-brutal-lg overflow-hidden">
        <div className="bg-gray-100 border-b-4 border-black p-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* TAB BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 border-3 border-black text-xs font-black uppercase transition-all flex items-center gap-2 shadow-brutal-sm cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <Package className="w-4 h-4" /> PRODUCTOS ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 border-3 border-black text-xs font-black uppercase transition-all flex items-center gap-2 shadow-brutal-sm cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <Tag className="w-4 h-4" /> CATEGORÍAS ({categories.length})
            </button>

            <button
              onClick={() => setActiveTab('vibes')}
              className={`px-4 py-2 border-3 border-black text-xs font-black uppercase transition-all flex items-center gap-2 shadow-brutal-sm cursor-pointer ${
                activeTab === 'vibes'
                  ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <Sparkles className="w-4 h-4" /> VIBES ({vibes.length})
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 border-3 border-black text-xs font-black uppercase transition-all flex items-center gap-2 shadow-brutal-sm cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-brand-pink text-white shadow-brutal ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-yellow-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> PEDIDOS ({orders.length})
            </button>
          </div>

          {/* DYNAMIC ACTION BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenAddProduct}
              className="bg-brand-yellow text-black border-3 border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-brand-orange hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR PRODUCTO
            </button>

            <button
              onClick={handleOpenAddCategory}
              className="bg-brand-cyan text-black border-3 border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-black hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR CATEGORÍA
            </button>

            <button
              onClick={handleOpenAddVibe}
              className="bg-purple-300 text-black border-3 border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-brand-purple hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR VIBE
            </button>
          </div>

        </div>

        {/* TAB 1: INVENTORY & PRODUCTS CRUD */}
        {activeTab === 'inventory' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-3 border-black pb-3 gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-black font-display">
                  CATÁLOGO DE PRODUCTOS (CREAR, EDITAR Y ELIMINAR)
                </h3>
                <p className="text-xs text-gray-600 font-bold">
                  Agrega nuevos productos, modifica precios o elimina ítems en tiempo real.
                </p>
              </div>

              {/* SEARCH & NEW PRODUCT ACTION */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o categoría..."
                    className="w-full border-2 border-black px-3 py-1.5 text-xs font-bold bg-white text-black pl-8 shadow-brutal-sm focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-black absolute left-2 top-2 stroke-[2.5]" />
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-brand-pink text-white border-2 border-black px-3 py-1.5 text-xs font-black uppercase hover:bg-brand-yellow hover:text-black transition-all shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR PRODUCTO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => (
                <div key={item.id} className="border-3 border-black bg-white p-4 shadow-brutal-md flex flex-col justify-between space-y-3 relative group">
                  
                  <div className="flex items-start gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 border-2 border-black object-cover shrink-0" />
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.2 inline-block">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-black uppercase text-black truncate">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-purple block">${item.price.toFixed(2)}</span>
                        {item.originalPrice && (
                          <span className="text-xs font-bold text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      
                      <div className="text-[10px] font-black uppercase text-gray-600">
                        STOCK: <span className={item.stock > 0 ? 'text-green-600' : 'text-red-600'}>{item.stock} UNIDADES</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (EDIT & DELETE) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
                    <button
                      onClick={() => handleOpenEditProduct(item)}
                      className="px-2.5 py-1 bg-yellow-200 border-2 border-black text-black text-[11px] font-black uppercase hover:bg-brand-yellow flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                      title="Editar Producto"
                    >
                      <Edit className="w-3.5 h-3.5" /> EDITAR
                    </button>

                    <button
                      onClick={() => handleDeleteProductClick(item)}
                      className="px-2.5 py-1 bg-pink-100 border-2 border-black text-red-600 text-[11px] font-black uppercase hover:bg-red-600 hover:text-white flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                      title="Eliminar Producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ELIMINAR
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES CRUD */}
        {activeTab === 'categories' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-3 border-black pb-3 gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-black font-display">
                  CATEGORÍAS DE PRODUCTOS (CREAR, EDITAR Y ELIMINAR)
                </h3>
                <p className="text-xs text-gray-600 font-bold">
                  Administra las secciones de la tienda. Puedes crear, cambiar nombre/precios o eliminar categorías.
                </p>
              </div>

              <button
                onClick={handleOpenAddCategory}
                className="bg-brand-cyan text-black border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR CATEGORÍA
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const productCount = products.filter((p) => p.category === cat.name).length;
                return (
                  <div key={cat.id} className="border-3 border-black bg-white p-5 shadow-brutal-md flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.emoji || '🏷️'}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-brutal-sm ${cat.bgColor || 'bg-brand-pink text-white'}`}>
                          {productCount} PRODUCTOS
                        </span>
                      </div>

                      <h4 className="text-lg font-black uppercase text-black tracking-tight">{cat.name}</h4>
                      <p className="text-xs text-gray-600 font-bold line-clamp-2">{cat.description}</p>
                      
                      {cat.basePrice && (
                        <div className="text-xs font-black text-black">
                          PRECIO BASE SUGERIDO: <span className="text-brand-purple">${cat.basePrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="px-2.5 py-1 bg-yellow-200 border-2 border-black text-black text-[11px] font-black uppercase hover:bg-brand-yellow flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                        title="Editar Categoría"
                      >
                        <Edit className="w-3.5 h-3.5" /> EDITAR
                      </button>

                      <button
                        onClick={() => handleDeleteCategoryClick(cat)}
                        className="px-2.5 py-1 bg-red-100 border-2 border-black text-red-700 text-[11px] font-black uppercase hover:bg-red-600 hover:text-white flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                        title="Eliminar Categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ELIMINAR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: VIBES CRUD */}
        {activeTab === 'vibes' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-3 border-black pb-3 gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-black font-display">
                  VIBES & ESTILOS (CREAR, EDITAR Y ELIMINAR)
                </h3>
                <p className="text-xs text-gray-600 font-bold">
                  Administra las etiquetas de estética (GOTH, Y2K, KAWAII, PUNK, etc.) que filtran la tienda.
                </p>
              </div>

              <button
                onClick={handleOpenAddVibe}
                className="bg-purple-300 text-black border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-brand-purple hover:text-white transition-all shadow-brutal-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR VIBE
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vibes.map((vibe) => {
                const productCount = products.filter((p) => p.vibe.includes(vibe.name)).length;
                return (
                  <div key={vibe.id} className="border-3 border-black bg-white p-5 shadow-brutal-md flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{vibe.emoji || '⚡'}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-brutal-sm ${vibe.badgeBg || 'bg-brand-pink text-white'}`}>
                          {productCount} PRODUCTOS
                        </span>
                      </div>

                      <h4 className="text-xl font-black uppercase text-black tracking-tight">{vibe.name}</h4>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
                      <button
                        onClick={() => handleOpenEditVibe(vibe)}
                        className="px-2.5 py-1 bg-yellow-200 border-2 border-black text-black text-[11px] font-black uppercase hover:bg-brand-yellow flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                        title="Editar Vibe"
                      >
                        <Edit className="w-3.5 h-3.5" /> EDITAR
                      </button>

                      <button
                        onClick={() => handleDeleteVibeClick(vibe)}
                        className="px-2.5 py-1 bg-red-100 border-2 border-black text-red-700 text-[11px] font-black uppercase hover:bg-red-600 hover:text-white flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                        title="Eliminar Vibe"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ELIMINAR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b-3 border-black pb-3 flex-wrap gap-2">
              <h3 className="text-xl font-black uppercase text-black font-display">
                LISTADO Y ADMINISTRACIÓN DE PEDIDOS
              </h3>
              <span className="text-xs font-black uppercase bg-brand-yellow text-black border border-black px-2 py-1">
                ACTUALIZACIÓN EN TIEMPO REAL
              </span>
            </div>

            <div className="overflow-x-auto border-3 border-black shadow-brutal-sm">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-black text-white uppercase text-[11px] font-black tracking-wider border-b-3 border-black">
                    <th className="p-3 border-r-2 border-white">ID / FECHA</th>
                    <th className="p-3 border-r-2 border-white">CLIENTE</th>
                    <th className="p-3 border-r-2 border-white">ITEMS / DETALLES</th>
                    <th className="p-3 border-r-2 border-white">TOTAL</th>
                    <th className="p-3 border-r-2 border-white">ESTADO DEL PEDIDO</th>
                    <th className="p-3">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white text-black">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-yellow-50 transition-colors">
                      <td className="p-3 font-black border-r-2 border-black whitespace-nowrap">
                        <div className="text-black">{order.id}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{order.date}</div>
                      </td>
                      <td className="p-3 font-black border-r-2 border-black whitespace-nowrap">
                        <div>{order.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{order.customerEmail}</div>
                      </td>
                      <td className="p-3 border-r-2 border-black max-w-xs">
                        <div className="font-extrabold text-black">{order.itemsSummary}</div>
                        {order.isCustomOrder && (
                          <span className="inline-block mt-1 bg-brand-pink text-white text-[9px] font-black uppercase px-1.5 py-0.2 border border-black">
                            CUSTOM STUDIO
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-black text-sm border-r-2 border-black whitespace-nowrap">
                        ${order.total.toLocaleString()}
                      </td>
                      <td className="p-3 border-r-2 border-black whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 text-xs font-black uppercase cursor-pointer focus:outline-none shadow-brutal-sm ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="PENDIENTE">PENDIENTE ⏳</option>
                          <option value="EN_CONFECCION">EN CONFECCIÓN 🪡</option>
                          <option value="ENVIADO">ENVIADO 🚚</option>
                          <option value="ENTREGADO">ENTREGADO ✅</option>
                        </select>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-2 py-1 bg-red-100 border-2 border-black text-red-700 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white flex items-center gap-1 shadow-brutal-sm cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> BORRAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      <AddEditProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
      />

      {/* ADD / EDIT CATEGORY MODAL */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        categoryToEdit={editingCategory}
      />

      {/* ADD / EDIT VIBE MODAL */}
      <AddEditVibeModal
        isOpen={isVibeModalOpen}
        onClose={() => {
          setIsVibeModalOpen(false);
          setEditingVibe(null);
        }}
        onSave={handleSaveVibe}
        vibeToEdit={editingVibe}
      />

    </div>
  );
};
