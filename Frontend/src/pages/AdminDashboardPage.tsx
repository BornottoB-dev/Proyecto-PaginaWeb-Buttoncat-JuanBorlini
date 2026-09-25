import React, { useState } from 'react';
import { Package, ShoppingBag, DollarSign, Search, Plus, Edit, Trash2, Tag, TrendingUp, BarChart3, PieChart, Users, AlertTriangle, LogOut, Award, Receipt, Sparkles, Calendar, Truck, Store, Globe, Smartphone } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus, CategoryItem, VibeItem, User, RewardItem } from '../types/types';
import { MOCK_REWARDS } from '../data/mockRewards';
import { AddEditProductModal } from '../components/admin/AddEditProductModal';
import { AddCategoryModal } from '../components/admin/AddCategoryModal';
import { AddEditStyleModal } from '../components/admin/AddEditStyleModal';
import { AddOrderModal } from '../components/admin/AddOrderModal';
import { AddExpenseModal, type AdminExpense } from '../components/admin/AddExpenseModal';
import { AddRewardAdminModal } from '../components/admin/AddRewardAdminModal';
import { AddEditCustomerModal, type AdminCustomer } from '../components/admin/AddEditCustomerModal';

interface AdminDashboardPageProps {
  products: Product[];
  categories: CategoryItem[];
  vibes: VibeItem[];
  currentUser?: User | null;
  onLogout?: () => void;
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
  currentUser,
  onLogout,
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'inventory' | 'categories' | 'vibes' | 'customers' | 'expenses' | 'rewards'>('analytics');

  // Modals & Editing States for FULL CRUD COVERAGE
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<AdminExpense | null>(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [editingVibe, setEditingVibe] = useState<VibeItem | null>(null);

  // SEARCH STATES FOR EVERY SINGLE CRUD
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');
  const [rewardSearchQuery, setRewardSearchQuery] = useState<string>('');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');

  // ADVANCED ORDER FILTERS
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('TODOS');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'TODOS' | 'CUSTOM' | 'ESTANDAR'>('TODOS');
  const [orderSalesChannelFilter, setOrderSalesChannelFilter] = useState<string>('TODOS');
  const [orderShippingFilter, setOrderShippingFilter] = useState<string>('TODOS');
  const [orderStartDateFilter, setOrderStartDateFilter] = useState<string>('');
  const [orderEndDateFilter, setOrderEndDateFilter] = useState<string>('');

  // ADVANCED INVENTORY FILTERS
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('TODAS');
  const [inventoryVibeFilter, setInventoryVibeFilter] = useState<string>('TODAS');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'TODOS' | 'LOW' | 'NORMAL'>('TODOS');
  const [inventorySalesChannelFilter, setInventorySalesChannelFilter] = useState<string>('TODOS');

  // Mock Admin Orders List with enriched attributes
  const [orders, setOrders] = useState<AdminOrder[]>([
    {
      id: 'ORD-8942',
      customerName: 'Luna Lovecraft',
      customerEmail: 'luna@buttoncat.com',
      date: '2026-09-04',
      estimatedDeliveryDate: '2026-09-12',
      total: 12500,
      status: 'EN_CONFECCION',
      itemsCount: 1,
      itemsSummary: 'Remera Custom (Negro Azabache - Talle M - Estampa A4 Frente)',
      isCustomOrder: true,
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      shippingDestination: 'Av. Corrientes 4500, CABA',
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
      itemsSummary: 'Collar Gargantilla Gothic + Pin 55mm Soft Touch',
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
      itemsSummary: 'Peluche Gótico Gato Franken + Sticker Vinyl Pack',
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
      itemsSummary: 'Aros Plata 925 Par Asimétrico',
      isCustomOrder: false,
      salesChannel: 'TIENDA_WEB',
      hasShipping: true,
      shippingDestination: 'San Martín 120, Rosario, Santa Fe',
      carrier: 'Andreani',
      paymentMethod: 'Mercado Pago',
      paymentStatus: 'PAGADO',
    },
  ]);

  // Mock Customers List
  const [customers, setCustomers] = useState<AdminCustomer[]>([
    { id: 'usr-1', name: 'Juan Borlini', email: 'juan.borlini@email.com', role: 'CLIENTE VIP', ordersCount: 5, totalSpent: 45000, points: 450, joinedDate: '2024-03-15' },
    { id: 'usr-2', name: 'Luna Lovecraft', email: 'luna@buttoncat.com', role: 'CLIENTE', ordersCount: 3, totalSpent: 28500, points: 285, joinedDate: '2025-01-10' },
    { id: 'usr-3', name: 'Santiago Rossi', email: 'santi@gmail.com', role: 'CLIENTE', ordersCount: 2, totalSpent: 16800, points: 168, joinedDate: '2025-06-20' },
    { id: 'usr-4', name: 'Valeria Gomez', email: 'valeria@hotmail.com', role: 'CLIENTE VIP', ordersCount: 8, totalSpent: 82000, points: 820, joinedDate: '2024-08-04' },
    { id: 'usr-5', name: 'Facundo Diaz', email: 'facundo@yahoo.com', role: 'CLIENTE', ordersCount: 1, totalSpent: 3500, points: 35, joinedDate: '2026-02-12' },
  ]);

  // Mock Expenses List
  const [expenses, setExpenses] = useState<AdminExpense[]>([
    { id: 'EXP-101', supplier: 'Distribuidora Textil Quilmes', category: 'INSUMOS', description: 'Compra 50m tela algodón peinado negro', amount: 48500, paymentMethod: 'TRANSFERENCIA', date: '2026-09-01' },
    { id: 'EXP-102', supplier: 'Impresiones Grafisur', category: 'PACKAGING', description: 'Impresión 500 bolsas y stickers de marca', amount: 22000, paymentMethod: 'MERCADO PAGO', date: '2026-08-28' },
    { id: 'EXP-103', supplier: 'Andreani Logística', category: 'LOGISTICA', description: 'Servicio de despacho y envíos semanales', amount: 18400, paymentMethod: 'TRANSFERENCIA', date: '2026-08-25' },
  ]);

  // Mock Admin Rewards List
  const [adminRewards, setAdminRewards] = useState<RewardItem[]>(MOCK_REWARDS);

  // ORDER CRUD HANDLERS
  const handleOpenAddOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: AdminOrder) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = (orderData: AdminOrder) => {
    if (editingOrder) {
      setOrders((prev) => prev.map((o) => (o.id === orderData.id ? orderData : o)));
    } else {
      setOrders((prev) => [orderData, ...prev]);
    }
  };

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

  // CUSTOMER CRUD HANDLERS
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (customer: AdminCustomer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (customerData: AdminCustomer) => {
    if (editingCustomer) {
      setCustomers((prev) => prev.map((c) => (c.id === customerData.id ? customerData : c)));
    } else {
      setCustomers((prev) => [customerData, ...prev]);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro de cliente?')) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // EXPENSE CRUD HANDLERS
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: AdminExpense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (expenseData: AdminExpense) => {
    if (editingExpense) {
      setExpenses((prev) => prev.map((e) => (e.id === expenseData.id ? expenseData : e)));
    } else {
      setExpenses((prev) => [expenseData, ...prev]);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('¿Eliminar este registro de gasto?')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // REWARD CRUD HANDLERS
  const handleOpenAddReward = () => {
    setEditingReward(null);
    setIsRewardModalOpen(true);
  };

  const handleOpenEditReward = (reward: RewardItem) => {
    setEditingReward(reward);
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (rewardData: RewardItem) => {
    if (editingReward) {
      setAdminRewards((prev) => prev.map((r) => (r.id === rewardData.id ? rewardData : r)));
    } else {
      setAdminRewards((prev) => [rewardData, ...prev]);
    }
  };

  const handleDeleteReward = (id: string) => {
    if (window.confirm('¿Eliminar este premio del catálogo?')) {
      setAdminRewards((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // PRODUCT CRUD TRIGGERS
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

  // CATEGORY CRUD TRIGGERS
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

  // VIBE CRUD TRIGGERS
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
    if (window.confirm(`¿Estás seguro de que deseas eliminar el Estilo "${vibe.name}"?`)) {
      onDeleteVibe(vibe.id);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDIENTE':
        return 'bg-amber-400 text-black border-2 border-black font-extrabold';
      case 'EN_CONFECCION':
        return 'bg-purple-500 text-white border-2 border-black font-extrabold';
      case 'ENVIADO':
        return 'bg-cyan-400 text-black border-2 border-black font-extrabold';
      case 'ENTREGADO':
        return 'bg-emerald-400 text-black border-2 border-black font-extrabold';
    }
  };

  const getSalesChannelBadge = (channel?: string) => {
    switch (channel) {
      case 'VENTA_FISICA':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Store className="w-3 h-3" /> LOCAL FÍSICO</span>;
      case 'REDES_SOCIALES':
        return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Smartphone className="w-3 h-3" /> REDES SOCIALES</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Globe className="w-3 h-3" /> TIENDA WEB</span>;
    }
  };

  // FILTERED LISTS FOR EVERY SINGLE TAB
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter !== 'TODOS' && order.status !== orderStatusFilter) {
      return false;
    }
    if (orderTypeFilter === 'CUSTOM' && !order.isCustomOrder) {
      return false;
    }
    if (orderTypeFilter === 'ESTANDAR' && order.isCustomOrder) {
      return false;
    }
    if (orderSalesChannelFilter !== 'TODOS' && (order.salesChannel || 'TIENDA_WEB') !== orderSalesChannelFilter) {
      return false;
    }
    if (orderShippingFilter === 'CON_ENVIO' && !order.hasShipping) {
      return false;
    }
    if (orderShippingFilter === 'RETIRO_LOCAL' && order.hasShipping) {
      return false;
    }
    if (orderStartDateFilter && order.date < orderStartDateFilter) {
      return false;
    }
    if (orderEndDateFilter && order.date > orderEndDateFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matches =
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q) ||
        order.itemsSummary.toLowerCase().includes(q) ||
        (order.shippingDestination && order.shippingDestination.toLowerCase().includes(q)) ||
        (order.carrier && order.carrier.toLowerCase().includes(q)) ||
        (order.paymentMethod && order.paymentMethod.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const filteredInventory = products.filter((p) => {
    if (inventoryCategoryFilter !== 'TODAS' && p.category !== inventoryCategoryFilter) {
      return false;
    }
    if (inventoryVibeFilter !== 'TODAS' && !p.vibe.includes(inventoryVibeFilter)) {
      return false;
    }
    if (inventoryStockFilter === 'LOW' && p.stock > 10) {
      return false;
    }
    if (inventoryStockFilter === 'NORMAL' && p.stock <= 10) {
      return false;
    }
    if (inventorySalesChannelFilter !== 'TODOS' && (p.salesChannel || 'AMBOS') !== inventorySalesChannelFilter) {
      return false;
    }
    if (inventorySearchQuery.trim()) {
      const q = inventorySearchQuery.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        p.vibe.some((v) => v.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    if (!expenseSearchQuery.trim()) return true;
    const q = expenseSearchQuery.toLowerCase();
    return (
      e.supplier.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.paymentMethod.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  });

  const filteredRewards = adminRewards.filter((r) => {
    if (!rewardSearchQuery.trim()) return true;
    const q = rewardSearchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.discountValue.toLowerCase().includes(q) ||
      r.codePrefix.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const filteredCategories = categories.filter((c) => {
    if (!tagSearchQuery.trim()) return true;
    return c.name.toLowerCase().includes(tagSearchQuery.toLowerCase());
  });

  const filteredVibes = vibes.filter((v) => {
    if (!tagSearchQuery.trim()) return true;
    return v.name.toLowerCase().includes(tagSearchQuery.toLowerCase());
  });

  // METRICS & ANALYTICS CALCULATIONS
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDIENTE' || o.status === 'EN_CONFECCION').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Monthly Sales Mock Data for Chart
  const monthlyData = [
    { month: 'ENE', revenue: 18500, completedOrders: 8 },
    { month: 'FEB', revenue: 24200, completedOrders: 11 },
    { month: 'MAR', revenue: 31000, completedOrders: 14 },
    { month: 'ABR', revenue: 29800, completedOrders: 12 },
    { month: 'MAY', revenue: 38400, completedOrders: 16 },
    { month: 'JUN', revenue: 42000, completedOrders: 19 },
    { month: 'JUL', revenue: 46500, completedOrders: 22 },
    { month: 'AGO', revenue: 51200, completedOrders: 24 },
    { month: 'SEP', revenue: 40000, completedOrders: 18 },
  ];
  const maxMonthlyRevenue = Math.max(...monthlyData.map((d) => d.revenue));

  // Category Revenue Distribution
  const categoryStats = [
    { name: 'STICKERS', percent: 35, color: 'bg-amber-400' },
    { name: 'REMERAS', percent: 25, color: 'bg-brand-pink' },
    { name: 'PINES', percent: 20, color: 'bg-brand-cyan' },
    { name: 'ARITOS', percent: 12, color: 'bg-brand-purple' },
    { name: 'PELUCHES / OTROS', percent: 8, color: 'bg-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      <div>
        {/* CLEAN MINIMAL ADMIN HEADER */}
        <header className="border-b-2 border-slate-800 bg-black px-4 sm:px-8 py-3 shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-xl font-black uppercase tracking-wider text-brand-yellow font-display">
                BUTTONCAT | PANEL DE CONTROL
              </span>
            </div>

            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Users className="w-4 h-4 text-brand-yellow" />
                  <span>{currentUser.name}</span>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-red-600 text-white px-3.5 py-1.5 text-xs font-bold uppercase hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" /> CERRAR SESIÓN
                </button>
              )}
            </div>

          </div>
        </header>

        {/* ISOLATED ADMIN MAIN CONTAINER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          
          {/* NAVIGATION TABS */}
          <div className="border-b-2 border-slate-800 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-brand-yellow text-black border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> ANALÍTICA Y MÉTRICAS
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`relative px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-brand-cyan text-black border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> PEDIDOS ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-brand-pink text-white border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" /> INVENTARIO ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-emerald-400 text-black border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> CLIENTES ({customers.length})
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-amber-400 text-black border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" /> GASTOS Y PROVEEDORES ({expenses.length})
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'rewards'
                  ? 'bg-brand-purple text-white border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" /> PREMIOS Y CUPONES ({adminRewards.length})
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 border-2 border-slate-800 text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-slate-700 text-white border-black font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Tag className="w-4 h-4" /> CATEGORÍAS Y ESTILOS
            </button>
          </div>

          {/* TAB 1: ANALÍTICA & REPORTES DE DATOS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* KPI STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="border-2 border-slate-800 bg-slate-900 p-4 text-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>INGRESOS TOTALES</span>
                    <DollarSign className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-brand-yellow">
                    ${totalRevenue.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">+18.4% respecto al mes anterior</span>
                </div>

                <div className="border-2 border-slate-800 bg-slate-900 p-4 text-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>TOTAL PEDIDOS</span>
                    <ShoppingBag className="w-5 h-5 text-brand-cyan" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-brand-cyan">
                    {totalOrders} PEDIDOS
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{pendingOrdersCount} en estado pendiente o confección</span>
                </div>

                <div className="border-2 border-slate-800 bg-slate-900 p-4 text-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>GASTOS TOTALES</span>
                    <Receipt className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-amber-400">
                    ${totalExpenses.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Compras e insumos a proveedores</span>
                </div>

                <div className="border-2 border-slate-800 bg-slate-900 p-4 text-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>ALERTAS DE STOCK</span>
                    <AlertTriangle className="w-5 h-5 text-brand-pink" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-brand-pink">
                    {lowStockProducts.length} ITEMS
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Productos con 10 o menos unidades</span>
                </div>

              </div>

              {/* CHARTS GRID SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* REVENUE TREND VISUAL CHART (2 COLS) */}
                <div className="lg:col-span-2 border-2 border-slate-800 bg-slate-900 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black uppercase text-brand-yellow font-display flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" /> TENDENCIA DE INGRESOS MENSUALES (2026)
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        Facturación bruta por mes en pesos argentinos
                      </p>
                    </div>
                  </div>

                  {/* VISUAL BAR CHART WITH RESPONSIVE OVERFLOW FOR MOBILE */}
                  <div className="overflow-x-auto no-scrollbar pb-2">
                    <div className="h-64 flex items-end justify-between gap-1.5 sm:gap-3 pt-10 pb-2 px-1 sm:px-2 border-b border-slate-800 min-w-[480px] sm:min-w-0">
                      {monthlyData.map((item) => {
                        const heightPercent = Math.round((item.revenue / maxMonthlyRevenue) * 100);
                        return (
                          <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end relative">
                            
                            {/* REVENUE AMOUNT DISPLAYED ABOVE THE BAR (NEVER COVERED) */}
                            <span className="text-[9px] sm:text-[10px] font-bold text-brand-cyan mb-1 whitespace-nowrap">
                              ${(item.revenue / 1000).toFixed(1)}k
                            </span>

                            {/* BAR */}
                            <div
                              className="w-full bg-brand-purple hover:bg-brand-pink transition-all border border-slate-700 rounded-t-xs relative"
                              style={{ height: `${heightPercent}%` }}
                            >
                              {/* HOVER TOOLTIP DISPLAYING UNAMBIGUOUS 'PEDIDOS COMPLETADOS' */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 bg-black text-slate-100 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-slate-700 shadow-lg z-20">
                                {item.completedOrders} pedidos completados (${item.revenue.toLocaleString()} ARS)
                              </div>
                            </div>

                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider">
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs font-bold text-slate-400 pt-1">
                    <span>Promedio mensual: ${(totalRevenue * 2.5).toLocaleString('es-AR')} • Ticket promedio: ${avgOrderValue.toLocaleString('es-AR')} ARS</span>
                    <span className="text-brand-yellow font-black">Pico máximo: Agosto ($51.200 ARS)</span>
                  </div>
                </div>

                {/* CATEGORY DISTRIBUTION CHART (1 COL) */}
                <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-base font-black uppercase text-brand-cyan font-display flex items-center gap-2">
                      <PieChart className="w-5 h-5" /> VENTAS POR CATEGORÍA
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      Participación porcentual por tipo de producto
                    </p>
                  </div>

                  <div className="space-y-4">
                    {categoryStats.map((cat) => (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black uppercase">
                          <span className="text-slate-200">{cat.name}</span>
                          <span className="text-brand-yellow">{cat.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 border border-slate-700 p-0.5">
                          <div
                            className={`h-full ${cat.color} transition-all duration-500`}
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-3 text-xs font-semibold text-slate-400">
                    Stickers y Remeras representan el 60% de las ventas.
                  </div>
                </div>

              </div>

              {/* TOP SELLING PRODUCTS & INVENTORY ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* TOP PRODUCTS */}
                <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-4">
                  <h3 className="text-base font-black uppercase text-brand-pink font-display border-b border-slate-800 pb-3">
                    TOP 5 PRODUCTOS MÁS VENDIDOS
                  </h3>

                  <div className="space-y-2.5">
                    {products.slice(0, 5).map((prod, idx) => (
                      <div key={prod.id} className="border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-brand-yellow text-black font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <img src={prod.image} alt={prod.name} className="w-9 h-9 object-cover border border-slate-800" />
                          <div>
                            <h4 className="text-xs font-black uppercase text-slate-100">{prod.name}</h4>
                            <span className="text-[10px] font-semibold text-slate-400">{prod.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-brand-yellow block">${(prod.price * 15).toFixed(0)} ARS</span>
                          <span className="text-[10px] font-semibold text-emerald-400">15 unidades vendidas</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LOW STOCK WARNINGS */}
                <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-4">
                  <h3 className="text-base font-black uppercase text-amber-400 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
                    <AlertTriangle className="w-5 h-5" /> REPOSICIÓN DE STOCK REQUERIDA
                  </h3>

                  {lowStockProducts.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400 py-4 text-center">Todo el inventario tiene niveles óptimos de stock.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {lowStockProducts.map((prod) => (
                        <div key={prod.id} className="border border-amber-500/40 bg-amber-950/20 p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={prod.image} alt={prod.name} className="w-9 h-9 object-cover border border-slate-800" />
                            <div>
                              <h4 className="text-xs font-black uppercase text-slate-100">{prod.name}</h4>
                              <span className="text-[10px] font-semibold text-slate-400">{prod.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 border border-amber-500 block">
                              QUEDAN {prod.stock} UNIDADES
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PEDIDOS Y ÓRDENES (FULL CRUD CON NUEVOS ATRIBUTOS & BARRA DE BÚSQUEDA) */}
          {activeTab === 'orders' && (
            <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-brand-yellow font-display flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> GESTIÓN DE PEDIDOS ({filteredOrders.length} DE {orders.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Administración de pedidos estándar, taller custom, canales de venta y fechas
                  </p>
                </div>

                <button
                  onClick={handleOpenAddOrder}
                  className="bg-brand-yellow text-black px-4 py-2 text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> NUEVO PEDIDO
                </button>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA & FILTROS DE PEDIDOS */}
              <div className="bg-slate-950 p-4 border border-slate-800 space-y-4">
                
                {/* SEARCH INPUT FOR ORDERS */}
                <div className="relative max-w-xl">
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Buscar pedido por ID, cliente, email, artículos, destino o transportista..."
                    className="w-full bg-slate-900 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow pr-10"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>

                {/* FILTROS POR FECHA DE INICIO Y FIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 p-3 border border-slate-800/80">
                  <div>
                    <label className="text-[10px] font-black uppercase text-brand-yellow mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> FECHA INICIO (DESDE):
                    </label>
                    <input
                      type="date"
                      value={orderStartDateFilter}
                      onChange={(e) => setOrderStartDateFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-yellow"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-brand-cyan mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> FECHA FIN (HASTA):
                    </label>
                    <input
                      type="date"
                      value={orderEndDateFilter}
                      onChange={(e) => setOrderEndDateFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-brand-cyan"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      CANAL DE VENTA:
                    </label>
                    <select
                      value={orderSalesChannelFilter}
                      onChange={(e) => setOrderSalesChannelFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs text-slate-100 font-bold focus:outline-none uppercase cursor-pointer"
                    >
                      <option value="TODOS">TODOS LOS CANALES</option>
                      <option value="TIENDA_WEB">🌐 TIENDA WEB</option>
                      <option value="VENTA_FISICA">🏪 VENTA FÍSICA (LOCAL)</option>
                      <option value="REDES_SOCIALES">📲 REDES SOCIALES</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      MODALIDAD DE ENTREGA:
                    </label>
                    <select
                      value={orderShippingFilter}
                      onChange={(e) => setOrderShippingFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 p-1.5 text-xs text-slate-100 font-bold focus:outline-none uppercase cursor-pointer"
                    >
                      <option value="TODOS">TODAS LAS MODALIDADES</option>
                      <option value="CON_ENVIO">🚚 CON ENVÍO A DOMICILIO</option>
                      <option value="RETIRO_LOCAL">📍 RETIRO EN LOCAL</option>
                    </select>
                  </div>
                </div>

                {/* STATUS & TYPE FILTERS */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {/* STATUS FILTER BUTTONS */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      ESTADO DEL PEDIDO:
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {['TODOS', 'PENDIENTE', 'EN_CONFECCION', 'ENVIADO', 'ENTREGADO'].map((status) => {
                        const isSelected = orderStatusFilter === status;
                        const count = status === 'TODOS' ? orders.length : orders.filter((o) => o.status === status).length;
                        return (
                          <button
                            key={status}
                            onClick={() => setOrderStatusFilter(status)}
                            className={`px-2.5 py-1 text-[11px] font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-brand-cyan text-black border-cyan-400 font-black shadow-md'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {status === 'TODOS' ? 'TODOS' : status.replace('_', ' ')} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TYPE FILTER BUTTONS */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      TIPO DE ORDEN:
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'TODOS', label: 'TODAS' },
                        { id: 'CUSTOM', label: '✨ TALLER CUSTOM' },
                        { id: 'ESTANDAR', label: '🛒 COMPRA ESTÁNDAR' },
                      ].map((type) => {
                        const isSelected = orderTypeFilter === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setOrderTypeFilter(type.id as any)}
                            className={`px-2.5 py-1 text-[11px] font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-brand-pink text-white border-pink-400 font-black shadow-md'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* ORDERS TABLE WITH EXTENDED ATTRIBUTES */}
              <div className="overflow-x-auto border border-slate-800">
                <table className="w-full text-left text-xs font-semibold text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
                    <tr>
                      <th className="p-3">ID / TIPO</th>
                      <th className="p-3">CLIENTE</th>
                      <th className="p-3">FECHA INICIO - FIN</th>
                      <th className="p-3">CANAL & PAGO</th>
                      <th className="p-3">ENVÍO & DESTINO</th>
                      <th className="p-3">ITEMS / RESUMEN</th>
                      <th className="p-3">TOTAL ($ ARS)</th>
                      <th className="p-3">ESTADO ACTUAL</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                          No se encontraron pedidos con los filtros o fechas seleccionadas.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-black text-brand-cyan">
                          #{order.id}
                          {order.isCustomOrder ? (
                            <span className="block text-[9px] font-black text-brand-pink">✨ TALLER CUSTOM</span>
                          ) : (
                            <span className="block text-[9px] font-semibold text-slate-400">🛒 ESTÁNDAR</span>
                          )}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-100">{order.customerName}</p>
                          <p className="text-[10px] text-slate-400">{order.customerEmail}</p>
                        </td>
                        <td className="p-3">
                          <span className="block text-slate-200 font-bold text-[11px]">In: {order.date}</span>
                          {order.estimatedDeliveryDate ? (
                            <span className="block text-brand-yellow text-[10px] font-bold">Fin: {order.estimatedDeliveryDate}</span>
                          ) : (
                            <span className="block text-slate-500 text-[10px]">Fin: Sin definir</span>
                          )}
                        </td>
                        <td className="p-3 space-y-1">
                          {getSalesChannelBadge(order.salesChannel)}
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${order.paymentStatus === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                            {order.paymentStatus || 'PAGADO'} • {order.paymentMethod || 'MP'}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          {order.hasShipping ? (
                            <div>
                              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> {order.carrier || 'Envío a domicilio'}
                              </span>
                              <p className="text-[10px] text-slate-300 truncate" title={order.shippingDestination || order.shippingAddress}>
                                📍 {order.shippingDestination || order.shippingAddress || 'Domicilio'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <Store className="w-3 h-3" /> Retiro en tienda
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-300 font-medium" title={order.itemsSummary}>
                          {order.itemsSummary}
                        </td>
                        <td className="p-3 font-black text-emerald-400">${order.total.toLocaleString()} ARS</td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`px-2 py-1 text-[11px] rounded cursor-pointer ${getStatusBadge(order.status)}`}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="EN_CONFECCION">EN CONFECCIÓN</option>
                            <option value="ENVIADO">ENVIADO</option>
                            <option value="ENTREGADO">ENTREGADO</option>
                          </select>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditOrder(order)}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors rounded border border-blue-500/40 cursor-pointer"
                            title="Editar pedido"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded border border-red-500/40 cursor-pointer"
                            title="Eliminar orden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTARIO DE PRODUCTOS (FULL CRUD CON EXTENDED ATTRS & BARRA BÚSQUEDA) */}
          {activeTab === 'inventory' && (
            <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6 animate-in fade-in">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-brand-pink font-display flex items-center gap-2">
                    <Package className="w-5 h-5" /> INVENTARIO DE PRODUCTOS ({filteredInventory.length} DE {products.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Control de stock, códigos SKU, precios de costo y márgenes de venta
                  </p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-brand-yellow text-black px-4 py-2 text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR PRODUCTO
                </button>
              </div>

              {/* SEARCH BAR & TABULATED FILTERS BAR */}
              <div className="space-y-4">
                <div className="relative max-w-xl">
                  <input
                    type="text"
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre, SKU, material, categoría o estilo..."
                    className="w-full bg-slate-950 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-pink pr-10"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>

                {/* INVENTORY TABULATED FILTERS BAR */}
                <div className="bg-slate-950 p-4 border border-slate-800 space-y-3">
                  {/* CANAL DE VENTA / DISPONIBILIDAD FILTER */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      FILTRAR POR DISPONIBILIDAD DE CANAL:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'TODOS', label: 'TODOS LOS CANALES' },
                        { id: 'AMBOS', label: '🌐 WEB Y LOCAL FÍSICO' },
                        { id: 'SOLO_WEB', label: '🛒 SOLO WEB' },
                        { id: 'SOLO_LOCAL', label: '🏪 SOLO LOCAL FÍSICO' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setInventorySalesChannelFilter(ch.id)}
                          className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                            inventorySalesChannelFilter === ch.id
                              ? 'bg-brand-pink text-white border-pink-400 font-black'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CATEGORY FILTER BUTTONS */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      FILTRAR POR CATEGORÍA:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setInventoryCategoryFilter('TODAS')}
                        className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                          inventoryCategoryFilter === 'TODAS'
                            ? 'bg-brand-yellow text-black border-yellow-400 font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        TODAS ({products.length})
                      </button>
                      {categories.map((cat) => {
                        const isSelected = inventoryCategoryFilter === cat.name;
                        const count = products.filter((p) => p.category === cat.name).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setInventoryCategoryFilter(cat.name)}
                            className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-brand-yellow text-black border-yellow-400 font-black'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {cat.name} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* VIBE / STYLE FILTER BUTTONS */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      FILTRAR POR ESTILO:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setInventoryVibeFilter('TODAS')}
                        className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                          inventoryVibeFilter === 'TODAS'
                            ? 'bg-brand-purple text-white border-purple-400 font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        TODOS LOS ESTILOS
                      </button>
                      {vibes.map((vibe) => {
                        const isSelected = inventoryVibeFilter === vibe.name;
                        const count = products.filter((p) => p.vibe.includes(vibe.name)).length;
                        return (
                          <button
                            key={vibe.id}
                            onClick={() => setInventoryVibeFilter(vibe.name)}
                            className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-brand-purple text-white border-purple-400 font-black'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            #{vibe.name} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STOCK LEVEL FILTER BUTTONS */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      FILTRAR POR NIVEL DE STOCK:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'TODOS', label: 'TODOS LOS NIVELES' },
                        { id: 'LOW', label: '⚠️ REPOSICIÓN REQUERIDA (<= 10 UNIDADES)' },
                        { id: 'NORMAL', label: '✓ EN STOCK DISPONIBLE (> 10 UNIDADES)' },
                      ].map((st) => {
                        const isSelected = inventoryStockFilter === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setInventoryStockFilter(st.id as any)}
                            className={`px-3 py-1.5 text-xs font-black uppercase border transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-amber-400 text-black border-amber-400 font-black'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCT TABLE WITH EXTENDED ATTRS */}
              <div className="overflow-x-auto border border-slate-800">
                <table className="w-full text-left text-xs font-semibold text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
                    <tr>
                      <th className="p-3">SKU / CÓDIGO</th>
                      <th className="p-3">IMAGEN</th>
                      <th className="p-3">NOMBRE & MATERIAL</th>
                      <th className="p-3">CATEGORÍA & ESTILOS</th>
                      <th className="p-3">CANAL / ALTA</th>
                      <th className="p-3">PRECIO PÚBLICO / COSTO</th>
                      <th className="p-3">STOCK</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          No se encontraron productos con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-mono text-brand-yellow font-bold text-[11px]">
                          {product.sku || `BTC-${product.id.slice(-4).toUpperCase()}`}
                        </td>
                        <td className="p-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover border border-slate-700" />
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-100">{product.name}</p>
                          {product.material && (
                            <span className="text-[10px] font-semibold text-slate-400">🧵 {product.material}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-brand-cyan font-bold block">{product.category}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {product.vibe.map((v) => (
                              <span key={v} className="bg-slate-800 text-[9px] font-extrabold text-slate-300 px-1.5 py-0.5 border border-slate-700">
                                #{v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 border border-slate-700 inline-block">
                            {product.salesChannel === 'SOLO_WEB' ? '🛒 SOLO WEB' : product.salesChannel === 'SOLO_LOCAL' ? '🏪 SOLO LOCAL' : '🌐 WEB Y LOCAL'}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                            Alta: {product.dateAdded || '01/01/2026'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-black text-emerald-400 block text-xs">${product.price.toFixed(2)} ARS</span>
                          {product.costPrice ? (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Costo: ${product.costPrice.toFixed(2)} (Margen: {Math.round(((product.price - product.costPrice) / product.price) * 100)}%)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold">Sin costo registrado</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${product.stock <= 10 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                            {product.stock} UNIDADES
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors rounded border border-blue-500/40 cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(product)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded border border-red-500/40 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: CLIENTES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'customers' && (
            <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-emerald-400 font-display flex items-center gap-2">
                    <Users className="w-5 h-5" /> REGISTRO Y GESTIÓN DE CLIENTES ({filteredCustomers.length} DE {customers.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Listado de usuarios registrados, historial de pedidos y puntos de fidelidad acumulados
                  </p>
                </div>

                <button
                  onClick={handleOpenAddCustomer}
                  className="bg-emerald-400 text-black px-4 py-2 text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> REGISTRAR CLIENTE
                </button>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA CLIENTES */}
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, email, rol o ID..."
                  className="w-full bg-slate-950 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-400 pr-10"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              <div className="overflow-x-auto border border-slate-800">
                <table className="w-full text-left text-xs font-semibold text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
                    <tr>
                      <th className="p-3">NOMBRE</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">TIPO / ROL</th>
                      <th className="p-3">PEDIDOS REALIZADOS</th>
                      <th className="p-3">TOTAL GASTADO ($ ARS)</th>
                      <th className="p-3">PUNTOS ACUMULADOS</th>
                      <th className="p-3">FECHA REGISTRO</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          No se encontraron clientes con la búsqueda especificada.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-100">{user.name}</td>
                        <td className="p-3 text-slate-300">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${user.role.includes('VIP') ? 'bg-brand-purple text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-200">{user.ordersCount} pedidos</td>
                        <td className="p-3 font-black text-emerald-400">${user.totalSpent.toLocaleString()} ARS</td>
                        <td className="p-3 font-black text-brand-yellow">{user.points} PTS</td>
                        <td className="p-3 text-slate-400">{user.joinedDate}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditCustomer(user)}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors rounded border border-blue-500/40 cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(user.id)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded border border-red-500/40 cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GASTOS Y PROVEEDORES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'expenses' && (
            <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-amber-400 font-display flex items-center gap-2">
                    <Receipt className="w-5 h-5" /> COMPRAS A PROVEEDORES Y GASTOS OPERATIVOS ({filteredExpenses.length} DE {expenses.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Registro de compras de materias primas, insumos, packaging y gastos operativos
                  </p>
                </div>

                <button
                  onClick={handleOpenAddExpense}
                  className="bg-amber-400 text-black px-4 py-2 text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> REGISTRAR GASTO
                </button>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA GASTOS */}
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  placeholder="Buscar gasto por proveedor, categoría, descripción o forma de pago..."
                  className="w-full bg-slate-950 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400 pr-10"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              <div className="overflow-x-auto border border-slate-800">
                <table className="w-full text-left text-xs font-semibold text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-black border-b border-slate-800">
                    <tr>
                      <th className="p-3">ID GASTO</th>
                      <th className="p-3">PROVEEDOR</th>
                      <th className="p-3">CATEGORÍA</th>
                      <th className="p-3">CONCEPTO / DESCRIPCIÓN</th>
                      <th className="p-3">FORMA DE PAGO</th>
                      <th className="p-3">MONTO ($ ARS)</th>
                      <th className="p-3">FECHA</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          No se encontraron gastos con el término de búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-amber-400">#{expense.id}</td>
                        <td className="p-3 font-bold text-slate-100">{expense.supplier}</td>
                        <td className="p-3">
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-300">{expense.description}</td>
                        <td className="p-3 text-slate-400">{expense.paymentMethod}</td>
                        <td className="p-3 font-black text-amber-400">${expense.amount.toLocaleString()} ARS</td>
                        <td className="p-3 text-slate-400">{expense.date}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditExpense(expense)}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors rounded border border-blue-500/40 cursor-pointer"
                            title="Editar gasto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded border border-red-500/40 cursor-pointer"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PREMIOS Y CUPONES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'rewards' && (
            <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase text-brand-purple font-display flex items-center gap-2">
                    <Award className="w-5 h-5" /> CATÁLOGO DE PREMIOS Y RECOMPENSAS ({filteredRewards.length} DE {adminRewards.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Administración de premios canjeables por puntos de clientes
                  </p>
                </div>

                <button
                  onClick={handleOpenAddReward}
                  className="bg-brand-purple text-white px-4 py-2 text-xs font-black uppercase hover:bg-brand-pink transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> CREAR PREMIO
                </button>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA PREMIOS */}
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={rewardSearchQuery}
                  onChange={(e) => setRewardSearchQuery(e.target.value)}
                  placeholder="Buscar premio por título, código prefijo, categoría o descuento..."
                  className="w-full bg-slate-950 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-purple pr-10"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              {filteredRewards.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold border border-slate-800">
                  No se encontraron premios con los filtros especificados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRewards.map((reward) => (
                    <div key={reward.id} className="border border-slate-800 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={reward.image} alt={reward.title} className="w-12 h-12 object-cover border border-slate-700" />
                        <div>
                          <span className="text-[10px] font-bold text-brand-yellow uppercase bg-slate-900 px-2 py-0.5 border border-slate-700">
                            {reward.category}
                          </span>
                          <h4 className="text-xs font-black text-slate-100 uppercase mt-1 leading-tight">{reward.title}</h4>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2">{reward.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold">
                        <span className="text-emerald-400 font-black">{reward.discountValue}</span>
                        <span className="text-brand-yellow font-black">{reward.pointsCost} PTS</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditReward(reward)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CATEGORÍAS & ESTILOS (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* BARRA DE BÚSQUEDA DEDICADA CATEGORÍAS Y ESTILOS */}
              <div className="bg-slate-900 p-4 border-2 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-100 font-display">
                    ADMINISTRADOR DE ETIQUETAS, CATEGORÍAS Y ESTILOS
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Búsqueda y gestión en tiempo real para la taxonomía de la tienda
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Filtrar categorías o estilos..."
                    className="w-full bg-slate-950 border-2 border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-brand-yellow pr-10"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CATEGORIES MANAGEMENT */}
                <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-black uppercase text-brand-yellow font-display flex items-center gap-2">
                      <Tag className="w-5 h-5" /> CATEGORÍAS ({filteredCategories.length} DE {categories.length})
                    </h3>
                    <button
                      onClick={handleOpenAddCategory}
                      className="bg-brand-yellow text-black px-2.5 py-1 text-xs font-black uppercase hover:bg-white cursor-pointer"
                    >
                      + NUEVA
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredCategories.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold p-4 text-center">No se encontraron categorías.</p>
                    ) : (
                      filteredCategories.map((cat) => (
                        <div key={cat.id} className="border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-100 text-xs">{cat.name}</span>
                            {cat.basePrice && <span className="block text-[10px] text-slate-400">Base: ${cat.basePrice}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEditCategory(cat)} className="text-blue-400 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                            <button onClick={() => handleDeleteCategoryClick(cat)} className="text-red-400 hover:underline text-xs font-bold cursor-pointer">Borrar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* VIBES / STYLES MANAGEMENT */}
                <div className="border-2 border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-black uppercase text-brand-cyan font-display flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> ESTILOS ({filteredVibes.length} DE {vibes.length})
                    </h3>
                    <button
                      onClick={handleOpenAddVibe}
                      className="bg-brand-cyan text-black px-2.5 py-1 text-xs font-black uppercase hover:bg-white cursor-pointer"
                    >
                      + NUEVO
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredVibes.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold p-4 text-center">No se encontraron estilos.</p>
                    ) : (
                      filteredVibes.map((vibe) => (
                        <div key={vibe.id} className="border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                          <span className="font-bold text-slate-100 text-xs">#{vibe.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEditVibe(vibe)} className="text-blue-400 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                            <button onClick={() => handleDeleteVibeClick(vibe)} className="text-red-400 hover:underline text-xs font-bold cursor-pointer">Borrar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* MINIMAL CLEAN ADMIN FOOTER */}
      <footer className="border-t border-slate-800 bg-black py-3 px-6 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
        BUTTONCAT PANEL DE CONTROL © 2026
      </footer>

      {/* FULL CRUD MODALS */}
      <AddOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        orderToEdit={editingOrder}
      />

      <AddEditCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={editingCustomer}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={editingExpense}
      />

      <AddRewardAdminModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSave={handleSaveReward}
        rewardToEdit={editingReward}
      />

      <AddEditProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={editingCategory}
      />

      <AddEditStyleModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        onSave={handleSaveVibe}
        styleToEdit={editingVibe}
      />

    </div>
  );
};
