import React, { useState } from 'react';
import { Package, ShoppingBag, DollarSign, Search, Plus, Edit, Trash2, Tag, TrendingUp, BarChart3, PieChart, Users, AlertTriangle, LogOut, Award, Receipt, Sparkles, Calendar, Store, Globe, Smartphone, LayoutGrid, List, Eye, X, Printer, Sun, Moon, MapPin, Phone, FileText, Wrench, Clock, Truck, CheckCircle2, RotateCcw, XCircle, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus, CategoryItem, VibeItem, BadgeItem, User, RewardItem, ProductVariationGroup, ProductVariationOption, CustomerAddress } from '../types/types';
import { handleProductImageError, calculateTotalProductStock, getOptionLabel, getProductStockStatus, getOptionStock, getOptionPriceDelta, getDefaultVariationsForCategory } from '../types/types';
import { MOCK_REWARDS } from '../data/mockRewards';
import { AddEditProductModal } from '../components/admin/AddEditProductModal';
import { AddCategoryModal } from '../components/admin/AddCategoryModal';
import { AddEditStyleModal } from '../components/admin/AddEditStyleModal';
import { AddEditBadgeModal } from '../components/admin/AddEditBadgeModal';
import { AddOrderModal } from '../components/admin/AddOrderModal';
import { AddExpenseModal, type AdminExpense } from '../components/admin/AddExpenseModal';
import { AddRewardAdminModal } from '../components/admin/AddRewardAdminModal';
import { AddEditCustomerModal, type AdminCustomer } from '../components/admin/AddEditCustomerModal';
import { AdminCustomProductsManager } from '../components/admin/AdminCustomProductsManager';

const splitTopLevelItems = (str: string): string[] => {
  if (!str) return [];
  const result: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      if (depth > 0) depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
};

interface AdminDashboardPageProps {
  products: Product[];
  categories: CategoryItem[];
  vibes: VibeItem[];
  tags?: BadgeItem[];
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
  // Tag CRUD
  onAddTag?: (tag: BadgeItem) => void;
  onEditTag?: (tag: BadgeItem) => void;
  onDeleteTag?: (tagId: string) => void;
  // Shared Order Management Props (Real-time sync with Client)
  orders?: AdminOrder[];
  onSaveOrder?: (order: AdminOrder) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  products,
  categories,
  vibes,
  tags = [],
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
  onAddTag,
  onEditTag,
  onDeleteTag,
  orders: ordersProp,
  onSaveOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'inventory' | 'customizer' | 'categories' | 'vibes' | 'customers' | 'expenses' | 'rewards'>('analytics');
  const [isAdminDarkMode, setIsAdminDarkMode] = useState<boolean>(false);

  // VIEW FORMAT MODE STATES (PREDETERMINADO: TABLA)
  const [ordersViewMode, setOrdersViewMode] = useState<'grid' | 'table'>('table');
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'table'>('table');
  const [customersViewMode, setCustomersViewMode] = useState<'grid' | 'table'>('table');
  const [expensesViewMode, setExpensesViewMode] = useState<'grid' | 'table'>('table');

  // DETAIL OVERLAY MODAL STATES
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<AdminCustomer | null>(null);
  const [detailExpense, setDetailExpense] = useState<AdminExpense | null>(null);

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

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BadgeItem | null>(null);

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
  const [showAdvancedOrderFilters, setShowAdvancedOrderFilters] = useState<boolean>(false);

  // ADVANCED INVENTORY FILTERS
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('TODAS');
  const [inventoryVibeFilter, setInventoryVibeFilter] = useState<string>('TODAS');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'TODOS' | 'UNIQUE' | 'OUT_OF_STOCK' | 'PARTIAL' | 'NORMAL'>('TODOS');
  const [inventorySalesChannelFilter, setInventorySalesChannelFilter] = useState<string>('TODOS');
  const [showAdvancedInventoryFilters, setShowAdvancedInventoryFilters] = useState<boolean>(false);

  // Mock Admin Orders List with enriched attributes
  const [localOrders, setLocalOrders] = useState<AdminOrder[]>([
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
      subtotal: 8400,
      discountAmount: 0,
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
      subtotal: 18000,
      discountAmount: 2400,
      appliedCouponCode: 'PROMO-PACK',
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
      subtotal: 3500,
      discountAmount: 0,
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

  const orders = ordersProp || localOrders;

  // Mock Customers List
  const [customers, setCustomers] = useState<AdminCustomer[]>([
    { id: 'usr-1', name: 'Juan Borlini', email: 'juan.borlini@email.com', role: 'CLIENTE', ordersCount: 5, totalSpent: 45000, points: 450, joinedDate: '2024-03-15' },
    { id: 'usr-2', name: 'Luna Lovecraft', email: 'luna@buttoncat.com', role: 'CLIENTE', ordersCount: 3, totalSpent: 28500, points: 285, joinedDate: '2025-01-10' },
    { id: 'usr-3', name: 'Santiago Rossi', email: 'santi@gmail.com', role: 'CLIENTE', ordersCount: 2, totalSpent: 16800, points: 168, joinedDate: '2025-06-20' },
    { id: 'usr-4', name: 'Valeria Gomez', email: 'valeria@hotmail.com', role: 'CLIENTE', ordersCount: 8, totalSpent: 82000, points: 820, joinedDate: '2024-08-04' },
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
    if (onSaveOrder) {
      onSaveOrder(orderData);
    }
    setLocalOrders((prev) => {
      const exists = prev.some((o) => o.id === orderData.id);
      if (exists) return prev.map((o) => (o.id === orderData.id ? orderData : o));
      return [orderData, ...prev];
    });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido #${orderId}?`)) {
      if (onDeleteOrder) {
        onDeleteOrder(orderId);
      }
      setLocalOrders((prev) => prev.filter((o) => o.id !== orderId));
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

  // TAG / BADGE CRUD TRIGGERS
  const handleOpenAddTag = () => {
    setEditingTag(null);
    setIsTagModalOpen(true);
  };

  const handleOpenEditTag = (tag: BadgeItem) => {
    setEditingTag(tag);
    setIsTagModalOpen(true);
  };

  const handleSaveTag = (tag: BadgeItem) => {
    if (editingTag) {
      onEditTag && onEditTag(tag);
    } else {
      onAddTag && onAddTag(tag);
    }
  };

  const handleDeleteTagClick = (tag: BadgeItem) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la etiqueta "${tag.name}"?`)) {
      onDeleteTag && onDeleteTag(tag.id);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    if (isAdminDarkMode) {
      switch (status) {
        case 'PENDIENTE':
          return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
        case 'EN_CONFECCION':
          return 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold';
        case 'ENVIADO':
          return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold';
        case 'ENTREGADO':
          return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
      }
    } else {
      switch (status) {
        case 'PENDIENTE':
          return 'bg-amber-50 text-amber-800 border border-amber-300 font-bold';
        case 'EN_CONFECCION':
          return 'bg-purple-50 text-purple-800 border border-purple-300 font-bold';
        case 'ENVIADO':
          return 'bg-blue-50 text-blue-800 border border-blue-300 font-bold';
        case 'ENTREGADO':
          return 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold';
      }
    }
  };

  // ORDER FILTER HELPERS
  const isOrderFiltered =
    orderSearchQuery.trim() !== '' ||
    orderStatusFilter !== 'TODOS' ||
    orderTypeFilter !== 'TODOS' ||
    orderSalesChannelFilter !== 'TODOS' ||
    orderShippingFilter !== 'TODOS' ||
    orderStartDateFilter !== '' ||
    orderEndDateFilter !== '';

  const activeOrderFiltersCount =
    (orderSearchQuery.trim() !== '' ? 1 : 0) +
    (orderStatusFilter !== 'TODOS' ? 1 : 0) +
    (orderTypeFilter !== 'TODOS' ? 1 : 0) +
    (orderSalesChannelFilter !== 'TODOS' ? 1 : 0) +
    (orderShippingFilter !== 'TODOS' ? 1 : 0) +
    (orderStartDateFilter !== '' ? 1 : 0) +
    (orderEndDateFilter !== '' ? 1 : 0);

  const handleResetOrderFilters = () => {
    setOrderSearchQuery('');
    setOrderStatusFilter('TODOS');
    setOrderTypeFilter('TODOS');
    setOrderSalesChannelFilter('TODOS');
    setOrderShippingFilter('TODOS');
    setOrderStartDateFilter('');
    setOrderEndDateFilter('');
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

  // INVENTORY FILTER HELPERS
  const isInventoryFiltered =
    inventorySearchQuery.trim() !== '' ||
    inventoryCategoryFilter !== 'TODAS' ||
    inventoryVibeFilter !== 'TODAS' ||
    inventoryStockFilter !== 'TODOS' ||
    inventorySalesChannelFilter !== 'TODOS';

  const activeInventoryFiltersCount =
    (inventorySearchQuery.trim() !== '' ? 1 : 0) +
    (inventoryCategoryFilter !== 'TODAS' ? 1 : 0) +
    (inventoryVibeFilter !== 'TODAS' ? 1 : 0) +
    (inventoryStockFilter !== 'TODOS' ? 1 : 0) +
    (inventorySalesChannelFilter !== 'TODOS' ? 1 : 0);

  const handleResetInventoryFilters = () => {
    setInventorySearchQuery('');
    setInventoryCategoryFilter('TODAS');
    setInventoryVibeFilter('TODAS');
    setInventoryStockFilter('TODOS');
    setInventorySalesChannelFilter('TODOS');
  };

  const filteredInventory = products.filter((p) => {
    if (inventoryCategoryFilter !== 'TODAS' && p.category !== inventoryCategoryFilter) {
      return false;
    }
    if (inventoryVibeFilter !== 'TODAS' && !p.vibe.includes(inventoryVibeFilter)) {
      return false;
    }
    const stockStatus = getProductStockStatus(p);
    if (inventoryStockFilter === 'UNIQUE' && !p.isUnique && stockStatus.totalStock !== 1) {
      return false;
    }
    if (inventoryStockFilter === 'OUT_OF_STOCK' && !stockStatus.isTotalOutOfStock) {
      return false;
    }
    if (inventoryStockFilter === 'PARTIAL' && !stockStatus.hasOutOfStockVariations) {
      return false;
    }
    if (inventoryStockFilter === 'NORMAL' && (stockStatus.isTotalOutOfStock || stockStatus.hasOutOfStockVariations)) {
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

  const filteredTags = (tags || []).filter((t) => {
    if (!tagSearchQuery.trim()) return true;
    return t.name.toLowerCase().includes(tagSearchQuery.toLowerCase());
  });

  // METRICS & ANALYTICS DYNAMIC CALCULATIONS (MATCHING ALL APP DATA)
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDIENTE' || o.status === 'EN_CONFECCION').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCustomerPoints = customers.reduce((sum, c) => sum + c.points, 0);

  // Sales Channel breakdown calculated directly from orders
  const channelStats = {
    web: {
      count: orders.filter((o) => !o.salesChannel || o.salesChannel === 'TIENDA_WEB').length,
      revenue: orders.filter((o) => !o.salesChannel || o.salesChannel === 'TIENDA_WEB').reduce((sum, o) => sum + o.total, 0)
    },
    social: {
      count: orders.filter((o) => o.salesChannel === 'REDES_SOCIALES').length,
      revenue: orders.filter((o) => o.salesChannel === 'REDES_SOCIALES').reduce((sum, o) => sum + o.total, 0)
    },
    physical: {
      count: orders.filter((o) => o.salesChannel === 'VENTA_FISICA').length,
      revenue: orders.filter((o) => o.salesChannel === 'VENTA_FISICA').reduce((sum, o) => sum + o.total, 0)
    }
  };

  // Top Customers sorted by total spent
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  // Monthly Sales Data for Chart
  const monthlyData = [
    { month: 'ENE', revenue: 18500, completedOrders: 8 },
    { month: 'FEB', revenue: 24200, completedOrders: 11 },
    { month: 'MAR', revenue: 31000, completedOrders: 14 },
    { month: 'ABR', revenue: 29800, completedOrders: 12 },
    { month: 'MAY', revenue: 38400, completedOrders: 16 },
    { month: 'JUN', revenue: 42000, completedOrders: 19 },
    { month: 'JUL', revenue: 46500, completedOrders: 22 },
    { month: 'AGO', revenue: 51200, completedOrders: 24 },
    { month: 'SEP', revenue: totalRevenue, completedOrders: totalOrders },
  ];
  const maxMonthlyRevenue = Math.max(...monthlyData.map((d) => d.revenue));

  // Dynamic Category Stats calculated from active products
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalProductsCount = products.length || 1;
  const categoryStats = Object.keys(categoryCounts).map((catName, idx) => {
    const colors = ['bg-amber-400', 'bg-brand-pink', 'bg-brand-cyan', 'bg-brand-purple', 'bg-emerald-400', 'bg-red-400', 'bg-blue-400'];
    const count = categoryCounts[catName];
    const percent = Math.round((count / totalProductsCount) * 100);
    return {
      name: catName,
      percent,
      count,
      color: colors[idx % colors.length]
    };
  }).sort((a, b) => b.percent - a.percent);

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-200 ${
      isAdminDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-100/80 text-gray-900'
    }`}>
      
      <div>
        {/* CLEAN ELEGANT ADMIN HEADER */}
        <header className={`border-b backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-50 transition-colors duration-200 ${
          isAdminDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200 shadow-xs'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                isAdminDarkMode ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 'bg-gray-900 border-gray-900 text-white'
              }`}>
                BC
              </div>
              <span className={`text-sm sm:text-base font-black tracking-wide font-display ${
                isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                BUTTONCAT <span className={`font-normal text-xs sm:text-sm ${
                  isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>| Panel de Administración</span>
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* THEME TOGGLE BUTTON */}
              <button
                onClick={() => setIsAdminDarkMode(!isAdminDarkMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAdminDarkMode
                    ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 shadow-xs'
                }`}
                title="Cambiar Modo Claro / Modo Oscuro"
              >
                {isAdminDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" /> Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" /> Modo Oscuro
                  </>
                )}
              </button>

              {currentUser && (
                <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                  isAdminDarkMode ? 'bg-slate-800/60 text-slate-300 border-slate-700/60' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  <Users className="w-4 h-4 text-gray-700 dark:text-amber-400" />
                  <span>{currentUser.name}</span>
                </div>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
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
          
          {/* NAVIGATION TABS (NEUTRAL LIGHT & DARK COMPATIBLE) */}
          <div className={`border p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar transition-colors duration-200 ${
            isAdminDarkMode ? 'bg-slate-900/90 border-slate-800 shadow-sm' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <BarChart3 className="w-4 h-4" /> ANALÍTICA Y MÉTRICAS
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> PEDIDOS ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-pink-300 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Package className="w-4 h-4" /> INVENTARIO ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customizer'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Wrench className="w-4 h-4" /> TALLER CUSTOM
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customers'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Users className="w-4 h-4" /> CLIENTES ({customers.length})
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Receipt className="w-4 h-4" /> GASTOS Y PROVEEDORES ({expenses.length})
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'rewards'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Award className="w-4 h-4" /> PREMIOS Y CUPONES ({adminRewards.length})
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'categories'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Tag className="w-4 h-4" /> CATEGORÍAS Y ESTILOS
            </button>
          </div>

          {/* TAB 1: ANALÍTICA & REPORTES DE DATOS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* 5 KPI STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>INGRESOS BRUTOS</span>
                    <DollarSign className={`w-5 h-5 ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-800'}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'
                  }`}>
                    ${totalRevenue.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    isAdminDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>Calculado sobre {totalOrders} pedidos</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>GASTOS TOTALES</span>
                    <Receipt className={`w-5 h-5 ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'
                  }`}>
                    ${totalExpenses.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>Insumos y proveedores</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>GANANCIA NETA</span>
                    <TrendingUp className={`w-5 h-5 ${isAdminDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    ${netProfit.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    isAdminDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>Margen operativo: {profitMargin}%</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>VALOR INVENTARIO</span>
                    <Package className={`w-5 h-5 ${isAdminDarkMode ? 'text-cyan-400' : 'text-gray-800'}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-cyan-400' : 'text-gray-900'
                  }`}>
                    ${totalInventoryValue.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>{products.length} productos registrados</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>ALERTAS DE STOCK</span>
                    <AlertTriangle className={`w-5 h-5 ${isAdminDarkMode ? 'text-pink-400' : 'text-red-600'}`} />
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-pink-400' : 'text-red-600'
                  }`}>
                    {lowStockProducts.length} ITEMS
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>10 o menos unidades</span>
                </div>

              </div>

              {/* FINANCIAL BALANCE & SALES CHANNEL BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* FINANCIAL BALANCE SUMMARY */}
                <div className={`lg:col-span-2 border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <h3 className={`text-base font-black uppercase font-display border-b pb-3 flex items-center justify-between ${
                    isAdminDarkMode ? 'text-amber-400 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    <span>ESTADO DE RESULTADOS & BALANCE OPERATIVO</span>
                    <span className={`text-xs font-mono ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ACTUALIZADO EN TIEMPO REAL</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>TICKET PROMEDIO</span>
                      <div className={`text-xl font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>${avgOrderValue.toLocaleString('es-AR')} ARS</div>
                      <p className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Por orden completada</p>
                    </div>

                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>PEDIDOS EN CURSO</span>
                      <div className={`text-xl font-black ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>{pendingOrdersCount} PEDIDOS</div>
                      <p className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pendiente o confección</p>
                    </div>

                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>PUNTOS EMITIDOS</span>
                      <div className={`text-xl font-black ${isAdminDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>{totalCustomerPoints} PTS</div>
                      <p className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>En cuentas de clientes</p>
                    </div>
                  </div>

                  {/* FINANCIAL TABLE */}
                  <div className={`border p-4 space-y-2 rounded-lg ${
                    isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className={`flex justify-between items-center text-xs font-bold py-1 border-b ${
                      isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                      <span className={isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}>Total Ingresos Brutos (Ventas):</span>
                      <span className={`font-black ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}`}>${totalRevenue.toLocaleString('es-AR')} ARS</span>
                    </div>
                    <div className={`flex justify-between items-center text-xs font-bold py-1 border-b ${
                      isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                      <span className={isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}>(-) Gastos de Insumos y Proveedores:</span>
                      <span className="text-red-600 font-black">-${totalExpenses.toLocaleString('es-AR')} ARS</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm font-black pt-2 text-emerald-700 dark:text-emerald-400">
                      <span>(=) Utilidad Neta Estimada:</span>
                      <span className="text-base sm:text-lg font-black">${netProfit.toLocaleString('es-AR')} ARS</span>
                    </div>
                  </div>
                </div>

                {/* SALES CHANNELS STATS */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <h3 className={`text-base font-black uppercase font-display border-b pb-3 ${
                    isAdminDarkMode ? 'text-cyan-400 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    VENTAS POR CANAL
                  </h3>

                  <div className="space-y-3">
                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> TIENDA WEB</span>
                        <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.web.revenue.toLocaleString('es-AR')} ARS</span>
                      </div>
                      <p className={`text-[10px] font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{channelStats.web.count} pedidos procesados</p>
                    </div>

                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> REDES SOCIALES</span>
                        <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.social.revenue.toLocaleString('es-AR')} ARS</span>
                      </div>
                      <p className={`text-[10px] font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{channelStats.social.count} pedidos procesados</p>
                    </div>

                    <div className={`border p-3 space-y-1 rounded-lg ${
                      isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> LOCAL FÍSICO</span>
                        <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.physical.revenue.toLocaleString('es-AR')} ARS</span>
                      </div>
                      <p className={`text-[10px] font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{channelStats.physical.count} pedidos procesados</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* CHARTS GRID SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* REVENUE TREND VISUAL CHART (2 COLS) */}
                <div className={`lg:col-span-2 border p-6 space-y-6 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <div>
                      <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                        isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-800'}`} /> TENDENCIA DE INGRESOS MENSUALES (2026)
                      </h3>
                      <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Facturación bruta por mes en pesos argentinos
                      </p>
                    </div>
                  </div>

                  {/* VISUAL BAR CHART WITH RESPONSIVE OVERFLOW FOR MOBILE */}
                  <div className="overflow-x-auto no-scrollbar pb-2">
                    <div className={`h-64 flex items-end justify-between gap-1.5 sm:gap-3 pt-10 pb-2 px-1 sm:px-2 border-b min-w-[480px] sm:min-w-0 ${
                      isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                      {monthlyData.map((item) => {
                        const heightPercent = Math.round((item.revenue / maxMonthlyRevenue) * 100);
                        return (
                          <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end relative">
                            
                            {/* REVENUE AMOUNT DISPLAYED ABOVE THE BAR */}
                            <span className={`text-[9px] sm:text-[10px] font-bold mb-1 whitespace-nowrap ${
                              isAdminDarkMode ? 'text-cyan-400' : 'text-gray-700'
                            }`}>
                              ${(item.revenue / 1000).toFixed(1)}k
                            </span>

                            {/* BAR */}
                            <div
                              className={`w-full transition-all rounded-t-xs relative ${
                                isAdminDarkMode
                                  ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                                  : 'bg-gray-800 hover:bg-gray-900 border border-gray-700'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border shadow-lg z-20 ${
                                isAdminDarkMode ? 'bg-black text-slate-100 border-slate-700' : 'bg-gray-900 text-white border-gray-800'
                              }`}>
                                {item.completedOrders} pedidos (${item.revenue.toLocaleString()} ARS)
                              </div>
                            </div>

                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                              isAdminDarkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs font-bold pt-1 ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    <span>Promedio por orden: ${avgOrderValue.toLocaleString('es-AR')} ARS</span>
                    <span className={`font-black ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}`}>Pico máximo: Agosto ($51.200 ARS)</span>
                  </div>
                </div>

                {/* CATEGORY DISTRIBUTION CHART (1 COL) */}
                <div className={`border p-6 space-y-6 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`border-b pb-3 ${isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                      isAdminDarkMode ? 'text-cyan-400' : 'text-gray-900'
                    }`}>
                      <PieChart className={`w-5 h-5 ${isAdminDarkMode ? 'text-cyan-400' : 'text-gray-800'}`} /> DISTRIBUCIÓN DE CATÁLOGO
                    </h3>
                    <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Porcentaje de artículos por categoría
                    </p>
                  </div>

                  <div className="space-y-4">
                    {categoryStats.map((cat) => (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black uppercase">
                          <span className={isAdminDarkMode ? 'text-slate-200' : 'text-gray-800'}>{cat.name} ({cat.count})</span>
                          <span className={isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}>{cat.percent}%</span>
                        </div>
                        <div className={`w-full h-2.5 p-0.5 rounded ${
                          isAdminDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-100 border border-gray-200'
                        }`}>
                          <div
                            className={`h-full ${cat.color} transition-all duration-500 rounded-xs`}
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`border-t pt-3 text-xs font-semibold ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-500'
                  }`}>
                    Total de productos activos en inventario: {products.length}
                  </div>
                </div>

              </div>

              {/* TOP SELLING PRODUCTS, INVENTORY ALERTS & VIP CUSTOMERS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* TOP PRODUCTS */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <h3 className={`text-base font-black uppercase font-display border-b pb-3 ${
                    isAdminDarkMode ? 'text-slate-100 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    TOP 5 PRODUCTOS MÁS VENDIDOS
                  </h3>

                  <div className="space-y-2.5">
                    {products.slice(0, 5).map((prod, idx) => (
                      <div key={prod.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded font-black text-xs flex items-center justify-center ${
                            isAdminDarkMode ? 'bg-amber-400 text-black' : 'bg-gray-900 text-white'
                          }`}>
                            #{idx + 1}
                          </span>
                          <img src={prod.image} alt={prod.name} onError={handleProductImageError} className="w-9 h-9 object-cover rounded border border-gray-300 dark:border-slate-800" />
                          <div>
                            <h4 className={`text-xs font-black uppercase ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{prod.name}</h4>
                            <span className={`text-[10px] font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{prod.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black block ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}`}>${(prod.price * 15).toFixed(0)} ARS</span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">15 un. vendidas</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LOW STOCK WARNINGS */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 border-b pb-3 ${
                    isAdminDarkMode ? 'text-amber-400 border-slate-800' : 'text-amber-800 border-gray-200'
                  }`}>
                    <AlertTriangle className="w-5 h-5 text-amber-600" /> REPOSICIÓN DE STOCK
                  </h3>

                  {lowStockProducts.length === 0 ? (
                    <p className={`text-xs font-semibold py-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Todo el inventario tiene niveles óptimos de stock.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {lowStockProducts.map((prod) => (
                        <div key={prod.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                          isAdminDarkMode ? 'border-amber-500/40 bg-amber-950/20' : 'border-amber-200 bg-amber-50/50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <img src={prod.image} alt={prod.name} onError={handleProductImageError} className="w-9 h-9 object-cover rounded border border-gray-300 dark:border-slate-800" />
                            <div>
                              <h4 className={`text-xs font-black uppercase ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{prod.name}</h4>
                              <span className={`text-[10px] font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{prod.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-black px-2 py-0.5 border rounded-md block ${
                              isAdminDarkMode ? 'text-amber-400 bg-amber-400/10 border-amber-500' : 'text-amber-900 bg-amber-100 border-amber-300'
                            }`}>
                              QUEDAN {prod.stock} UN.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TOP VIP CUSTOMERS */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 border-b pb-3 ${
                    isAdminDarkMode ? 'text-purple-400 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    <Users className={`w-5 h-5 ${isAdminDarkMode ? 'text-purple-400' : 'text-gray-800'}`} /> MEJORES CLIENTES (TOP FACTURACIÓN)
                  </h3>

                  <div className="space-y-2.5">
                    {topCustomers.map((cust) => (
                      <div key={cust.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-black uppercase ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{cust.name}</h4>
                            <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded">{cust.role}</span>
                          </div>
                          <span className={`text-[10px] font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{cust.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">${cust.totalSpent.toLocaleString('es-AR')} ARS</span>
                          <span className={`text-[10px] font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{cust.ordersCount} pedidos ({cust.points} pts)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PEDIDOS Y ÓRDENES (FULL CRUD CON NUEVOS ATRIBUTOS & BARRA DE BÚSQUEDA) */}
          {activeTab === 'orders' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-cyan-400' : 'text-gray-900'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${isAdminDarkMode ? 'text-cyan-400' : 'text-gray-800'}`} /> GESTIÓN DE PEDIDOS ({filteredOrders.length} DE {orders.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Administración de pedidos estándar, taller custom, canales de venta y entregas
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* VIEW FORMAT SWITCHER */}
                  <div className={`flex items-center p-1 rounded-lg border ${
                    isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <button
                      onClick={() => setOrdersViewMode('grid')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        ordersViewMode === 'grid'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Fichas / Tarjetas"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Fichas
                    </button>
                    <button
                      onClick={() => setOrdersViewMode('table')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        ordersViewMode === 'table'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Tabla Compacta"
                    >
                      <List className="w-3.5 h-3.5" /> Tabla
                    </button>
                  </div>

                  <button
                    onClick={handleOpenAddOrder}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> NUEVO PEDIDO
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA & FILTROS INTUITIVOS DE PEDIDOS */}
              <div className={`p-4 sm:p-5 border rounded-2xl space-y-4 shadow-xs transition-all ${
                isAdminDarkMode ? 'bg-slate-950 border-slate-800/90' : 'bg-gray-50/90 border-gray-200'
              }`}>
                
                {/* SEARCH INPUT & TOOLBAR ACTIONS */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  
                  {/* SEARCH BAR */}
                  <div className="relative flex-1">
                    <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Buscar pedido por ID, cliente, email, artículos, destino o transportista..."
                      className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none border transition-all ${
                        isAdminDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-slate-700'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                      }`}
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className={`absolute right-3 top-2.5 p-0.5 rounded-full transition-colors cursor-pointer ${
                          isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                        title="Borrar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* ACTION BUTTONS: ADVANCED FILTERS TOGGLE & RESET */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowAdvancedOrderFilters(!showAdvancedOrderFilters)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                        showAdvancedOrderFilters || activeOrderFiltersCount > 0
                          ? (isAdminDarkMode ? 'bg-slate-800 text-amber-300 border-amber-500/40 shadow-xs' : 'bg-gray-900 text-white border-gray-900 shadow-xs')
                          : (isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 shadow-xs')
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Filtros Avanzados</span>
                      {activeOrderFiltersCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isAdminDarkMode ? 'bg-amber-400 text-slate-950' : 'bg-amber-300 text-gray-950'
                        }`}>
                          {activeOrderFiltersCount}
                        </span>
                      )}
                      {showAdvancedOrderFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isOrderFiltered && (
                      <button
                        onClick={handleResetOrderFilters}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isAdminDarkMode
                            ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                        title="Limpiar todos los filtros"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Limpiar Filtros</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* STATUS FILTER CHIPS */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      ESTADO DEL PEDIDO:
                    </label>
                    <span className={`text-[10px] font-bold ${
                      isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      Mostrando {filteredOrders.length} de {orders.length} pedidos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'TODOS', label: 'TODOS', icon: ShoppingBag, color: 'bg-slate-500' },
                      { id: 'PENDIENTE', label: 'PENDIENTE', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/40' },
                      { id: 'EN_CONFECCION', label: 'EN CONFECCIÓN', icon: Wrench, color: 'text-purple-400 bg-purple-500/10 border-purple-500/40' },
                      { id: 'ENVIADO', label: 'ENVIADO', icon: Truck, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40' },
                      { id: 'ENTREGADO', label: 'ENTREGADO', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' },
                    ].map((st) => {
                      const isSelected = orderStatusFilter === st.id;
                      const count = st.id === 'TODOS' ? orders.length : orders.filter((o) => o.status === st.id).length;
                      const StatusIcon = st.icon;

                      return (
                        <button
                          key={st.id}
                          onClick={() => setOrderStatusFilter(st.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                            isSelected
                              ? (isAdminDarkMode
                                  ? 'bg-slate-800 text-white border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                                  : 'bg-gray-900 text-white border-gray-900 shadow-md')
                              : (isAdminDarkMode
                                  ? 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 shadow-2xs')
                          }`}
                        >
                          <StatusIcon className={`w-3.5 h-3.5 ${isSelected ? (isAdminDarkMode ? 'text-amber-400' : 'text-white') : 'text-current'}`} />
                          <span>{st.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                            isSelected
                              ? (isAdminDarkMode ? 'bg-amber-400 text-slate-950' : 'bg-gray-700 text-white')
                              : (isAdminDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700')
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ADVANCED COLLAPSIBLE FILTERS PANEL */}
                {(showAdvancedOrderFilters || (isOrderFiltered && (orderTypeFilter !== 'TODOS' || orderSalesChannelFilter !== 'TODOS' || orderShippingFilter !== 'TODOS' || orderStartDateFilter !== '' || orderEndDateFilter !== ''))) && (
                  <div className={`p-4 rounded-xl border space-y-4 animate-in fade-in transition-all ${
                    isAdminDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200 shadow-xs'
                  }`}>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      {/* TIPO DE ORDEN */}
                      <div>
                        <label className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Wrench className="w-3 h-3 text-pink-400" /> TIPO DE ORDEN:
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'TODOS', label: 'Todas' },
                            { id: 'CUSTOM', label: 'Custom' },
                            { id: 'ESTANDAR', label: 'Estándar' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setOrderTypeFilter(t.id as any)}
                              className={`py-1.5 px-2 text-[10px] font-extrabold uppercase rounded-lg border text-center transition-all cursor-pointer ${
                                orderTypeFilter === t.id
                                  ? (isAdminDarkMode ? 'bg-slate-800 text-pink-300 border-pink-500/40 font-black' : 'bg-gray-900 text-white border-gray-900')
                                  : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CANAL DE VENTA */}
                      <div>
                        <label className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Globe className="w-3 h-3 text-cyan-400" /> CANAL DE VENTA:
                        </label>
                        <select
                          value={orderSalesChannelFilter}
                          onChange={(e) => setOrderSalesChannelFilter(e.target.value)}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-slate-700'
                              : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-800'
                          }`}
                        >
                          <option value="TODOS">Todos los Canales</option>
                          <option value="TIENDA_WEB">Tienda Web</option>
                          <option value="VENTA_FISICA">Venta Física (Local)</option>
                          <option value="REDES_SOCIALES">Redes Sociales</option>
                        </select>
                      </div>

                      {/* MODALIDAD DE ENTREGA */}
                      <div>
                        <label className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Truck className="w-3 h-3 text-emerald-400" /> ENTREGA / ENVÍO:
                        </label>
                        <select
                          value={orderShippingFilter}
                          onChange={(e) => setOrderShippingFilter(e.target.value)}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-slate-700'
                              : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-gray-800'
                          }`}
                        >
                          <option value="TODOS">Todas las Modalidades</option>
                          <option value="CON_ENVIO">Con Envío a Domicilio</option>
                          <option value="RETIRO_LOCAL">Retiro en Local</option>
                        </select>
                      </div>

                      {/* RANGO DE FECHAS */}
                      <div>
                        <label className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Calendar className="w-3 h-3 text-amber-400" /> RANGO DE FECHAS:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={orderStartDateFilter}
                            onChange={(e) => setOrderStartDateFilter(e.target.value)}
                            title="Fecha Desde"
                            className={`w-full rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none border ${
                              isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            type="date"
                            value={orderEndDateFilter}
                            onChange={(e) => setOrderEndDateFilter(e.target.value)}
                            title="Fecha Hasta"
                            className={`w-full rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none border ${
                              isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* DISMISSABLE ACTIVE FILTERS BADGES BAR */}
                {isOrderFiltered && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-gray-300 dark:border-slate-800">
                    <span className={`text-[10px] font-black uppercase ${
                      isAdminDarkMode ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      FILTROS APLICADOS:
                    </span>

                    {orderSearchQuery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Búsqueda: "{orderSearchQuery}"
                        <button onClick={() => setOrderSearchQuery('')} className="hover:text-amber-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderStatusFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        Estado: {orderStatusFilter.replace('_', ' ')}
                        <button onClick={() => setOrderStatusFilter('TODOS')} className="hover:text-purple-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderTypeFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30">
                        Tipo: {orderTypeFilter === 'CUSTOM' ? 'Taller Custom' : 'Compra Estándar'}
                        <button onClick={() => setOrderTypeFilter('TODOS')} className="hover:text-pink-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderSalesChannelFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Canal: {orderSalesChannelFilter.replace('_', ' ')}
                        <button onClick={() => setOrderSalesChannelFilter('TODOS')} className="hover:text-cyan-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderShippingFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Entrega: {orderShippingFilter === 'CON_ENVIO' ? 'Con Envío' : 'Retiro Local'}
                        <button onClick={() => setOrderShippingFilter('TODOS')} className="hover:text-emerald-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderStartDateFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Desde: {orderStartDateFilter}
                        <button onClick={() => setOrderStartDateFilter('')} className="hover:text-blue-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {orderEndDateFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Hasta: {orderEndDateFilter}
                        <button onClick={() => setOrderEndDateFilter('')} className="hover:text-blue-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    <button
                      onClick={handleResetOrderFilters}
                      className="text-[10px] font-black uppercase text-red-400 hover:underline ml-1 cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

              </div>

              {/* ORDERS CONTENT: VISTA EN FICHAS / TARJETAS VS VISTA EN TABLA */}
              {ordersViewMode === 'grid' ? (
                filteredOrders.length === 0 ? (
                  <div className={`p-8 text-center font-bold border rounded-xl ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                  }`}>
                    No se encontraron pedidos con los filtros o fechas seleccionadas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => {
                      const effectiveSubtotal = order.subtotal ?? (order.discountAmount ? order.total + order.discountAmount : order.total);
                      const hasDiscount = !!(order.discountAmount && order.discountAmount > 0);
                      const count = order.itemsCount || 1;
                      return (
                      <div key={order.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                        isAdminDarkMode
                          ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-100'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}>
                        <div className="space-y-2.5">
                          {/* Header: ID + Badge + Actions */}
                          <div className={`flex items-center justify-between border-b pb-2 ${
                            isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm">#{order.id}</span>
                              {order.isCustomOrder ? (
                                <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 border border-pink-300 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md">TALLER CUSTOM</span>
                              ) : (
                                <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-md ${
                                  isAdminDarkMode ? 'text-slate-400 border-slate-800' : 'text-gray-600 border-gray-200 bg-gray-50'
                                }`}>ESTÁNDAR</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="Editar pedido"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                title="Eliminar orden"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Client & Date Info */}
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs truncate">{order.customerName}</h4>
                              <span className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{order.date}</span>
                            </div>
                            <p className={`text-[11px] truncate ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{order.customerEmail}</p>
                          </div>

                          {/* Cantidad & Descuento Badges */}
                          <div className={`flex items-center gap-2 pt-1 border-t flex-wrap ${
                            isAdminDarkMode ? 'border-slate-800/60' : 'border-gray-100'
                          }`}>
                            <span className={`px-2 py-0.5 font-bold text-[10px] rounded border ${
                              isAdminDarkMode ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {count} {count === 1 ? 'ítem' : 'ítems'}
                            </span>
                            {hasDiscount && (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" /> -${order.discountAmount!.toLocaleString('es-AR')} {order.appliedCouponCode ? `(${order.appliedCouponCode})` : ''}
                              </span>
                            )}
                          </div>

                          {/* Summary snippet */}
                          <p className={`text-xs line-clamp-2 pt-1 border-t ${
                            isAdminDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-gray-600 border-gray-100'
                          }`} title={order.itemsSummary}>
                            {order.itemsSummary}
                          </p>
                        </div>

                        {/* Footer: Amount, Status & Detail Button */}
                        <div className={`border-t pt-3 mt-2 space-y-2 ${
                          isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              {hasDiscount && (
                                <span className={`text-[10px] line-through block font-semibold ${
                                  isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'
                                }`}>
                                  Subt: ${effectiveSubtotal.toLocaleString('es-AR')}
                                </span>
                              )}
                              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">${order.total.toLocaleString('es-AR')} ARS</span>
                            </div>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className={`px-2 py-0.5 text-[11px] rounded-md cursor-pointer border focus:outline-none ${getStatusBadge(order.status)}`}
                            >
                              <option value="PENDIENTE" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>PENDIENTE</option>
                              <option value="EN_CONFECCION" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>EN CONFECCIÓN</option>
                              <option value="ENVIADO" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>ENVIADO</option>
                              <option value="ENTREGADO" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>ENTREGADO</option>
                            </select>
                          </div>
                          <button
                            onClick={() => setDetailOrder(order)}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isAdminDarkMode
                                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Ver Detalle
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-200' : 'border-gray-200 bg-white text-gray-800'
                }`}>
                  <table className="w-full text-left text-xs font-semibold border-collapse table-fixed">
                    <thead className={`uppercase text-[10px] font-black border-b ${
                      isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      <tr>
                        <th className="p-3 w-[15%]">ID / TIPO</th>
                        <th className="p-3 w-[18%]">CLIENTE</th>
                        <th className="p-3 w-[27%]">CANT. & PRODUCTOS</th>
                        <th className="p-3 w-[15%]">DESCUENTO & CUPÓN</th>
                        <th className="p-3 w-[15%]">SUBTOTAL & TOTAL</th>
                        <th className="p-3 w-[10%] text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={`p-8 text-center font-bold ${
                            isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            No se encontraron pedidos con los filtros o fechas seleccionadas.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const effectiveSubtotal = order.subtotal ?? (order.discountAmount ? order.total + order.discountAmount : order.total);
                          const hasDiscount = !!(order.discountAmount && order.discountAmount > 0);
                          const count = order.itemsCount || 1;
                          return (
                          <tr key={order.id} className={`transition-colors ${
                            isAdminDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                          }`}>
                            <td className="p-3 font-mono">
                              <span className="font-bold block">#{order.id}</span>
                              {order.isCustomOrder ? (
                                <span className="inline-block text-[9px] font-bold text-pink-600 dark:text-pink-400">CUSTOM</span>
                              ) : (
                                <span className={`inline-block text-[9px] ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ESTÁNDAR</span>
                              )}
                              <span className={`block text-[10px] font-sans ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{order.date}</span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold truncate">{order.customerName}</p>
                              <p className={`text-[10px] truncate ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{order.customerEmail}</p>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`px-1.5 py-0.5 font-bold text-[10px] rounded border ${
                                  isAdminDarkMode ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                  {count} {count === 1 ? 'ítem' : 'ítems'}
                                </span>
                              </div>
                              <p className={`font-medium truncate text-xs ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} title={order.itemsSummary}>
                                {order.itemsSummary}
                              </p>
                            </td>
                            <td className="p-3">
                              {hasDiscount ? (
                                <div>
                                  <span className="block text-emerald-700 dark:text-emerald-400 font-black text-xs">
                                    -${order.discountAmount!.toLocaleString('es-AR')}
                                  </span>
                                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/70 dark:border-purple-800 dark:text-purple-300 rounded uppercase truncate max-w-[130px]" title={order.appliedCouponCode || 'CUPÓN'}>
                                    {order.appliedCouponCode || 'CUPÓN APLICADO'}
                                  </span>
                                </div>
                              ) : (
                                <span className={`text-[11px] font-medium ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>$0 (Sin descuento)</span>
                              )}
                            </td>
                            <td className="p-3">
                              {hasDiscount && (
                                <span className={`block text-[10px] line-through ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                                  Subt: ${effectiveSubtotal.toLocaleString('es-AR')}
                                </span>
                              )}
                              <span className="block text-emerald-700 dark:text-emerald-400 font-black text-xs">${order.total.toLocaleString('es-AR')}</span>
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className={`mt-1 px-1.5 py-0.5 text-[9px] rounded cursor-pointer border ${getStatusBadge(order.status)}`}
                              >
                                <option value="PENDIENTE" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>PENDIENTE</option>
                                <option value="EN_CONFECCION" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>EN CONFECCIÓN</option>
                                <option value="ENVIADO" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>ENVIADO</option>
                                <option value="ENTREGADO" className={isAdminDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}>ENTREGADO</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setDetailOrder(order)}
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isAdminDarkMode
                                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                                  }`}
                                  title="Ver detalle del pedido"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Detalle
                                </button>
                                <button
                                  onClick={() => handleOpenEditOrder(order)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTARIO DE PRODUCTOS (FULL CRUD CON EXTENDED ATTRS & BARRA BÚSQUEDA) */}
          {activeTab === 'inventory' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-pink-400' : 'text-gray-900'
                  }`}>
                    <Package className={`w-5 h-5 ${isAdminDarkMode ? 'text-pink-400' : 'text-gray-800'}`} /> INVENTARIO DE PRODUCTOS ({filteredInventory.length} DE {products.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Control de stock, códigos SKU, precios de costo y márgenes de venta
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* VIEW FORMAT SWITCHER */}
                  <div className={`flex items-center p-1 rounded-lg border ${
                    isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <button
                      onClick={() => setInventoryViewMode('grid')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        inventoryViewMode === 'grid'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Fichas / Tarjetas (Sin desplazamiento lateral)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Fichas
                    </button>
                    <button
                      onClick={() => setInventoryViewMode('table')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        inventoryViewMode === 'table'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Tabla Compacta"
                    >
                      <List className="w-3.5 h-3.5" /> Tabla
                    </button>
                  </div>

                  <button
                    onClick={handleOpenAddProduct}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> AGREGAR PRODUCTO
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA & FILTROS INTUITIVOS DE INVENTARIO */}
              <div className={`p-4 sm:p-5 border rounded-2xl space-y-4 shadow-xs transition-all ${
                isAdminDarkMode ? 'bg-slate-950 border-slate-800/90' : 'bg-gray-50/90 border-gray-200'
              }`}>
                
                {/* SEARCH INPUT & TOOLBAR ACTIONS */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  
                  {/* SEARCH BAR */}
                  <div className="relative flex-1">
                    <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      placeholder="Buscar producto por nombre, SKU, material, categoría o estilo..."
                      className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none border transition-all ${
                        isAdminDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-slate-700'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                      }`}
                    />
                    {inventorySearchQuery && (
                      <button
                        onClick={() => setInventorySearchQuery('')}
                        className={`absolute right-3 top-2.5 p-0.5 rounded-full transition-colors cursor-pointer ${
                          isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                        title="Borrar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* ACTION BUTTONS: ADVANCED FILTERS TOGGLE & RESET */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowAdvancedInventoryFilters(!showAdvancedInventoryFilters)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                        showAdvancedInventoryFilters || activeInventoryFiltersCount > 0
                          ? (isAdminDarkMode ? 'bg-slate-800 text-pink-300 border-pink-500/40 shadow-xs' : 'bg-gray-900 text-white border-gray-900 shadow-xs')
                          : (isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 shadow-xs')
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Filtros Avanzados</span>
                      {activeInventoryFiltersCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isAdminDarkMode ? 'bg-pink-400 text-slate-950' : 'bg-pink-300 text-gray-950'
                        }`}>
                          {activeInventoryFiltersCount}
                        </span>
                      )}
                      {showAdvancedInventoryFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isInventoryFiltered && (
                      <button
                        onClick={handleResetInventoryFilters}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isAdminDarkMode
                            ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                        title="Limpiar todos los filtros"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Limpiar Filtros</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* QUICK STOCK LEVEL FILTER CHIPS */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      NIVEL DE STOCK / DISPONIBILIDAD:
                    </label>
                    <span className={`text-[10px] font-bold ${
                      isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      Mostrando {filteredInventory.length} de {products.length} productos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'TODOS', label: 'TODOS', icon: Package, count: products.length },
                      { id: 'NORMAL', label: 'STOCK COMPLETO', icon: CheckCircle2, count: products.filter((p) => { const s = getProductStockStatus(p); return !s.isTotalOutOfStock && !s.hasOutOfStockVariations; }).length },
                      { id: 'PARTIAL', label: 'VAR. AGOTADAS', icon: AlertTriangle, count: products.filter((p) => getProductStockStatus(p).hasOutOfStockVariations).length },
                      { id: 'OUT_OF_STOCK', label: 'SIN STOCK TOTAL', icon: XCircle, count: products.filter((p) => getProductStockStatus(p).isTotalOutOfStock).length },
                      { id: 'UNIQUE', label: 'PIEZAS ÚNICAS', icon: Sparkles, count: products.filter((p) => p.isUnique).length },
                    ].map((st) => {
                      const isSelected = inventoryStockFilter === st.id;
                      const StatusIcon = st.icon;

                      return (
                        <button
                          key={st.id}
                          onClick={() => setInventoryStockFilter(st.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                            isSelected
                              ? (isAdminDarkMode
                                  ? 'bg-slate-800 text-white border-pink-400 shadow-xs ring-1 ring-pink-400/40'
                                  : 'bg-gray-900 text-white border-gray-900 shadow-md')
                              : (isAdminDarkMode
                                  ? 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 shadow-2xs')
                          }`}
                        >
                          <StatusIcon className={`w-3.5 h-3.5 ${isSelected ? (isAdminDarkMode ? 'text-pink-400' : 'text-white') : 'text-current'}`} />
                          <span>{st.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                            isSelected
                              ? (isAdminDarkMode ? 'bg-pink-400 text-slate-950' : 'bg-gray-700 text-white')
                              : (isAdminDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700')
                          }`}>
                            {st.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ADVANCED COLLAPSIBLE INVENTORY FILTERS PANEL */}
                {(showAdvancedInventoryFilters || (isInventoryFiltered && (inventoryCategoryFilter !== 'TODAS' || inventoryVibeFilter !== 'TODAS' || inventorySalesChannelFilter !== 'TODOS'))) && (
                  <div className={`p-4 rounded-xl border space-y-4 animate-in fade-in transition-all ${
                    isAdminDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200 shadow-xs'
                  }`}>
                    
                    {/* CATEGORÍA */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <Tag className="w-3 h-3 text-pink-400" /> FILTRAR POR CATEGORÍA:
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        <button
                          onClick={() => setInventoryCategoryFilter('TODAS')}
                          className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                            inventoryCategoryFilter === 'TODAS'
                              ? (isAdminDarkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-gray-900 text-white border-gray-900')
                              : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
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
                              className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                                isSelected
                                  ? (isAdminDarkMode ? 'bg-slate-800 text-pink-300 border-pink-500/40' : 'bg-gray-900 text-white border-gray-900')
                                  : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                              }`}
                            >
                              {cat.name} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ESTILO / VIBE */}
                    <div className={`space-y-1.5 pt-3 border-t ${isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'}`}>
                      <label className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <Sparkles className="w-3 h-3 text-cyan-400" /> FILTRAR POR ESTILO:
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        <button
                          onClick={() => setInventoryVibeFilter('TODAS')}
                          className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                            inventoryVibeFilter === 'TODAS'
                              ? (isAdminDarkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-gray-900 text-white border-gray-900')
                              : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
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
                              className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                                isSelected
                                  ? (isAdminDarkMode ? 'bg-slate-800 text-cyan-300 border-cyan-500/40' : 'bg-gray-900 text-white border-gray-900')
                                  : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                              }`}
                            >
                              #{vibe.name} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CANAL DE VENTA / DISPONIBILIDAD */}
                    <div className={`space-y-1.5 pt-3 border-t ${isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'}`}>
                      <label className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <Globe className="w-3 h-3 text-amber-400" /> DISPONIBILIDAD DE CANAL:
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {[
                          { id: 'TODOS', label: 'TODOS LOS CANALES' },
                          { id: 'AMBOS', label: 'WEB Y LOCAL FÍSICO' },
                          { id: 'SOLO_WEB', label: 'SOLO WEB' },
                          { id: 'SOLO_LOCAL', label: 'SOLO LOCAL FÍSICO' },
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => setInventorySalesChannelFilter(ch.id)}
                            className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                              inventorySalesChannelFilter === ch.id
                                ? (isAdminDarkMode ? 'bg-slate-800 text-amber-300 border-amber-500/40' : 'bg-gray-900 text-white border-gray-900')
                                : (isAdminDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100')
                            }`}
                          >
                            {ch.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* DISMISSABLE ACTIVE FILTERS BADGES BAR FOR INVENTORY */}
                {isInventoryFiltered && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-gray-300 dark:border-slate-800">
                    <span className={`text-[10px] font-black uppercase ${
                      isAdminDarkMode ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      FILTROS APLICADOS:
                    </span>

                    {inventorySearchQuery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Búsqueda: "{inventorySearchQuery}"
                        <button onClick={() => setInventorySearchQuery('')} className="hover:text-amber-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {inventoryStockFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30">
                        Stock: {
                          inventoryStockFilter === 'NORMAL' ? 'Stock Completo' :
                          inventoryStockFilter === 'PARTIAL' ? 'Var. Agotadas' :
                          inventoryStockFilter === 'OUT_OF_STOCK' ? 'Sin Stock Total' : 'Piezas Únicas'
                        }
                        <button onClick={() => setInventoryStockFilter('TODOS')} className="hover:text-pink-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {inventoryCategoryFilter !== 'TODAS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        Categoría: {inventoryCategoryFilter}
                        <button onClick={() => setInventoryCategoryFilter('TODAS')} className="hover:text-purple-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {inventoryVibeFilter !== 'TODAS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Estilo: #{inventoryVibeFilter}
                        <button onClick={() => setInventoryVibeFilter('TODAS')} className="hover:text-cyan-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    {inventorySalesChannelFilter !== 'TODOS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Canal: {inventorySalesChannelFilter.replace('_', ' ')}
                        <button onClick={() => setInventorySalesChannelFilter('TODOS')} className="hover:text-emerald-200 cursor-pointer"><X className="w-3 h-3" /></button>
                      </span>
                    )}

                    <button
                      onClick={handleResetInventoryFilters}
                      className="text-[10px] font-black uppercase text-red-400 hover:underline ml-1 cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

              </div>

              {/* INVENTORY CONTENT: VISTA EN FICHAS / TARJETAS VS VISTA EN TABLA */}
              {inventoryViewMode === 'grid' ? (
                filteredInventory.length === 0 ? (
                  <div className={`p-8 text-center font-bold border rounded-xl ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                  }`}>
                    No se encontraron productos con los filtros seleccionados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInventory.map((product) => {
                      const stockInfo = getProductStockStatus(product);
                      const totStock = stockInfo.totalStock;
                      return (
                        <div key={product.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                          isAdminDarkMode
                            ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-100'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                        }`}>
                          <div className="space-y-2.5">
                            {/* Top Bar: Thumbnail + Title + SKU + Actions */}
                            <div className={`flex items-start justify-between gap-3 border-b pb-2.5 ${
                              isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                            }`}>
                              <div className="flex items-start gap-2.5">
                                <img src={product.image} alt={product.name} onError={handleProductImageError} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-800 shrink-0" />
                                <div>
                                  <span className={`font-mono text-[10px] font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{product.sku || `BTC-${product.id.slice(-4).toUpperCase()}`}</span>
                                  <h3 className={`font-bold text-xs sm:text-sm leading-tight line-clamp-1 ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{product.name}</h3>
                                  {product.material && <span className={`text-[11px] block truncate ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{product.material}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditProduct(product)}
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Editar producto"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProductClick(product)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Categoría & Estilos */}
                            <div className="flex flex-wrap items-center gap-1 text-xs">
                              <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {product.category}
                              </span>
                              {product.vibe.slice(0, 2).map((v) => (
                                <span key={v} className={`border text-[10px] px-2 py-0.5 rounded-md ${
                                  isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  #{v}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Footer: Price, Stock & Detail Button */}
                          <div className={`border-t pt-3 mt-2 space-y-2 ${
                            isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">${product.price.toFixed(2)} ARS</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                stockInfo.isTotalOutOfStock
                                  ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                  : stockInfo.hasOutOfStockVariations
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                  : product.isUnique || totStock === 1
                                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                  : totStock <= 10
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                  : (isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-100 text-gray-800 border-gray-200')
                              }`} title={stockInfo.hasOutOfStockVariations ? `Variedades agotadas: ${stockInfo.outOfStockVariationNames.join(', ')}` : undefined}>
                                {stockInfo.isTotalOutOfStock
                                  ? 'Sin stock'
                                  : stockInfo.hasOutOfStockVariations
                                  ? `${totStock} un. (Var. agotada)`
                                  : `${totStock} un.`}
                              </span>
                            </div>
                            <button
                              onClick={() => setDetailProduct(product)}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                isAdminDarkMode
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" /> Ver Detalle
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-200' : 'border-gray-200 bg-white text-gray-800'
                }`}>
                  <table className="w-full text-left text-xs font-semibold border-collapse">
                    <thead className={`uppercase text-[10px] font-black border-b ${
                      isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      <tr>
                        <th className="p-3 w-4/12">PRODUCTO</th>
                        <th className="p-3 w-3/12">CATEGORÍA & ESTILOS</th>
                        <th className="p-3 w-2/12">PRECIO</th>
                        <th className="p-3 w-1/12">STOCK</th>
                        <th className="p-3 w-2/12 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`p-8 text-center font-bold ${
                            isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            No se encontraron productos con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredInventory.map((product) => {
                          const stockInfo = getProductStockStatus(product);
                          const totStock = stockInfo.totalStock;
                          return (
                            <tr key={product.id} className={`transition-colors ${
                              isAdminDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                            }`}>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img src={product.image} alt={product.name} onError={handleProductImageError} className="w-9 h-9 object-cover rounded border border-gray-200 dark:border-slate-800 shrink-0" />
                                  <div>
                                    <p className={`font-bold truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{product.name}</p>
                                    <span className={`font-mono text-[9px] block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{product.sku || `BTC-${product.id.slice(-4).toUpperCase()}`}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`font-bold block ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-800'}`}>{product.category}</span>
                                <span className={`text-[10px] truncate block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>#{product.vibe.join(', #')}</span>
                              </td>
                              <td className="p-3 font-extrabold text-emerald-700 dark:text-emerald-400">
                                ${product.price.toFixed(2)}
                              </td>
                              <td className="p-3">
                                {stockInfo.isTotalOutOfStock ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30">
                                    0 un. (Agotado)
                                  </span>
                                ) : stockInfo.hasOutOfStockVariations ? (
                                  <div>
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono">
                                      {totStock} un.
                                    </span>
                                    <span className="block text-[9px] text-amber-300 font-bold mt-0.5 truncate max-w-[130px]" title={`Variedad agotada: ${stockInfo.outOfStockVariationNames.join(', ')}`}>
                                      Var. agotada ({stockInfo.outOfStockVariationNames.length})
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                    totStock <= 10
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : 'bg-slate-900 text-slate-300 border-slate-800'
                                  } font-mono`}>
                                    {totStock} un.
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setDetailProduct(product)}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Ver detalle del producto"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-brand-pink" /> Detalle
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditProduct(product)}
                                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProductClick(product)}
                                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLIENTES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'customers' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-emerald-400' : 'text-gray-900'
                  }`}>
                    <Users className={`w-5 h-5 ${isAdminDarkMode ? 'text-emerald-400' : 'text-gray-800'}`} /> REGISTRO Y GESTIÓN DE CLIENTES ({filteredCustomers.length} DE {customers.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Listado de usuarios registrados, historial de pedidos y puntos de fidelidad acumulados
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* VIEW FORMAT SWITCHER */}
                  <div className={`flex items-center p-1 rounded-lg border ${
                    isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <button
                      onClick={() => setCustomersViewMode('grid')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        customersViewMode === 'grid'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Fichas / Tarjetas (Sin desplazamiento lateral)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Fichas
                    </button>
                    <button
                      onClick={() => setCustomersViewMode('table')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        customersViewMode === 'table'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Tabla Compacta"
                    >
                      <List className="w-3.5 h-3.5" /> Tabla
                    </button>
                  </div>

                  <button
                    onClick={handleOpenAddCustomer}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> REGISTRAR CLIENTE
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA CLIENTES */}
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, email, rol o ID..."
                  className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                    isAdminDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                  }`}
                />
                <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              </div>

              {/* CUSTOMERS CONTENT: VISTA EN FICHAS VS VISTA EN TABLA */}
              {customersViewMode === 'grid' ? (
                filteredCustomers.length === 0 ? (
                  <div className={`p-8 text-center font-bold border rounded-xl ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                  }`}>
                    No se encontraron clientes con la búsqueda especificada.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map((user) => (
                      <div key={user.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                        isAdminDarkMode
                          ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-100'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}>
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between border-b pb-2.5 ${
                            isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                                isAdminDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-100 border-gray-200 text-gray-800'
                              }`}>
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className={`font-bold text-xs sm:text-sm leading-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{user.name}</h3>
                                <span className={`text-[11px] font-medium block truncate ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditCustomer(user)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="Editar cliente"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(user.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                              user.role.includes('VIP')
                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                : (isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200')
                            }`}>
                              {user.role}
                            </span>
                            <span className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.points} PTS</span>
                          </div>
                        </div>

                        <div className={`border-t pt-3 mt-2 space-y-2 ${
                          isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}>{user.ordersCount} pedidos</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">${user.totalSpent.toLocaleString('es-AR')} ARS</span>
                          </div>
                          <button
                            onClick={() => setDetailCustomer(user)}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isAdminDarkMode
                                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Ver Detalle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-200' : 'border-gray-200 bg-white text-gray-800'
                }`}>
                  <table className="w-full text-left text-xs font-semibold border-collapse">
                    <thead className={`uppercase text-[10px] font-black border-b ${
                      isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      <tr>
                        <th className="p-3 w-4/12">CLIENTE</th>
                        <th className="p-3 w-2/12">ROL</th>
                        <th className="p-3 w-3/12">HISTORIAL & GASTADO</th>
                        <th className="p-3 w-1/12">PUNTOS</th>
                        <th className="p-3 w-2/12 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`p-8 text-center font-bold ${
                            isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            No se encontraron clientes con la búsqueda especificada.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((user) => (
                          <tr key={user.id} className={`transition-colors ${
                            isAdminDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                          }`}>
                            <td className="p-3">
                              <p className={`font-bold truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{user.name}</p>
                              <p className={`text-[10px] truncate ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                user.role.includes('VIP')
                                  ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                  : (isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200')
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`font-bold block text-[11px] ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{user.ordersCount} pedidos</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-black text-xs">${user.totalSpent.toLocaleString()} ARS</span>
                            </td>
                            <td className={`p-3 font-extrabold ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}`}>
                              {user.points} PTS
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setDetailCustomer(user)}
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isAdminDarkMode
                                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                                  }`}
                                  title="Ver detalle del cliente"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Detalle
                                </button>
                                <button
                                  onClick={() => handleOpenEditCustomer(user)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomer(user.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GASTOS Y PROVEEDORES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'expenses' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'
                  }`}>
                    <Receipt className={`w-5 h-5 ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-800'}`} /> COMPRAS A PROVEEDORES Y GASTOS OPERATIVOS ({filteredExpenses.length} DE {expenses.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Registro de compras de materias primas, insumos, packaging y gastos operativos
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* VIEW FORMAT SWITCHER */}
                  <div className={`flex items-center p-1 rounded-lg border ${
                    isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <button
                      onClick={() => setExpensesViewMode('grid')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        expensesViewMode === 'grid'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Fichas / Tarjetas (Sin desplazamiento lateral)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Fichas
                    </button>
                    <button
                      onClick={() => setExpensesViewMode('table')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        expensesViewMode === 'table'
                          ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-gray-900 border border-gray-300 shadow-xs font-bold')
                          : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                      }`}
                      title="Vista en Tabla Compacta"
                    >
                      <List className="w-3.5 h-3.5" /> Tabla
                    </button>
                  </div>

                  <button
                    onClick={handleOpenAddExpense}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> REGISTRAR GASTO
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA GASTOS */}
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  placeholder="Buscar gasto por proveedor, categoría, descripción o forma de pago..."
                  className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                    isAdminDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                  }`}
                />
                <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              </div>

              {/* EXPENSES CONTENT: VISTA EN FICHAS VS VISTA EN TABLA */}
              {expensesViewMode === 'grid' ? (
                filteredExpenses.length === 0 ? (
                  <div className={`p-8 text-center font-bold border rounded-xl ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                  }`}>
                    No se encontraron gastos con el término de búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExpenses.map((expense) => (
                      <div key={expense.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                        isAdminDarkMode
                          ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-100'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}>
                        <div className="space-y-2.5">
                          <div className={`flex items-center justify-between border-b pb-2 ${
                            isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                          }`}>
                            <div>
                              <span className={`font-mono text-[10px] font-bold block ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>#{expense.id}</span>
                              <h3 className={`font-bold text-xs sm:text-sm leading-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{expense.supplier}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditExpense(expense)}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                                title="Editar gasto"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {expense.category}
                            </span>
                            <span className={`text-[11px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expense.date}</span>
                          </div>

                          <p className={`text-xs line-clamp-2 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-600'}`} title={expense.description}>
                            {expense.description}
                          </p>
                        </div>

                        <div className={`border-t pt-3 mt-2 space-y-2 ${
                          isAdminDarkMode ? 'border-slate-800/80' : 'border-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expense.paymentMethod}</span>
                            <span className={`text-sm font-extrabold ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>${expense.amount.toLocaleString('es-AR')} ARS</span>
                          </div>
                          <button
                            onClick={() => setDetailExpense(expense)}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isAdminDarkMode
                                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Ver Detalle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-200' : 'border-gray-200 bg-white text-gray-800'
                }`}>
                  <table className="w-full text-left text-xs font-semibold border-collapse">
                    <thead className={`uppercase text-[10px] font-black border-b ${
                      isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      <tr>
                        <th className="p-3 w-2/12">ID & FECHA</th>
                        <th className="p-3 w-3/12">PROVEEDOR</th>
                        <th className="p-3 w-3/12">CATEGORÍA & PAGO</th>
                        <th className="p-3 w-2/12">MONTO</th>
                        <th className="p-3 w-2/12 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`p-8 text-center font-bold ${
                            isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            No se encontraron gastos con el término de búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <tr key={expense.id} className={`transition-colors ${
                            isAdminDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                          }`}>
                            <td className="p-3">
                              <span className={`font-mono font-bold block ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>#{expense.id}</span>
                              <span className={`text-[10px] block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expense.date}</span>
                            </td>
                            <td className="p-3">
                              <p className={`font-bold truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{expense.supplier}</p>
                              <p className={`text-[10px] truncate max-w-[150px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`} title={expense.description}>{expense.description}</p>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {expense.category}
                              </span>
                              <span className={`block text-[10px] mt-0.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expense.paymentMethod}</span>
                            </td>
                            <td className={`p-3 font-extrabold ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                              ${expense.amount.toLocaleString()} ARS
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setDetailExpense(expense)}
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isAdminDarkMode
                                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                                  }`}
                                  title="Ver detalle del gasto"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Detalle
                                </button>
                                <button
                                  onClick={() => handleOpenEditExpense(expense)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PREMIOS Y CUPONES (FULL CRUD CON BARRA DE BÚSQUEDA) */}
          {activeTab === 'rewards' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-purple-400' : 'text-gray-900'
                  }`}>
                    <Award className={`w-5 h-5 ${isAdminDarkMode ? 'text-purple-400' : 'text-gray-800'}`} /> CATÁLOGO DE PREMIOS Y RECOMPENSAS ({filteredRewards.length} DE {adminRewards.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Administración de premios canjeables por puntos de clientes
                  </p>
                </div>

                <button
                  onClick={handleOpenAddReward}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                    isAdminDarkMode
                      ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                      : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                  }`}
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
                  className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                    isAdminDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                  }`}
                />
                <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              </div>

              {filteredRewards.length === 0 ? (
                <div className={`p-8 text-center font-bold border rounded-xl ${
                  isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                }`}>
                  No se encontraron premios con los filtros especificados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRewards.map((reward) => (
                    <div key={reward.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all ${
                      isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                    }`}>
                      <div className="flex items-center gap-3">
                        <img src={reward.image} alt={reward.title} onError={handleProductImageError} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-700" />
                        <div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            isAdminDarkMode ? 'bg-slate-900 text-amber-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {reward.category}
                          </span>
                          <h4 className={`text-xs font-black uppercase mt-1 leading-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{reward.title}</h4>
                        </div>
                      </div>
                      <p className={`text-[11px] font-medium line-clamp-2 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{reward.description}</p>
                      <div className={`flex items-center justify-between pt-2 border-t text-xs font-bold ${
                        isAdminDarkMode ? 'border-slate-800' : 'border-gray-100'
                      }`}>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">{reward.discountValue}</span>
                        <span className={isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}>{reward.pointsCost} PTS</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditReward(reward)}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.id)}
                            className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer"
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
              <div className={`p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
              }`}>
                <div>
                  <h3 className={`text-base font-black uppercase font-display ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    ADMINISTRADOR DE ETIQUETAS, CATEGORÍAS Y ESTILOS
                  </h3>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Búsqueda y gestión en tiempo real para la taxonomía de la tienda
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Filtrar categorías o estilos..."
                    className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                      isAdminDarkMode
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                    }`}
                  />
                  <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CATEGORIES MANAGEMENT */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                      isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'
                    }`}>
                      <Tag className={`w-5 h-5 ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-800'}`} /> CATEGORÍAS ({filteredCategories.length} DE {categories.length})
                    </h3>
                    <button
                      onClick={handleOpenAddCategory}
                      className={`px-2.5 py-1 rounded text-xs font-black uppercase cursor-pointer border ${
                        isAdminDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-gray-900 text-white border-gray-900 hover:bg-black'
                      }`}
                    >
                      + NUEVA
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredCategories.length === 0 ? (
                      <p className={`text-xs font-bold p-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No se encontraron categorías.</p>
                    ) : (
                      filteredCategories.map((cat) => (
                        <div key={cat.id} className={`border p-3 flex items-center justify-between rounded-lg ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50 text-gray-900'
                        }`}>
                          <div>
                            <span className="font-bold text-xs">{cat.name}</span>
                            {cat.basePrice && <span className={`block text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Base: ${cat.basePrice}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEditCategory(cat)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                            <button onClick={() => handleDeleteCategoryClick(cat)} className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer">Borrar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* VIBES / STYLES MANAGEMENT */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                      isAdminDarkMode ? 'text-cyan-400' : 'text-gray-900'
                    }`}>
                      <Sparkles className={`w-5 h-5 ${isAdminDarkMode ? 'text-cyan-400' : 'text-gray-800'}`} /> ESTILOS ({filteredVibes.length} DE {vibes.length})
                    </h3>
                    <button
                      onClick={handleOpenAddVibe}
                      className={`px-2.5 py-1 rounded text-xs font-black uppercase cursor-pointer border ${
                        isAdminDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-gray-900 text-white border-gray-900 hover:bg-black'
                      }`}
                    >
                      + NUEVO
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredVibes.length === 0 ? (
                      <p className={`text-xs font-bold p-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No se encontraron estilos.</p>
                    ) : (
                      filteredVibes.map((vibe) => (
                        <div key={vibe.id} className={`border p-3 flex items-center justify-between rounded-lg ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50 text-gray-900'
                        }`}>
                          <span className="font-bold text-xs">#{vibe.name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEditVibe(vibe)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                            <button onClick={() => handleDeleteVibeClick(vibe)} className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer">Borrar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ETIQUETAS / BADGES MANAGEMENT (CRUD COMPLETO) */}
                <div className={`border p-6 space-y-4 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                      isAdminDarkMode ? 'text-pink-400' : 'text-gray-900'
                    }`}>
                      <Tag className={`w-5 h-5 ${isAdminDarkMode ? 'text-pink-400' : 'text-gray-800'}`} /> ETIQUETAS ({filteredTags.length} DE {tags.length})
                    </h3>
                    <button
                      onClick={handleOpenAddTag}
                      className={`px-2.5 py-1 rounded text-xs font-black uppercase cursor-pointer border ${
                        isAdminDarkMode ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700' : 'bg-gray-900 text-white border-gray-900 hover:bg-black'
                      }`}
                    >
                      + NUEVA
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredTags.length === 0 ? (
                      <p className={`text-xs font-bold p-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No se encontraron etiquetas.</p>
                    ) : (
                      filteredTags.map((tag) => (
                        <div key={tag.id} className={`border p-3 flex items-center justify-between rounded-lg ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50 text-gray-900'
                        }`}>
                          <span className={`px-2 py-0.5 border text-[10px] font-black uppercase rounded ${tag.badgeBg || 'bg-gray-900 text-white'}`}>
                            [{tag.name}]
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEditTag(tag)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                            <button onClick={() => handleDeleteTagClick(tag)} className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer">Borrar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: TALLER CUSTOM / PRODUCTOS PERSONALIZADOS */}
          {activeTab === 'customizer' && (
            <div className="animate-in fade-in">
              <AdminCustomProductsManager isDarkMode={isAdminDarkMode} />
            </div>
          )}

        </main>
      </div>

      {/* MINIMAL CLEAN ADMIN FOOTER */}
      <footer className={`border-t py-3.5 px-6 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
        isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-500' : 'border-gray-200 bg-white text-gray-500'
      }`}>
        BUTTONCAT PANEL DE CONTROL © 2026
      </footer>

      {/* FULL CRUD MODALS */}
      <AddOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        orderToEdit={editingOrder}
        products={products}
        customers={customers}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={editingCustomer}
        isDarkMode={isAdminDarkMode}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={editingExpense}
        isDarkMode={isAdminDarkMode}
      />

      <AddRewardAdminModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSave={handleSaveReward}
        rewardToEdit={editingReward}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
        tags={tags}
        isDarkMode={isAdminDarkMode}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={editingCategory}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditStyleModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        onSave={handleSaveVibe}
        styleToEdit={editingVibe}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditBadgeModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={handleSaveTag}
        badgeToEdit={editingTag}
        isDarkMode={isAdminDarkMode}
      />

      {/* ORDER DETAIL OVERLAY MODAL - FORMULARIO DE PEDIDO SEGÚN DISEÑO DE REMITO */}
      {detailOrder && (() => {
        const parsedItems = splitTopLevelItems(detailOrder.itemsSummary).map((raw, idx) => {
          const match = raw.match(/^(\d+)x?\s*(.*)/i);
          const qty = match ? parseInt(match[1], 10) : 1;
          let fullTitle = match ? match[2].trim() : raw.trim();

          let varietyDetails = '';
          const parentheticalMatch = fullTitle.match(/^(.*?)\s*\((.*?)\)$/);
          if (parentheticalMatch) {
            fullTitle = parentheticalMatch[1].trim();
            varietyDetails = parentheticalMatch[2].trim();
          }

          const totalItemsCount = detailOrder.itemsCount || 1;
          const subtotalOrTotal = detailOrder.subtotal || detailOrder.total;
          const approxUnitPrice = Math.round(subtotalOrTotal / totalItemsCount);

          return {
            id: `item-${idx}`,
            name: fullTitle,
            varietyDetails,
            qty,
            unitPrice: approxUnitPrice,
            totalValue: approxUnitPrice * qty,
          };
        });

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
            <div className="bg-white border-4 border-black shadow-2xl max-w-3xl w-full p-4 sm:p-8 text-black font-sans my-auto max-h-[92vh] overflow-y-auto">
              
              {/* HEADER SECTION: LOGO + DATOS DE EMPRESA (IZQ) & CUADRO DE PEDIDO NO. (DER) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-stretch gap-4 pb-4 border-b-2 border-black">
                
                {/* IDENTIDAD DE MARCA Y CONTACTO */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-brand-pink border-3 border-black flex items-center justify-center font-black text-white text-xl shadow-brutal-xs shrink-0">
                    <Sparkles className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <h2 className="font-black text-base uppercase tracking-tight font-display text-black">
                      BUTTONCAT STUDIO
                    </h2>
                    <p className="font-bold text-gray-700 text-[11px]">
                      Av. Corrientes 1234, Palermo • CABA
                    </p>
                    <p className="font-medium text-gray-600 text-[10px]">
                      correo: contacto@buttoncat.com • Tel: +54 11 9876-5432
                    </p>
                    <p className="font-bold text-gray-800 text-[10px] uppercase">
                      Buenos Aires - Argentina
                    </p>
                  </div>
                </div>

                {/* CUADRO TÍTULO PEDIDO & NÚMERO (MISMO FORMATO BORDERED BOX DE LA IMAGEN) */}
                <div className="w-full sm:w-56 border-2 border-black divide-y-2 divide-black text-center shadow-brutal-xs shrink-0 bg-white">
                  <div className="bg-gray-100 py-1.5 font-black uppercase text-xs tracking-wider text-black">
                    Pedido
                  </div>
                  <div className="py-2.5 font-black text-base font-mono text-black">
                    No. {detailOrder.id}
                  </div>
                </div>
              </div>

              {/* SECCIÓN CLIENTE & DATOS DE ENTREGA (GRILLA CON BORDES CONTINUOS) */}
              <div className="mt-4 border-2 border-black text-xs divide-y-2 divide-black font-bold">
                {/* FILA 1: CLIENTE & FECHA */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-8 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Cliente:</span>
                    <span className="truncate font-black text-gray-900">{detailOrder.customerName}</span>
                    <span className="text-[10px] text-gray-500 font-semibold font-mono">({detailOrder.customerEmail})</span>
                  </div>
                  <div className="sm:col-span-4 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Fecha:</span>
                    <span className="font-mono font-bold text-gray-900">{detailOrder.date}</span>
                  </div>
                </div>

                {/* FILA 2: DIRECCIÓN & TELÉFONO */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-8 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Dirección:</span>
                    <span className="truncate font-semibold text-gray-800">
                      {detailOrder.shippingDestination || detailOrder.shippingAddress || 'Retiro en Local Buttoncat (Palermo)'}
                    </span>
                  </div>
                  <div className="sm:col-span-4 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Telefono:</span>
                    <span className="truncate font-mono text-[11px] font-semibold text-gray-800">{detailOrder.customerEmail}</span>
                  </div>
                </div>

                {/* FILA 3: PARA DESPACHAR A & HORA / CANAL */}
                <div className="grid grid-cols-1 sm:grid-cols-12 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black">
                  <div className="sm:col-span-8 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Para despachar a:</span>
                    <span className="truncate font-semibold text-gray-800">
                      {detailOrder.hasShipping
                        ? `${detailOrder.carrier || 'Envío Andreani'}: ${detailOrder.shippingDestination || detailOrder.shippingAddress}`
                        : 'Retiro en Local Buttoncat'}
                    </span>
                  </div>
                  <div className="sm:col-span-4 p-2 flex items-center gap-2 bg-white">
                    <span className="font-black uppercase text-black shrink-0">Hora / Canal:</span>
                    <span className="font-bold text-black uppercase">
                      {detailOrder.salesChannel?.replace('_', ' ') || 'TIENDA WEB'} • {detailOrder.isCustomOrder ? 'CUSTOM' : 'ESTÁNDAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN TABLA DE ARTÍCULOS ("Por favor suministrar lo siguiente") */}
              <div className="mt-5 border-2 border-black">
                <div className="bg-gray-100 py-1.5 text-center font-black uppercase text-xs border-b-2 border-black tracking-wide text-black">
                  Por favor suministrar lo siguiente
                </div>

                {/* CABECERA DE TABLA */}
                <div className="grid grid-cols-12 bg-gray-50 border-b-2 border-black font-black text-xs text-black divide-x-2 divide-black text-center py-2 uppercase">
                  <div className="col-span-6 text-left px-3">Artículos</div>
                  <div className="col-span-2">Cantidad</div>
                  <div className="col-span-2">Precio Unt.</div>
                  <div className="col-span-2">Valor</div>
                </div>

                {/* FILAS DE ARTÍCULOS */}
                <div className="divide-y-2 divide-black text-xs font-bold bg-white">
                  {parsedItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 divide-x-2 divide-black items-center py-2 px-1 hover:bg-yellow-50/50">
                      <div className="col-span-6 px-2 space-y-0.5">
                        <p className="font-black text-black uppercase leading-snug">{item.name}</p>
                        {item.varietyDetails && (
                          <p className="text-[10px] text-purple-900 font-bold font-mono">
                            [{item.varietyDetails}]
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-center font-mono text-xs font-black">{item.qty}</div>
                      <div className="col-span-2 text-center font-mono text-xs font-semibold">
                        ${item.unitPrice ? item.unitPrice.toLocaleString('es-AR') : '-'}
                      </div>
                      <div className="col-span-2 text-right pr-3 font-mono text-xs font-black">
                        ${(item.unitPrice ? item.unitPrice * item.qty : 0).toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}

                  {/* FILAS EN BLANCO PARA COMPLETAR EL FORMATO REMITO */}
                  {Array.from({ length: Math.max(0, 4 - parsedItems.length) }).map((_, emptyIdx) => (
                    <div key={`empty-${emptyIdx}`} className="grid grid-cols-12 divide-x-2 divide-black h-8 bg-white">
                      <div className="col-span-6"></div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2"></div>
                      <div className="col-span-2"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN FOOTER: VALOR TOTAL, FECHA DE DESPACHO, VENDEDOR Y OBSERVACIONES */}
              <div className="mt-4 border-2 border-black grid grid-cols-1 sm:grid-cols-12 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black text-xs font-bold">
                
                {/* COLUMNA IZQUIERDA: METADATOS Y OBSERVACIONES */}
                <div className="sm:col-span-8 divide-y-2 divide-black">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black bg-white p-2 text-[11px]">
                    <div>
                      <span className="font-black uppercase block text-[10px] text-gray-600">Fecha de despacho:</span>
                      <span className="font-mono font-bold">{detailOrder.estimatedDeliveryDate || 'A confirmar'}</span>
                      <span className="block text-[9px] uppercase font-black text-brand-purple mt-0.5">
                        ESTADO: {detailOrder.status}
                      </span>
                    </div>
                    <div className="pt-2 sm:pt-0">
                      <span className="font-black uppercase block text-[10px] text-gray-600">Vendedor:</span>
                      <span className="font-bold">{detailOrder.salesChannel || 'TIENDA WEB'}</span>
                    </div>
                    <div className="pt-2 sm:pt-0">
                      <span className="font-black uppercase block text-[10px] text-gray-600">Forma de pago:</span>
                      <span className="font-bold text-emerald-700">{detailOrder.paymentMethod || 'Mercado Pago'}</span>
                      <span className="block text-[9px] uppercase font-black text-emerald-600">
                        ({detailOrder.paymentStatus || 'PAGADO'})
                      </span>
                    </div>
                  </div>

                  {/* OBSERVACIONES Y DESGLOSE */}
                  <div className="p-2.5 bg-white space-y-1 text-[11px]">
                    <span className="font-black uppercase block text-[10px] text-gray-600">Observaciones:</span>
                    <div className="text-gray-800 leading-snug font-medium space-y-0.5">
                      {detailOrder.isCustomOrder && (
                        <p className="font-bold text-pink-700">• Pedido Personalizado de Taller Custom.</p>
                      )}
                      {detailOrder.appliedCouponCode && (
                        <p className="font-bold text-purple-800">• Cupón Aplicado: {detailOrder.appliedCouponCode}</p>
                      )}
                      {detailOrder.trackingNumber && (
                        <p className="font-mono text-black font-bold">• Seguimiento: {detailOrder.trackingNumber}</p>
                      )}
                      {detailOrder.discountAmount ? (
                        <p className="text-emerald-700 font-bold">• Descuento: -${detailOrder.discountAmount.toLocaleString('es-AR')}</p>
                      ) : null}
                      {detailOrder.shippingCost ? (
                        <p className="text-gray-700">• Costo de envío: ${detailOrder.shippingCost.toLocaleString('es-AR')}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: VALOR TOTAL DEL PEDIDO (GRAN CUADRO HIGHLIGHTED) */}
                <div className="sm:col-span-4 bg-yellow-50 p-4 flex flex-col justify-between text-center items-center font-black">
                  <span className="uppercase text-xs text-black border-b-2 border-black pb-1 w-full tracking-wider">
                    Valor total del pedido:
                  </span>
                  <div className="my-auto py-3 text-2xl sm:text-3xl font-mono text-black tracking-tight">
                    ${detailOrder.total.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-gray-600 font-bold uppercase">PESOS ARGENTINOS (ARS)</span>
                </div>
              </div>

              {/* BARRA DE BOTONES DE ACCIÓN */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
                <button
                  onClick={() => window.print()}
                  className="bg-black text-white hover:bg-brand-purple border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-brutal-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" /> IMPRIMIR FICHA
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const ord = detailOrder;
                      setDetailOrder(null);
                      handleOpenEditOrder(ord);
                    }}
                    className="bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-brutal-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit className="w-4 h-4" /> EDITAR ORDEN
                  </button>
                  <button
                    onClick={() => setDetailOrder(null)}
                    className="bg-white text-black hover:bg-gray-200 border-2 border-black px-5 py-2 text-xs font-black uppercase shadow-brutal-xs cursor-pointer"
                  >
                    CERRAR
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* PRODUCT DETAIL OVERLAY MODAL */}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img src={detailProduct.image} alt={detailProduct.name} onError={handleProductImageError} className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0" />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400 block">{detailProduct.sku || `BTC-${detailProduct.id.slice(-4).toUpperCase()}`}</span>
                  <h3 className="font-bold text-slate-100 text-sm leading-tight">{detailProduct.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Precio Público</span>
                <span className="font-extrabold text-emerald-400 text-base">${detailProduct.price.toFixed(2)} ARS</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Precio Costo</span>
                <span className="font-bold text-slate-200 text-sm">
                  {detailProduct.costPrice ? `$${detailProduct.costPrice.toFixed(2)}` : 'No especificado'}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Stock Total</span>
                <span className="font-bold text-slate-200 text-sm block">{calculateTotalProductStock(detailProduct)} unidades</span>
                {getProductStockStatus(detailProduct).hasOutOfStockVariations && (
                  <span className="text-[10px] font-bold text-amber-400 block mt-0.5">
                    Tiene variantes agotadas
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">Categoría: <strong className="text-slate-200">{detailProduct.category}</strong></span>
                  <span className="text-slate-400 font-medium">Estilos: <strong className="text-slate-200">#{detailProduct.vibe.join(', #')}</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 font-medium">Canales: <strong className="text-slate-200">{detailProduct.salesChannel || 'Web & Local'}</strong></span>
                  <span className="text-slate-400 font-medium">Fecha Alta: <strong className="text-slate-200">{detailProduct.dateAdded || '01/01/2026'}</strong></span>
                </div>
              </div>

              {detailProduct.description && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Descripción</span>
                  <p className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-slate-300 font-medium leading-relaxed">
                    {detailProduct.description}
                  </p>
                </div>
              )}

              {/* VARIACIONES CON STOCK DESGLOSADO */}
              {(() => {
                const varGroups = (detailProduct.variations && detailProduct.variations.length > 0)
                  ? detailProduct.variations
                  : getDefaultVariationsForCategory(detailProduct.category);
                
                if (!varGroups || varGroups.length === 0) return null;

                return (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Variaciones y Estructura de Atributos ({varGroups.length} grupos)
                      </span>
                      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 space-y-3">
                        {varGroups.map((vg: ProductVariationGroup) => (
                          <div key={vg.name} className="space-y-1 border-b border-slate-800/60 pb-2 last:border-b-0 last:pb-0">
                            <strong className="text-slate-200 text-xs block">{vg.name}:</strong>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {vg.options.map((opt: ProductVariationOption | string, i: number) => {
                                const lbl = getOptionLabel(opt);
                                const stk = getOptionStock(opt);
                                const delta = getOptionPriceDelta(opt);
                                const isOut = stk === 0;

                                return (
                                  <span
                                    key={i}
                                    className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 ${
                                      isOut
                                        ? 'bg-red-950/60 text-red-300 border-red-800/70'
                                        : 'bg-slate-950 text-slate-300 border-slate-800'
                                    }`}
                                  >
                                    <strong>{lbl}</strong>
                                    {delta > 0 && <span className="text-pink-400 text-[10px]">(+${delta})</span>}
                                    {stk !== undefined && (
                                      <span className={`text-[10px] font-mono font-bold px-1 rounded ${
                                        isOut ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-brand-yellow'
                                      }`}>
                                        {isOut ? 'SIN STOCK' : `${stk} un.`}
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COMBINATION STOCKS MATRIX DISPLAY */}
                    {detailProduct.variantStocks && Object.keys(detailProduct.variantStocks).length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Matriz de Stock por Combinación ({Object.keys(detailProduct.variantStocks).length} combinaciones)
                        </span>
                        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                          {Object.entries(detailProduct.variantStocks).map(([comboKey, stk]) => {
                            const isOut = stk === 0;
                            return (
                              <div key={comboKey} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-950/60 border border-slate-800">
                                <span className="font-mono text-[11px] text-slate-300 truncate">{comboKey}</span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isOut ? 'bg-red-500/20 text-red-400 border border-red-800/80' : 'bg-slate-800 text-brand-yellow'
                                }`}>
                                  {isOut ? 'SIN STOCK' : `${stk} un.`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const prod = detailProduct;
                  setDetailProduct(null);
                  handleOpenEditProduct(prod);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-blue-400" /> Editar Producto
              </button>
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL OVERLAY MODAL */}
      {detailCustomer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto"
          onClick={() => setDetailCustomer(null)}
        >
          <div 
            className={`w-full max-w-xl my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors p-6 space-y-5 max-h-[90vh] overflow-y-auto ${
              isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className={`flex items-center justify-between border-b pb-3 ${
              isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${
                  isAdminDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-gray-100 border-gray-300 text-gray-800'
                }`}>
                  {detailCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className={`font-bold text-base leading-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    {detailCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-medium">
                    <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}>{detailCustomer.email}</span>
                    {detailCustomer.phone && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className={`flex items-center gap-1 font-mono text-[11px] ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          <Phone className="w-3 h-3 text-emerald-500" /> {detailCustomer.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isAdminDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className={`p-3 rounded-xl border ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pedidos</span>
                <span className={`font-extrabold text-sm ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{detailCustomer.ordersCount}</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gastado</span>
                <span className="font-extrabold text-emerald-500 text-sm">${detailCustomer.totalSpent.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Puntos Acc.</span>
                <span className="font-extrabold text-amber-500 text-sm">{detailCustomer.points} PTS</span>
              </div>
            </div>

            {/* GENERAL DETAILS */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}>Rango / Nivel:</span>
                <span className="font-bold text-purple-600 dark:text-purple-300 uppercase">{detailCustomer.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}>Fecha de Registro:</span>
                <span className={`font-medium ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{detailCustomer.joinedDate}</span>
              </div>
              {detailCustomer.address && (
                <div className="flex justify-between items-start pt-1 border-t border-gray-200 dark:border-slate-800">
                  <span className={`shrink-0 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Domicilio Principal:</span>
                  <span className={`font-semibold text-right ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    {detailCustomer.address}
                    {detailCustomer.city ? `, ${detailCustomer.city}` : ''}
                    {detailCustomer.province ? ` (${detailCustomer.province})` : ''}
                    {detailCustomer.postalCode ? ` - CP ${detailCustomer.postalCode}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* LINKED ADDRESSES LIST */}
            <div className="space-y-2 text-xs">
              <span className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                <MapPin className="w-3.5 h-3.5 text-pink-500" /> DOMICILIOS VINCULADOS ({detailCustomer.addresses?.length || (detailCustomer.address ? 1 : 0)})
              </span>

              {(!detailCustomer.addresses || detailCustomer.addresses.length === 0) && !detailCustomer.address ? (
                <div className={`p-3 text-center text-xs font-medium border border-dashed rounded-xl ${
                  isAdminDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-300 text-gray-500'
                }`}>
                  El cliente aún no tiene domicilios registrados.
                </div>
              ) : (
                <div className="space-y-2">
                  {detailCustomer.addresses && detailCustomer.addresses.length > 0 ? (
                    detailCustomer.addresses.map((addr: CustomerAddress) => (
                      <div 
                        key={addr.id}
                        className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                          isAdminDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                            {addr.street}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              PRINCIPAL
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {addr.city}, {addr.province} {addr.postalCode ? `(CP ${addr.postalCode})` : ''}
                        </div>
                        {addr.notes && (
                          <span className={`text-[10px] italic mt-0.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Obs: {addr.notes}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                      isAdminDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          {detailCustomer.address}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          PRINCIPAL
                        </span>
                      </div>
                      <div className={`text-[11px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        {detailCustomer.city || 'CABA'}, {detailCustomer.province || 'Buenos Aires'} {detailCustomer.postalCode ? `(CP ${detailCustomer.postalCode})` : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INTERNAL NOTES */}
            {detailCustomer.notes && (
              <div className="space-y-1.5 text-xs">
                <span className={`text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  <FileText className="w-3.5 h-3.5 text-amber-500" /> NOTAS INTERNAS DEL CLIENTE
                </span>
                <p className={`p-3 rounded-xl border font-medium leading-relaxed ${
                  isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {detailCustomer.notes}
                </p>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className={`border-t pt-4 flex items-center justify-end gap-3 -mx-6 -mb-6 px-6 py-4 mt-4 ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <button
                onClick={() => setDetailCustomer(null)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isAdminDarkMode 
                    ? 'border-slate-800 text-slate-300 hover:bg-slate-900' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                }`}
              >
                CERRAR
              </button>
              <button
                onClick={() => {
                  const cust = detailCustomer;
                  setDetailCustomer(null);
                  handleOpenEditCustomer(cust);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-2 ${
                  isAdminDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <Edit className="w-4 h-4" /> EDITAR CLIENTE Y DOMICILIOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE DETAIL OVERLAY MODAL */}
      {detailExpense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400 block">#{detailExpense.id}</span>
                <h3 className="font-bold text-slate-100 text-sm leading-tight">{detailExpense.supplier}</h3>
              </div>
              <button
                onClick={() => setDetailExpense(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Categoría</span>
                <span className="font-bold text-slate-200">{detailExpense.category}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Método de Pago</span>
                <span className="font-bold text-slate-200">{detailExpense.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Concepto / Descripción</span>
              <p className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 text-slate-300 font-medium leading-relaxed">
                {detailExpense.description}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Monto del Gasto</span>
                <span className="text-xl font-extrabold text-amber-400">${detailExpense.amount.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const exp = detailExpense;
                    setDetailExpense(null);
                    handleOpenEditExpense(exp);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-400" /> Editar Gasto
                </button>
                <button
                  onClick={() => setDetailExpense(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
