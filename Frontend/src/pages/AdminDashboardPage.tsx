import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Search, Plus, Edit, Trash2, Tag, TrendingUp, BarChart3, PieChart, Users, AlertTriangle, LogOut, Award, Receipt, Sparkles, Calendar, Store, Globe, Smartphone, LayoutGrid, List, Eye, EyeOff, X, Printer, Sun, Moon, MapPin, Phone, FileText, Wrench, Clock, Truck, CheckCircle2, RotateCcw, XCircle, ChevronDown, ChevronUp, SlidersHorizontal, Layers, Camera, Wallet, Banknote, CreditCard, Columns, ExternalLink } from 'lucide-react';
import type { Product, AdminOrder, OrderStatus, CategoryItem, VibeItem, BadgeItem, User, RewardItem, CustomerAddress, RewardCategoryItem } from '../types/types';
import { handleProductImageError, calculateTotalProductStock, getOptionLabel, getProductStockStatus, getOptionPriceDelta, isProductOnSale, getEffectiveProductBadge, getAllCombinations, getCombinationKey, getCombinationStock, formatKeyToCleanLabel, calculateDiscountPercentage, getSpanishFormattedDate, isProductMatchingSearch } from '../types/types';
import { clientsApi, expensesApi, paymentsRewardsApi } from '../services/api';
import { AddEditProductModal } from '../components/admin/AddEditProductModal';
import { ProductVariationsMatrixModal } from '../components/admin/ProductVariationsMatrixModal';
import { AddCategoryModal } from '../components/admin/AddCategoryModal';
import { CategoryVariationsModal } from '../components/admin/CategoryVariationsModal';
import { AddEditStyleModal } from '../components/admin/AddEditStyleModal';
import { AddEditBadgeModal } from '../components/admin/AddEditBadgeModal';
import { AddOrderModal } from '../components/admin/AddOrderModal';
import { AddExpenseModal, type AdminExpense } from '../components/admin/AddExpenseModal';
import { AddRewardAdminModal } from '../components/admin/AddRewardAdminModal';
import { AddEditRewardCategoryModal } from '../components/admin/AddEditRewardCategoryModal';
import { AddEditCustomerModal, type AdminCustomer } from '../components/admin/AddEditCustomerModal';
import { AdminCustomProductsManager } from '../components/admin/AdminCustomProductsManager';
import { AdminSuppliersAndCategoriesManager } from '../components/admin/AdminSuppliersAndCategoriesManager';
import { AdminGeneralTablesManager } from '../components/admin/AdminGeneralTablesManager';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { AdminSectionLoader } from '../components/ui/LoadingScreen';
import { useDebounce } from '../hooks/useDebounce';

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

const downloadCsvReport = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined | null>>
) => {
  const escapeCsvCell = (val: string | number | undefined | null): string => {
    const str = val === undefined || val === null ? '' : String(val);
    const cleaned = str.replace(/\r?\n|\r/g, ' ').replace(/"/g, '""');
    return `"${cleaned}"`;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCsvCell).join(';'), ...rows.map((r) => r.map(escapeCsvCell).join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  // Shared Rewards Management Props
  rewards?: RewardItem[];
  onSaveReward?: (reward: RewardItem) => void;
  onDeleteReward?: (rewardId: string) => void;
  // Shared Reward Categories Management Props
  rewardCategories?: RewardCategoryItem[];
  onSaveRewardCategory?: (category: RewardCategoryItem) => void;
  onDeleteRewardCategory?: (categoryId: string) => void;
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
  rewards: rewardsProp,
  onSaveReward,
  onDeleteReward,
  rewardCategories: rewardCategoriesProp,
  onSaveRewardCategory,
  onDeleteRewardCategory,
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
  const [detailActiveImgIdx, setDetailActiveImgIdx] = useState<number>(0);
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

  const [isRewardCategoryModalOpen, setIsRewardCategoryModalOpen] = useState(false);
  const [editingRewardCategory, setEditingRewardCategory] = useState<RewardCategoryItem | null>(null);
  const [rewardSubTab, setRewardSubTab] = useState<'parallel' | 'rewards' | 'categories'>('parallel');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [matrixProduct, setMatrixProduct] = useState<Product | null>(null);

  // TAXONOMY & MASTER TABLES SUB-TABS
  const [expenseSubTab, setExpenseSubTab] = useState<'expenses' | 'suppliers' | 'categories'>('expenses');
  const [categorySubTab, setCategorySubTab] = useState<'categories' | 'marketing' | 'geography' | 'payments'>('categories');
  const [managingVariationsCategory, setManagingVariationsCategory] = useState<CategoryItem | null>(null);

  const handleOpenMatrixModal = (product: Product) => {
    if (product.isUnique) return;
    setMatrixProduct(product);
  };

  const handleToggleProductVisibility = (prod: Product) => {
    const isNowHidden = !(prod.hiddenFromCatalog || prod.isRewardOnly);
    const updated: Product = {
      ...prod,
      hiddenFromCatalog: isNowHidden,
      isRewardOnly: isNowHidden,
    };
    onEditProduct(updated);
  };

  const handleSaveMatrixProduct = (updatedProduct: Product) => {
    onEditProduct(updatedProduct);
    setMatrixProduct(null);
  };

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
  const [rewardCategorySearchQuery, setRewardCategorySearchQuery] = useState<string>('');
  const [selectedRewardCategoryFilter, setSelectedRewardCategoryFilter] = useState<string>('TODOS');
  const [tagSearchQuery, setTagSearchQuery] = useState<string>('');

  // DEBOUNCED SEARCH VALUES (300ms)
  const debouncedOrderSearch = useDebounce(orderSearchQuery, 300);
  const debouncedInventorySearch = useDebounce(inventorySearchQuery, 300);
  const debouncedCustomerSearch = useDebounce(customerSearchQuery, 300);
  const debouncedExpenseSearch = useDebounce(expenseSearchQuery, 300);
  const debouncedRewardSearch = useDebounce(rewardSearchQuery, 300);
  const debouncedRewardCategorySearch = useDebounce(rewardCategorySearchQuery, 300);
  const debouncedTagSearch = useDebounce(tagSearchQuery, 300);

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
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'TODOS' | 'UNIQUE' | 'OUT_OF_STOCK' | 'PARTIAL' | 'NORMAL' | 'OFERTA' | 'REWARDS'>('TODOS');
  const [inventorySalesChannelFilter, setInventorySalesChannelFilter] = useState<string>('TODOS');
  const [showAdvancedInventoryFilters, setShowAdvancedInventoryFilters] = useState<boolean>(false);

  // PAGINATION CONTROLS
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const ORDERS_PER_PAGE = 15;

  const [inventoryPage, setInventoryPage] = useState<number>(1);
  const INVENTORY_PER_PAGE = 16;

  const [expensesPage, setExpensesPage] = useState<number>(1);
  const EXPENSES_PER_PAGE = 15;

  // Admin Orders List
  const [localOrders, setLocalOrders] = useState<AdminOrder[]>([]);
  const orders = ordersProp || localOrders;

  // Customers List
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);

  // Expenses List
  const [expenses, setExpenses] = useState<AdminExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [availableExpenseCategories, setAvailableExpenseCategories] = useState<any[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);

  // Admin Rewards List
  const [adminRewards, setAdminRewards] = useState<RewardItem[]>(rewardsProp || []);
  const [adminRewardCategories, setAdminRewardCategories] = useState<RewardCategoryItem[]>(rewardCategoriesProp || []);

  const mapBackendCustomerToAdmin = (c: any, fallback?: Partial<AdminCustomer>): AdminCustomer => {
    const rawDomicilios = Array.isArray(c.domicilios) ? c.domicilios : [];
    const mappedAddresses: CustomerAddress[] = rawDomicilios.map((d: any) => ({
      id: String(d.idDomicilio),
      label: d.nombreDomicilio || 'DOMICILIO',
      street: `${d.calle || ''}${d.altura ? ` ${d.altura}` : ''}${d.depto ? `, ${d.depto}` : ''}`.trim(),
      city: d.localidad?.localidad || '',
      province: d.localidad?.provincia?.provincia || '',
      postalCode: d.codigoPostal || '',
      idLocalidad: d.idLocalidad,
      isDefault: Boolean(d.esPredeterminado),
    }));
    const primaryAddr = mappedAddresses.find((a) => a.isDefault) || mappedAddresses[0];

    return {
      id: String(c.idCliente),
      name: c.nombreCompleto,
      email: c.correo,
      phone: c.telefono || undefined,
      role: 'CLIENTE',
      ordersCount: c._count?.pedidos || 0,
      totalSpent: Number(c.totalGastado || fallback?.totalSpent || 0),
      points: Number(c.puntos || 0),
      joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-AR') : (fallback?.joinedDate || ''),
      address: primaryAddr?.street || fallback?.address,
      city: primaryAddr?.city || fallback?.city,
      province: primaryAddr?.province || fallback?.province,
      postalCode: primaryAddr?.postalCode || fallback?.postalCode,
      notes: fallback?.notes,
      addresses: mappedAddresses.length > 0 ? mappedAddresses : fallback?.addresses,
    };
  };

  useEffect(() => {
    clientsApi
      .getAll()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setCustomers(res.data.map((c: any) => mapBackendCustomerToAdmin(c)));
        }
      })
      .finally(() => {
        setIsLoadingCustomers(false);
      });

    expensesApi
      .getExpenses()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setExpenses(
            res.data.map((e: any) => ({
              id: `EXP-${e.idGasto}`,
              supplierId: e.idProveedor,
              supplier: e.proveedor?.razonSocial || 'Proveedor',
              categoryId: e.idCategoriaGasto,
              category: e.categoriaGasto?.nombreCategoria || 'GENERAL',
              description: e.conceptoGasto,
              amount: Number(e.montoTotal),
              paymentMethodId: e.idMetodoPago,
              paymentMethod: e.metodoPago?.nombreMetodoPago || 'DIGITAL',
              receiptUrl: e.comprobanteUrl || undefined,
              date: new Date(e.fechaGasto).toLocaleDateString('es-AR'),
            }))
          );
        }
      })
      .finally(() => {
        setIsLoadingExpenses(false);
      });

    expensesApi.getSuppliers(true).then((res) => {
      if (res.success && res.data) setAvailableSuppliers(res.data);
    });

    expensesApi.getExpenseCategories(true).then((res) => {
      if (res.success && res.data) setAvailableExpenseCategories(res.data);
    });

    paymentsRewardsApi.getPaymentMethods(true).then((res) => {
      if (res.success && res.data) setAvailablePaymentMethods(res.data);
    });
  }, []);

  useEffect(() => {
    if (rewardsProp) {
      setAdminRewards(rewardsProp);
    }
  }, [rewardsProp]);

  useEffect(() => {
    if (rewardCategoriesProp) {
      setAdminRewardCategories(rewardCategoriesProp);
    }
  }, [rewardCategoriesProp]);

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

  // DELETE CONFIRMATION MODAL STATE
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    description?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestDeleteConfirmation = (config: {
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setDeleteConfirmation({
      isOpen: true,
      title: config.title || 'CONFIRMAR ELIMINACIÓN',
      message: config.message,
      description: config.description || 'Esta acción no se puede deshacer y el registro se eliminará de forma permanente.',
      confirmText: config.confirmText || 'Eliminar Registro',
      onConfirm: config.onConfirm,
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    requestDeleteConfirmation({
      title: 'ELIMINAR PEDIDO',
      message: `¿Estás seguro de que deseas eliminar el pedido #${orderId}?`,
      confirmText: 'Eliminar Pedido',
      onConfirm: () => {
        if (onDeleteOrder) {
          onDeleteOrder(orderId);
        }
        setLocalOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
    });
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

  const syncCustomerAddresses = async (idCliente: number, newAddresses: CustomerAddress[] = [], previousAddresses: CustomerAddress[] = []) => {
    const parseStreetAndNumber = (fullStreet: string) => {
      const match = fullStreet.trim().match(/^(.*?)\s+(\d+)(?:,\s*(.*))?$/);
      if (match) {
        return {
          calle: match[1].trim() || fullStreet.trim(),
          altura: Number(match[2]) || 0,
          depto: match[3]?.trim() || undefined,
        };
      }
      return { calle: fullStreet.trim(), altura: 0, depto: undefined };
    };

    // Delete removed existing addresses
    for (const oldAddr of previousAddresses) {
      const oldIdNum = Number(oldAddr.id);
      if (!isNaN(oldIdNum) && oldIdNum > 0 && !newAddresses.some((a) => a.id === oldAddr.id)) {
        await clientsApi.deleteDomicilio(idCliente, oldIdNum).catch(() => {});
      }
    }

    // Create newly linked addresses
    for (const addr of newAddresses) {
      const isExistingDbId = !isNaN(Number(addr.id)) && Number(addr.id) > 0;
      if (!isExistingDbId && addr.street) {
        const { calle, altura, depto } = parseStreetAndNumber(addr.street);
        await clientsApi.createDomicilio(idCliente, {
          idLocalidad: addr.idLocalidad,
          provincia: addr.province || 'Buenos Aires',
          localidad: addr.city || 'Capital Federal',
          nombreDomicilio: addr.label || 'PRINCIPAL',
          calle,
          altura,
          codigoPostal: addr.postalCode || '1000',
          depto,
          esPredeterminado: Boolean(addr.isDefault),
        }).catch(() => {});
      }
    }
  };

  const handleSaveCustomer = async (customerData: AdminCustomer) => {
    try {
      if (editingCustomer) {
        const idNum = Number(customerData.id);
        if (!isNaN(idNum) && idNum > 0) {
          const res = await clientsApi.update(idNum, {
            nombreCompleto: customerData.name,
            telefono: customerData.phone,
            puntos: Number(customerData.points || 0),
          });
          await syncCustomerAddresses(idNum, customerData.addresses || [], editingCustomer.addresses || []);
          const refreshed = await clientsApi.getById(idNum);
          if (refreshed.success && refreshed.data) {
            const updated = mapBackendCustomerToAdmin(refreshed.data, customerData);
            setCustomers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            return;
          } else if (res.success && res.data) {
            const updated = mapBackendCustomerToAdmin(res.data, customerData);
            setCustomers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            return;
          }
        }
      } else {
        const res = await clientsApi.create({
          nombreCompleto: customerData.name,
          correo: customerData.email,
          telefono: customerData.phone,
          puntos: Number(customerData.points || 0),
          contrasenaHash: 'admin_client_placeholder',
        });
        if (res.success && res.data) {
          const c = res.data;
          await syncCustomerAddresses(c.idCliente, customerData.addresses || [], []);
          const refreshed = await clientsApi.getById(c.idCliente);
          const created = mapBackendCustomerToAdmin(
            refreshed.success && refreshed.data ? refreshed.data : c,
            customerData
          );
          setCustomers((prev) => [created, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.error('[SaveCustomer API Error]:', err);
    }

    if (editingCustomer) {
      setCustomers((prev) => prev.map((c) => (c.id === customerData.id ? customerData : c)));
    } else {
      setCustomers((prev) => [customerData, ...prev]);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    const label = cust ? cust.name : id;
    requestDeleteConfirmation({
      title: 'ELIMINAR CLIENTE',
      message: `¿Estás seguro de que deseas eliminar al cliente "${label}" de la base de datos?`,
      confirmText: 'Eliminar Cliente',
      onConfirm: async () => {
        try {
          const idNum = Number(id);
          if (!isNaN(idNum)) {
            await clientsApi.deleteClient(idNum);
          }
        } catch (err) {
          console.error('[DeleteCustomer API Error]:', err);
        }
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      },
    });
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

  const handleSaveExpense = async (expenseData: AdminExpense) => {
    try {
      const idProveedor =
        expenseData.supplierId ||
        availableSuppliers.find(
          (s) => s.razonSocial.toUpperCase() === expenseData.supplier.toUpperCase()
        )?.idProveedor;

      const idCategoriaGasto =
        expenseData.categoryId ||
        availableExpenseCategories.find(
          (c) => c.nombreCategoria.toUpperCase() === expenseData.category.toUpperCase()
        )?.idCategoriaGasto;

      const idMetodoPago =
        expenseData.paymentMethodId ||
        availablePaymentMethods.find(
          (m) => m.nombreMetodoPago.toUpperCase().includes(expenseData.paymentMethod.toUpperCase())
        )?.idMetodoPago;

      if (editingExpense) {
        const numericId = Number(expenseData.id.replace('EXP-', ''));
        if (!isNaN(numericId)) {
          const res = await expensesApi.updateExpense(numericId, {
            conceptoGasto: expenseData.description,
            montoTotal: expenseData.amount,
            comprobanteUrl: expenseData.receiptUrl || null,
            idProveedor,
            proveedor: expenseData.supplier,
            idCategoriaGasto,
            categoriaGasto: expenseData.category,
            idMetodoPago,
            metodoPago: expenseData.paymentMethod,
          });
          if (res.success && res.data) {
            const e = res.data;
            if (e.proveedor && !availableSuppliers.some((s) => s.idProveedor === e.proveedor.idProveedor)) {
              setAvailableSuppliers((prev) => [...prev, e.proveedor]);
            }
            if (e.categoriaGasto && !availableExpenseCategories.some((c) => c.idCategoriaGasto === e.categoriaGasto.idCategoriaGasto)) {
              setAvailableExpenseCategories((prev) => [...prev, e.categoriaGasto]);
            }
            const updated: AdminExpense = {
              id: `EXP-${e.idGasto}`,
              supplierId: e.idProveedor,
              supplier: e.proveedor?.razonSocial || expenseData.supplier,
              categoryId: e.idCategoriaGasto,
              category: e.categoriaGasto?.nombreCategoria || expenseData.category,
              description: e.conceptoGasto,
              amount: Number(e.montoTotal),
              paymentMethodId: e.idMetodoPago,
              paymentMethod: e.metodoPago?.nombreMetodoPago || expenseData.paymentMethod,
              receiptUrl: e.comprobanteUrl || undefined,
              date: new Date(e.fechaGasto).toLocaleDateString('es-AR'),
            };
            setExpenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            return;
          }
        }
      } else {
        const res = await expensesApi.createExpense({
          conceptoGasto: expenseData.description,
          montoTotal: expenseData.amount,
          comprobanteUrl: expenseData.receiptUrl || undefined,
          idProveedor,
          proveedor: expenseData.supplier,
          idCategoriaGasto,
          categoriaGasto: expenseData.category,
          idMetodoPago,
          metodoPago: expenseData.paymentMethod,
        });
        if (res.success && res.data) {
          const e = res.data;
          if (e.proveedor && !availableSuppliers.some((s) => s.idProveedor === e.proveedor.idProveedor)) {
            setAvailableSuppliers((prev) => [...prev, e.proveedor]);
          }
          if (e.categoriaGasto && !availableExpenseCategories.some((c) => c.idCategoriaGasto === e.categoriaGasto.idCategoriaGasto)) {
            setAvailableExpenseCategories((prev) => [...prev, e.categoriaGasto]);
          }
          const created: AdminExpense = {
            id: `EXP-${e.idGasto}`,
            supplierId: e.idProveedor,
            supplier: e.proveedor?.razonSocial || expenseData.supplier,
            categoryId: e.idCategoriaGasto,
            category: e.categoriaGasto?.nombreCategoria || expenseData.category,
            description: e.conceptoGasto,
            amount: Number(e.montoTotal),
            paymentMethodId: e.idMetodoPago,
            paymentMethod: e.metodoPago?.nombreMetodoPago || expenseData.paymentMethod,
            receiptUrl: e.comprobanteUrl || undefined,
            date: new Date(e.fechaGasto).toLocaleDateString('es-AR'),
          };
          setExpenses((prev) => [created, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.error('[SaveExpense API Error]:', err);
    }

    if (editingExpense) {
      setExpenses((prev) => prev.map((e) => (e.id === expenseData.id ? expenseData : e)));
    } else {
      setExpenses((prev) => [expenseData, ...prev]);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    const label = exp ? `${exp.supplier} ($${exp.amount.toLocaleString('es-AR')})` : `#${id}`;
    requestDeleteConfirmation({
      title: 'ELIMINAR GASTO',
      message: `¿Estás seguro de que deseas eliminar el registro de gasto de ${label}?`,
      confirmText: 'Eliminar Gasto',
      onConfirm: async () => {
        try {
          const numericId = Number(id.replace('EXP-', ''));
          if (!isNaN(numericId)) {
            await expensesApi.deleteExpense(numericId);
          }
        } catch (err) {
          console.error('[DeleteExpense API Error]:', err);
        }
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      },
    });
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
    if (onSaveReward) {
      onSaveReward(rewardData);
    }
    if (editingReward) {
      setAdminRewards((prev) => prev.map((r) => (r.id === rewardData.id ? rewardData : r)));
    } else {
      setAdminRewards((prev) => [rewardData, ...prev]);
    }
  };

  const handleDeleteReward = (id: string) => {
    const reward = adminRewards.find((r) => r.id === id);
    const label = reward ? reward.title : id;
    requestDeleteConfirmation({
      title: 'ELIMINAR PREMIO',
      message: `¿Estás seguro de que deseas eliminar el premio "${label}" del club?`,
      confirmText: 'Eliminar Premio',
      onConfirm: () => {
        if (onDeleteReward) {
          onDeleteReward(id);
        }
        setAdminRewards((prev) => prev.filter((r) => r.id !== id));
      },
    });
  };

  // REWARD CATEGORY CRUD HANDLERS
  const handleOpenAddRewardCategory = () => {
    setEditingRewardCategory(null);
    setIsRewardCategoryModalOpen(true);
  };

  const handleOpenEditRewardCategory = (category: RewardCategoryItem) => {
    setEditingRewardCategory(category);
    setIsRewardCategoryModalOpen(true);
  };

  const handleSaveRewardCategory = (categoryData: RewardCategoryItem) => {
    if (onSaveRewardCategory) {
      onSaveRewardCategory(categoryData);
    }
    if (editingRewardCategory) {
      setAdminRewardCategories((prev) => prev.map((c) => (c.id === categoryData.id ? categoryData : c)));
    } else {
      setAdminRewardCategories((prev) => [...prev, categoryData]);
    }
    setIsRewardCategoryModalOpen(false);
    setEditingRewardCategory(null);
  };

  const handleDeleteRewardCategory = (id: string) => {
    const category = adminRewardCategories.find((c) => c.id === id);
    const label = category ? category.name : id;
    const associatedCount = adminRewards.filter(
      (r) => r.categoryId === id || r.category === label
    ).length;

    requestDeleteConfirmation({
      title: 'ELIMINAR CATEGORÍA DE PREMIO',
      message: `¿Estás seguro de que deseas eliminar la categoría "${label}"?`,
      description: associatedCount > 0
        ? `Advertencia: Hay ${associatedCount} premio(s) vinculado(s) a esta categoría.`
        : undefined,
      confirmText: 'Eliminar Categoría',
      onConfirm: () => {
        if (onDeleteRewardCategory) {
          onDeleteRewardCategory(id);
        }
        setAdminRewardCategories((prev) => prev.filter((c) => c.id !== id));
      },
    });
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
    requestDeleteConfirmation({
      title: 'ELIMINAR PRODUCTO',
      message: `¿Estás seguro de que deseas eliminar "${product.name}" del catálogo?`,
      confirmText: 'Eliminar Producto',
      onConfirm: () => {
        onDeleteProduct(product.id);
      },
    });
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
    requestDeleteConfirmation({
      title: 'ELIMINAR CATEGORÍA',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
      confirmText: 'Eliminar Categoría',
      onConfirm: () => {
        onDeleteCategory(category.id);
      },
    });
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
    requestDeleteConfirmation({
      title: 'ELIMINAR ESTILO',
      message: `¿Estás seguro de que deseas eliminar el Estilo "${vibe.name}"?`,
      confirmText: 'Eliminar Estilo',
      onConfirm: () => {
        onDeleteVibe(vibe.id);
      },
    });
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
      onEditTag?.(tag);
    } else {
      onAddTag?.(tag);
    }
  };

  const handleDeleteTagClick = (tag: BadgeItem) => {
    requestDeleteConfirmation({
      title: 'ELIMINAR ETIQUETA',
      message: `¿Estás seguro de que deseas eliminar la etiqueta "${tag.name}"?`,
      confirmText: 'Eliminar Etiqueta',
      onConfirm: () => {
        onDeleteTag?.(tag.id);
      },
    });
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
    if (debouncedOrderSearch.trim()) {
      const q = debouncedOrderSearch.toLowerCase();
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
    if (inventoryStockFilter === 'REWARDS' && !(p.isRewardOnly || p.hiddenFromCatalog)) {
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
    if (inventoryStockFilter === 'OFERTA' && !isProductOnSale(p)) {
      return false;
    }
    if (inventorySalesChannelFilter !== 'TODOS' && (p.salesChannel || 'AMBOS') !== inventorySalesChannelFilter) {
      return false;
    }
    if (debouncedInventorySearch.trim()) {
      if (!isProductMatchingSearch(p, debouncedInventorySearch)) return false;
    }
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    if (!debouncedCustomerSearch.trim()) return true;
    const q = debouncedCustomerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    if (!debouncedExpenseSearch.trim()) return true;
    const q = debouncedExpenseSearch.toLowerCase();
    return (
      e.supplier.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.paymentMethod.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    );
  });

  const filteredRewardCategories = adminRewardCategories.filter((c) => {
    if (!debouncedRewardCategorySearch.trim()) return true;
    const q = debouncedRewardCategorySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const filteredRewards = adminRewards.filter((r) => {
    if (
      selectedRewardCategoryFilter !== 'TODOS' &&
      r.category !== selectedRewardCategoryFilter &&
      r.categoryId !== selectedRewardCategoryFilter
    ) {
      return false;
    }
    if (!debouncedRewardSearch.trim()) return true;
    const q = debouncedRewardSearch.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.discountValue.toLowerCase().includes(q) ||
      r.codePrefix.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const filteredCategories = categories.filter((c) => {
    if (!debouncedTagSearch.trim()) return true;
    return c.name.toLowerCase().includes(debouncedTagSearch.toLowerCase());
  });

  const filteredVibes = vibes.filter((v) => {
    if (!debouncedTagSearch.trim()) return true;
    return v.name.toLowerCase().includes(debouncedTagSearch.toLowerCase());
  });

  const filteredTags = (tags || []).filter((t) => {
    if (!debouncedTagSearch.trim()) return true;
    return t.name.toLowerCase().includes(debouncedTagSearch.toLowerCase());
  });

  // PAGINATED SLICES
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const validOrdersPage = Math.min(ordersPage, totalOrderPages);
  const paginatedOrders = filteredOrders.slice((validOrdersPage - 1) * ORDERS_PER_PAGE, validOrdersPage * ORDERS_PER_PAGE);

  const totalInventoryPages = Math.max(1, Math.ceil(filteredInventory.length / INVENTORY_PER_PAGE));
  const validInventoryPage = Math.min(inventoryPage, totalInventoryPages);
  const paginatedInventory = filteredInventory.slice((validInventoryPage - 1) * INVENTORY_PER_PAGE, validInventoryPage * INVENTORY_PER_PAGE);

  const totalExpensesPages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE));
  const validExpensesPage = Math.min(expensesPage, totalExpensesPages);
  const paginatedExpenses = filteredExpenses.slice((validExpensesPage - 1) * EXPENSES_PER_PAGE, validExpensesPage * EXPENSES_PER_PAGE);

  useEffect(() => {
    setOrdersPage(1);
  }, [orderStatusFilter, orderTypeFilter, orderSalesChannelFilter, orderShippingFilter, orderStartDateFilter, orderEndDateFilter, debouncedOrderSearch]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventoryCategoryFilter, inventoryVibeFilter, inventoryStockFilter, inventorySalesChannelFilter, debouncedInventorySearch]);

  useEffect(() => {
    setExpensesPage(1);
  }, [debouncedExpenseSearch]);

  const renderPaginationControls = (
    currPage: number,
    totalPages: number,
    totalItems: number,
    onPageChange: (p: number) => void,
    labelSingular: string,
    labelPlural: string
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${
        isAdminDarkMode ? 'border-slate-800 text-slate-300' : 'border-gray-200 text-gray-700'
      }`}>
        <div className="text-xs font-semibold">
          Mostrando página <span className="font-bold text-brand-pink">{currPage}</span> de{' '}
          <span className="font-bold">{totalPages}</span> ({totalItems} {totalItems === 1 ? labelSingular : labelPlural})
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={currPage === 1}
            onClick={() => onPageChange(1)}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdminDarkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            « Primero
          </button>
          <button
            type="button"
            disabled={currPage === 1}
            onClick={() => onPageChange(Math.max(1, currPage - 1))}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdminDarkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            ‹ Anterior
          </button>
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-xs opacity-50">...</span>}
                    <button
                      type="button"
                      onClick={() => onPageChange(p)}
                      className={`min-w-7 h-7 text-xs font-bold rounded border transition-all cursor-pointer ${
                        p === currPage
                          ? 'bg-brand-pink text-white border-brand-pink shadow-xs'
                          : isAdminDarkMode
                          ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                          : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>
          <button
            type="button"
            disabled={currPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currPage + 1))}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdminDarkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Siguiente ›
          </button>
          <button
            type="button"
            disabled={currPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            className={`px-2.5 py-1 text-xs font-bold rounded border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdminDarkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Último »
          </button>
        </div>
      </div>
    );
  };

  // METRICS & ANALYTICS DYNAMIC CALCULATIONS (MATCHING ALL APP DATA)
  const isCashMethod = (method?: string): boolean => {
    if (!method) return false;
    const m = method.toLowerCase();
    return m.includes('efectivo') || m.includes('cash') || m.includes('local') || m.includes('presencial') || m.includes('físic') || m.includes('fisic');
  };

  const formatPaymentMethod = (method?: string): string => {
    return isCashMethod(method) ? 'Dinero Físico' : 'Dinero Digital';
  };

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

  // DISPONIBILIDAD DE DINERO ACTUAL: EFECTIVO VS DIGITAL Y TOTAL SUMADO
  const cashOrders = orders.filter((o) => isCashMethod(o.paymentMethod));
  const digitalOrders = orders.filter((o) => !isCashMethod(o.paymentMethod));
  const cashRevenue = cashOrders.reduce((sum, o) => sum + o.total, 0);
  const digitalRevenue = digitalOrders.reduce((sum, o) => sum + o.total, 0);

  const cashExpenses = expenses.filter((e) => isCashMethod(e.paymentMethod));
  const digitalExpenses = expenses.filter((e) => !isCashMethod(e.paymentMethod));
  const cashExpensesTotal = cashExpenses.reduce((sum, e) => sum + e.amount, 0);
  const digitalExpensesTotal = digitalExpenses.reduce((sum, e) => sum + e.amount, 0);

  const cashBalance = cashRevenue - cashExpensesTotal;
  const digitalBalance = digitalRevenue - digitalExpensesTotal;
  const totalBalance = cashBalance + digitalBalance;

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

  // Dynamic Monthly Sales Data calculated directly from real orders
  const MONTH_DEFINITIONS = [
    { short: 'ENE', fullName: 'Enero' },
    { short: 'FEB', fullName: 'Febrero' },
    { short: 'MAR', fullName: 'Marzo' },
    { short: 'ABR', fullName: 'Abril' },
    { short: 'MAY', fullName: 'Mayo' },
    { short: 'JUN', fullName: 'Junio' },
    { short: 'JUL', fullName: 'Julio' },
    { short: 'AGO', fullName: 'Agosto' },
    { short: 'SEP', fullName: 'Septiembre' },
    { short: 'OCT', fullName: 'Octubre' },
    { short: 'NOV', fullName: 'Noviembre' },
    { short: 'DIC', fullName: 'Diciembre' },
  ];

  const parseOrderDateMonthYear = (dateStr?: string): { monthIndex: number; year: number } | null => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();

    // Format YYYY-MM-DD or ISO string
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIndex = Number(isoMatch[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) return { monthIndex, year };
    }

    // Format DD/MM/YYYY or D/M/YYYY (es-AR locale)
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const monthIndex = Number(slashMatch[2]) - 1;
      const year = Number(slashMatch[3]);
      if (monthIndex >= 0 && monthIndex <= 11) return { monthIndex, year };
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return { monthIndex: parsed.getMonth(), year: parsed.getFullYear() };
    }
    return null;
  };

  const parsedOrdersDates = orders
    .map((o) => ({ order: o, parsed: parseOrderDateMonthYear(o.date) }))
    .filter((entry): entry is { order: AdminOrder; parsed: { monthIndex: number; year: number } } => entry.parsed !== null);

  const chartYear =
    parsedOrdersDates.length > 0
      ? Math.max(...parsedOrdersDates.map((e) => e.parsed.year))
      : new Date().getFullYear();

  const monthlyData = MONTH_DEFINITIONS.map((m, idx) => {
    const ordersInMonth = parsedOrdersDates.filter(
      (e) => e.parsed.monthIndex === idx && e.parsed.year === chartYear
    );
    const revenue = ordersInMonth.reduce((sum, e) => sum + (Number(e.order.total) || 0), 0);
    return {
      month: m.short,
      fullName: m.fullName,
      revenue,
      completedOrders: ordersInMonth.length,
    };
  });

  const maxMonthlyRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const peakMonthData = monthlyData.reduce(
    (best, cur) => (cur.revenue > best.revenue ? cur : best),
    monthlyData[0]
  );

  // Dynamic Top Selling Products calculated from real orders
  const topSellingProducts = products
    .map((prod) => {
      let unitsSold = 0;
      let revenueGenerated = 0;

      orders.forEach((order) => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((line) => {
            const matchesId = line.productId && String(line.productId) === String(prod.id);
            const matchesName =
              !matchesId &&
              line.productName &&
              line.productName.toUpperCase().includes(prod.name.toUpperCase());
            if (matchesId || matchesName) {
              const qty = Number(line.quantity) || 1;
              const price = Number(line.unitPrice) || prod.price;
              unitsSold += qty;
              revenueGenerated += qty * price;
            }
          });
        } else if (order.itemsSummary) {
          const items = splitTopLevelItems(order.itemsSummary);
          items.forEach((itemStr) => {
            if (itemStr.toUpperCase().includes(prod.name.toUpperCase())) {
              const qtyMatch = itemStr.match(/^(\d+)x\s+/i);
              const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
              unitsSold += qty;
              revenueGenerated += qty * prod.price;
            }
          });
        }
      });

      return {
        product: prod,
        unitsSold,
        revenueGenerated,
      };
    })
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueGenerated - a.revenueGenerated)
    .slice(0, 5);

  // Dynamic Category Stats calculated from active products (Monochromatic palette)
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalProductsCount = products.length || 1;
  const categoryStats = Object.keys(categoryCounts).map((catName, idx) => {
    const colors = [
      'bg-slate-900 dark:bg-slate-100',
      'bg-slate-700 dark:bg-slate-300',
      'bg-slate-500 dark:bg-slate-400',
      'bg-slate-400 dark:bg-slate-500',
      'bg-slate-300 dark:bg-slate-600',
    ];
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
      isAdminDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-100/80 text-gray-900'
    }`}>
      
      <div>
        {/* CLEAN ELEGANT ADMIN HEADER */}
        <header className={`border-b backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-50 transition-colors duration-200 ${
          isAdminDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200 shadow-xs'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-900 border-gray-900 text-white'
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
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 shadow-xs'
                }`}
                title="Cambiar Modo Claro / Modo Oscuro"
              >
                {isAdminDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-slate-200" /> Modo Claro
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
                  <Users className="w-4 h-4 text-gray-700 dark:text-slate-300" />
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
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <BarChart3 className="w-4 h-4" /> ANALÍTICA Y MÉTRICAS
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> PEDIDOS ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Package className="w-4 h-4" /> INVENTARIO ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customizer'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Wrench className="w-4 h-4" /> TALLER CUSTOM
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'customers'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Users className="w-4 h-4" /> CLIENTES ({customers.length})
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
                  : (isAdminDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
              }`}
            >
              <Receipt className="w-4 h-4" /> GASTOS Y PROVEEDORES ({expenses.length})
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'rewards'
                  ? (isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-gray-900 text-white shadow-xs')
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
              <Layers className="w-4 h-4" /> TABLAS GENERALES
            </button>
          </div>

          {/* TAB 1: ANALÍTICA & REPORTES DE DATOS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* BLOQUE 1: DISPONIBILIDAD DE DINERO ACTUAL (FÍSICO, DIGITAL Y TOTAL SUMADO) */}
              <div className="space-y-3">
                <div>
                  <h3 className={`text-sm font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <Wallet className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-700'}`} />
                    DISPONIBILIDAD DE DINERO ACTUAL
                  </h3>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Arqueo consolidado: dinero físico en caja vs. fondos digitales en cuentas
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CARD 1: DINERO FÍSICO */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                      <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}>DINERO FÍSICO (EFECTIVO)</span>
                      <Banknote className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                      isAdminDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${cashBalance.toLocaleString('es-AR')} <span className="text-sm font-bold text-gray-400 dark:text-slate-500">ARS</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      <span>Cobros: <strong className="text-gray-900 dark:text-slate-200 font-bold">${cashRevenue.toLocaleString('es-AR')}</strong></span>
                      <span>Gastos: <strong className="text-gray-900 dark:text-slate-200 font-bold">-${cashExpensesTotal.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>

                  {/* CARD 2: DINERO DIGITAL */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xs' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                      <span className={isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}>DINERO DIGITAL</span>
                      <CreditCard className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black font-display tracking-tight ${
                      digitalBalance < 0
                        ? (isAdminDarkMode ? 'text-slate-200' : 'text-gray-900')
                        : (isAdminDarkMode ? 'text-white' : 'text-gray-900')
                    }`}>
                      ${digitalBalance.toLocaleString('es-AR')} <span className="text-sm font-bold text-gray-400 dark:text-slate-500">ARS</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                      <span>Cobros: <strong className="text-gray-900 dark:text-slate-200 font-bold">${digitalRevenue.toLocaleString('es-AR')}</strong></span>
                      <span>Gastos: <strong className="text-gray-900 dark:text-slate-200 font-bold">-${digitalExpensesTotal.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>

                  {/* CARD 3: TOTAL SUMADO */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isAdminDarkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-md ring-1 ring-slate-700/60'
                      : 'bg-gray-900 border-gray-900 text-white shadow-md'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                      <span className={isAdminDarkMode ? 'text-slate-300 font-extrabold' : 'text-gray-300 font-extrabold'}>TOTAL SUMADO DISPONIBLE</span>
                      <Wallet className={`w-4 h-4 ${isAdminDarkMode ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                      ${totalBalance.toLocaleString('es-AR')} <span className={`text-sm font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>ARS</span>
                    </div>
                    <div className={`pt-3 mt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
                      isAdminDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-800 text-gray-400'
                    }`}>
                      <span>Físico: <strong className="text-white font-bold">${cashBalance.toLocaleString('es-AR')}</strong></span>
                      <span>Digital: <strong className="text-white font-bold">${digitalBalance.toLocaleString('es-AR')}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: MÉTRICAS GENERALES DE OPERACIÓN (4 TARJETAS CLARAS SIN DUPLICAR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>VENTAS TOTALES</span>
                    <TrendingUp className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  </div>
                  <div className={`text-2xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${totalRevenue.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold block ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>{totalOrders} pedidos • Prom: ${avgOrderValue.toLocaleString('es-AR')}</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>GASTOS TOTALES</span>
                    <Receipt className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  </div>
                  <div className={`text-2xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${totalExpenses.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold block ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>{expenses.length} egresos • Margen: {profitMargin}%</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>VALOR INVENTARIO</span>
                    <Package className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  </div>
                  <div className={`text-2xl font-black font-display tracking-tight ${
                    isAdminDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${totalInventoryValue.toLocaleString('es-AR')}
                  </div>
                  <span className={`text-[11px] font-semibold block ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>{products.length} productos registrados</span>
                </div>

                <div className={`border p-4 rounded-xl space-y-1 shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between text-xs font-bold uppercase ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    <span>ALERTAS Y ESTADO</span>
                    <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-amber-500' : (isAdminDarkMode ? 'text-slate-400' : 'text-gray-600')}`} />
                  </div>
                  <div className={`text-2xl font-black font-display tracking-tight ${
                    lowStockProducts.length > 0
                      ? (isAdminDarkMode ? 'text-amber-400' : 'text-amber-800')
                      : (isAdminDarkMode ? 'text-white' : 'text-gray-900')
                  }`}>
                    {lowStockProducts.length} ÍTEMS ALERTA
                  </div>
                  <span className={`text-[11px] font-semibold block ${
                    isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>{pendingOrdersCount} pedidos en confección</span>
                </div>

              </div>

              {/* BLOQUE 3: OPERATORIA Y CANALES DE VENTA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMNA 1 (2 cols): RESUMEN OPERATIVO Y MODALIDADES DE COBRO */}
                <div className={`lg:col-span-2 border p-6 space-y-5 rounded-2xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`border-b pb-3 flex items-center justify-between ${
                    isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <h3 className={`text-base font-black uppercase font-display ${
                      isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                      RESUMEN OPERATIVO Y MODALIDADES
                    </h3>
                    <span className={`text-xs font-mono font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ACTUALIZADO EN TIEMPO REAL</span>
                  </div>

                  {/* 3 mini cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`border p-3.5 space-y-1 rounded-xl ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>TICKET PROMEDIO</span>
                      <div className={`text-lg font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>${avgOrderValue.toLocaleString('es-AR')} ARS</div>
                      <p className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Por orden completada</p>
                    </div>

                    <div className={`border p-3.5 space-y-1 rounded-xl ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>PEDIDOS EN CURSO</span>
                      <div className={`text-lg font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>{pendingOrdersCount} PEDIDOS</div>
                      <p className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pendientes de despacho</p>
                    </div>

                    <div className={`border p-3.5 space-y-1 rounded-xl ${
                      isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>PUNTOS CLIENTES</span>
                      <div className={`text-lg font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalCustomerPoints} PTS</div>
                      <p className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>En cuentas de clientes</p>
                    </div>
                  </div>

                  {/* COMPARATIVA COBROS FÍSICO VS DIGITAL */}
                  <div className="space-y-3 pt-1">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      DISTRIBUCIÓN DE COBRANZAS POR MODALIDAD
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* FÍSICO */}
                      <div className={`border p-4 rounded-xl space-y-2 ${
                        isAdminDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> Dinero Físico
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
                          }`}>
                            {totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0}% de ventas
                          </span>
                        </div>
                        <div className={`text-xl font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ${cashRevenue.toLocaleString('es-AR')} ARS
                        </div>
                        <p className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {cashOrders.length} {cashOrders.length === 1 ? 'pedido procesado' : 'pedidos procesados'} en efectivo
                        </p>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-200'
                        }`}>
                          <div
                            className="h-full bg-slate-500 dark:bg-slate-400 transition-all duration-500"
                            style={{ width: `${totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* DIGITAL */}
                      <div className={`border p-4 rounded-xl space-y-2 ${
                        isAdminDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> Dinero Digital
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
                          }`}>
                            {totalRevenue > 0 ? Math.round((digitalRevenue / totalRevenue) * 100) : 0}% de ventas
                          </span>
                        </div>
                        <div className={`text-xl font-black ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ${digitalRevenue.toLocaleString('es-AR')} ARS
                        </div>
                        <p className={`text-[10px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {digitalOrders.length} {digitalOrders.length === 1 ? 'pedido procesado' : 'pedidos procesados'} electrónicamente
                        </p>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-200'
                        }`}>
                          <div
                            className="h-full bg-slate-900 dark:bg-slate-200 transition-all duration-500"
                            style={{ width: `${totalRevenue > 0 ? (digitalRevenue / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2 (1 col): VENTAS POR CANAL */}
                <div className={`border p-6 space-y-4 rounded-2xl shadow-xs transition-colors flex flex-col justify-between ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div>
                    <h3 className={`text-base font-black uppercase font-display border-b pb-3 ${
                      isAdminDarkMode ? 'text-slate-100 border-slate-800' : 'text-gray-900 border-gray-200'
                    }`}>
                      VENTAS POR CANAL
                    </h3>

                    <div className="space-y-3 pt-3">
                      {/* TIENDA WEB */}
                      <div className={`border p-3.5 space-y-1.5 rounded-xl ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex justify-between text-xs font-black">
                          <span className={`flex items-center gap-1.5 ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> TIENDA WEB
                          </span>
                          <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.web.revenue.toLocaleString('es-AR')} ARS</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-slate-400">
                          <span>{channelStats.web.count} pedidos procesados</span>
                          <span>{totalRevenue > 0 ? Math.round((channelStats.web.revenue / totalRevenue) * 100) : 0}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-slate-700 dark:bg-slate-300"
                            style={{ width: `${totalRevenue > 0 ? (channelStats.web.revenue / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* REDES SOCIALES */}
                      <div className={`border p-3.5 space-y-1.5 rounded-xl ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex justify-between text-xs font-black">
                          <span className={`flex items-center gap-1.5 ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            <Smartphone className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> REDES SOCIALES
                          </span>
                          <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.social.revenue.toLocaleString('es-AR')} ARS</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-slate-400">
                          <span>{channelStats.social.count} pedidos procesados</span>
                          <span>{totalRevenue > 0 ? Math.round((channelStats.social.revenue / totalRevenue) * 100) : 0}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-slate-500 dark:bg-slate-400"
                            style={{ width: `${totalRevenue > 0 ? (channelStats.social.revenue / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* LOCAL FÍSICO */}
                      <div className={`border p-3.5 space-y-1.5 rounded-xl ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex justify-between text-xs font-black">
                          <span className={`flex items-center gap-1.5 ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            <Store className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> LOCAL FÍSICO
                          </span>
                          <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>${channelStats.physical.revenue.toLocaleString('es-AR')} ARS</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-slate-400">
                          <span>{channelStats.physical.count} pedidos procesados</span>
                          <span>{totalRevenue > 0 ? Math.round((channelStats.physical.revenue / totalRevenue) * 100) : 0}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isAdminDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-slate-400 dark:bg-slate-500"
                            style={{ width: `${totalRevenue > 0 ? (channelStats.physical.revenue / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`border-t pt-3 text-[11px] font-semibold text-center ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-500'
                  }`}>
                    Total acumulado: {totalOrders} pedidos ingresados
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
                        isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> TENDENCIA DE INGRESOS MENSUALES ({chartYear})
                      </h3>
                      <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Facturación bruta real por mes en pesos argentinos según pedidos registrados
                      </p>
                    </div>
                  </div>

                  {/* VISUAL BAR CHART WITH RESPONSIVE OVERFLOW FOR MOBILE */}
                  <div className="overflow-x-auto no-scrollbar pb-2">
                    <div className={`h-64 flex items-end justify-between gap-1.5 sm:gap-2.5 pt-10 pb-2 px-1 sm:px-2 border-b min-w-135 sm:min-w-0 ${
                      isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                      {monthlyData.map((item) => {
                        const rawPercent = maxMonthlyRevenue > 0 ? Math.round((item.revenue / maxMonthlyRevenue) * 100) : 0;
                        const heightPercent = item.revenue > 0 ? Math.max(rawPercent, 8) : 3;
                        const formattedShortAmount =
                          item.revenue === 0
                            ? '$0'
                            : item.revenue >= 1000
                            ? `$${(item.revenue / 1000).toFixed(1).replace(/\.0$/, '')}k`
                            : `$${item.revenue}`;

                        return (
                          <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end relative">
                            
                            {/* REVENUE AMOUNT DISPLAYED ABOVE THE BAR */}
                            <span className={`text-[9px] sm:text-[10px] font-bold mb-1 whitespace-nowrap ${
                              item.revenue > 0
                                ? (isAdminDarkMode ? 'text-slate-200' : 'text-gray-900')
                                : (isAdminDarkMode ? 'text-slate-600' : 'text-gray-400')
                            }`}>
                              {formattedShortAmount}
                            </span>

                            {/* BAR */}
                            <div
                              className={`w-full transition-all rounded-t-xs relative ${
                                item.revenue > 0
                                  ? isAdminDarkMode
                                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                                    : 'bg-gray-800 hover:bg-gray-900 border border-gray-700'
                                  : isAdminDarkMode
                                  ? 'bg-slate-800/50 border border-slate-800'
                                  : 'bg-gray-200/70 border border-gray-200'
                              }`}
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border shadow-lg z-20 ${
                                isAdminDarkMode ? 'bg-black text-slate-100 border-slate-700' : 'bg-gray-900 text-white border-gray-800'
                              }`}>
                                {item.completedOrders} {item.completedOrders === 1 ? 'pedido' : 'pedidos'} (${item.revenue.toLocaleString('es-AR')} ARS)
                              </div>
                            </div>

                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                              item.revenue > 0
                                ? (isAdminDarkMode ? 'text-slate-300' : 'text-gray-800')
                                : (isAdminDarkMode ? 'text-slate-500' : 'text-gray-400')
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
                    <span className={`font-black ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      {peakMonthData && peakMonthData.revenue > 0
                        ? `Pico máximo: ${peakMonthData.fullName} ($${peakMonthData.revenue.toLocaleString('es-AR')} ARS)`
                        : 'Pico máximo: Sin ventas registradas ($0 ARS)'}
                    </span>
                  </div>
                </div>

                {/* CATEGORY DISTRIBUTION CHART (1 COL) */}
                <div className={`border p-6 space-y-6 rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className={`border-b pb-3 ${isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <h3 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                      isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                      <PieChart className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> DISTRIBUCIÓN DE CATÁLOGO
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
                          <span className={isAdminDarkMode ? 'text-white' : 'text-gray-900'}>{cat.percent}%</span>
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
                    {topSellingProducts.map(({ product: prod, unitsSold, revenueGenerated }, idx) => (
                      <div key={prod.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded font-black text-xs flex items-center justify-center ${
                            isAdminDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-gray-900 text-white'
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
                          <span className={`text-xs font-black block ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>${revenueGenerated.toLocaleString('es-AR')} ARS</span>
                          <span className={`text-[10px] font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{unitsSold} un. vendidas</span>
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
                    isAdminDarkMode ? 'text-slate-100 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${lowStockProducts.length > 0 ? 'text-amber-500' : 'text-gray-500'}`} /> REPOSICIÓN DE STOCK
                  </h3>

                  {lowStockProducts.length === 0 ? (
                    <p className={`text-xs font-semibold py-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Todo el inventario tiene niveles óptimos de stock.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {lowStockProducts.map((prod) => (
                        <div key={prod.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                          isAdminDarkMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50'
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
                              isAdminDarkMode ? 'text-amber-400 bg-amber-400/10 border-amber-500/40' : 'text-amber-900 bg-amber-100 border-amber-300'
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
                    isAdminDarkMode ? 'text-slate-100 border-slate-800' : 'text-gray-900 border-gray-200'
                  }`}>
                    <Users className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> MEJORES CLIENTES (TOP FACTURACIÓN)
                  </h3>

                  <div className="space-y-2.5">
                    {topCustomers.map((cust) => (
                      <div key={cust.id} className={`border p-3 flex items-center justify-between gap-3 rounded-lg ${
                        isAdminDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-black uppercase ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{cust.name}</h4>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                              isAdminDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>{cust.role}</span>
                          </div>
                          <span className={`text-[10px] font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{cust.email}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black block ${isAdminDarkMode ? 'text-white' : 'text-gray-900'}`}>${cust.totalSpent.toLocaleString('es-AR')} ARS</span>
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
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> GESTIÓN DE PEDIDOS ({filteredOrders.length} DE {orders.length})
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
                    type="button"
                    onClick={() =>
                      downloadCsvReport(
                        `pedidos_buttoncat_${new Date().toISOString().slice(0, 10)}.csv`,
                        ['ID Pedido', 'Fecha', 'Cliente', 'Email', 'Articulos', 'Estado', 'Metodo de Pago', 'Descuento ARS', 'Total ARS'],
                        filteredOrders.map((o) => [
                          o.id,
                          o.date,
                          o.customerName,
                          o.customerEmail,
                          o.itemsSummary,
                          o.status,
                          o.paymentMethod || 'Digital',
                          o.discountAmount || 0,
                          o.total,
                        ])
                      )
                    }
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      isAdminDarkMode
                        ? 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                    }`}
                    title="Exportar pedidos filtrados a CSV / Excel"
                  >
                    <FileText className="w-3.5 h-3.5" /> EXPORTAR CSV
                  </button>

                  <button
                    onClick={handleOpenAddOrder}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-3" /> NUEVO PEDIDO
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
                      id="admin-orders-search-input"
                      name="orderSearchQuery"
                      aria-label="Buscar pedido por ID, cliente, email, artículos, destino o transportista"
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Buscar pedido por ID, cliente, email, artículos, destino o transportista..."
                      className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none border transition-all ${
                        isAdminDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-slate-700'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-800 shadow-xs'
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
                        <label htmlFor="admin-order-sales-channel" className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Globe className="w-3 h-3 text-cyan-400" /> CANAL DE VENTA:
                        </label>
                        <select
                          id="admin-order-sales-channel"
                          name="orderSalesChannelFilter"
                          aria-label="Canal de venta"
                          value={orderSalesChannelFilter}
                          onChange={(e) => setOrderSalesChannelFilter(e.target.value)}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100'
                              : 'bg-gray-50 border-gray-300 text-gray-900'
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
                        <label htmlFor="admin-order-shipping-filter" className={`text-[10px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 ${
                          isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          <Truck className="w-3 h-3 text-emerald-400" /> ENTREGA / ENVÍO:
                        </label>
                        <select
                          id="admin-order-shipping-filter"
                          name="orderShippingFilter"
                          aria-label="Modalidad de entrega o envío"
                          value={orderShippingFilter}
                          onChange={(e) => setOrderShippingFilter(e.target.value)}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none border cursor-pointer ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100'
                              : 'bg-gray-50 border-gray-300 text-gray-900'
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
                            id="admin-order-start-date"
                            name="orderStartDate"
                            aria-label="Fecha Desde"
                            type="date"
                            value={orderStartDateFilter}
                            onChange={(e) => setOrderStartDateFilter(e.target.value)}
                            title="Fecha Desde"
                            className={`w-full rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none border ${
                              isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            id="admin-order-end-date"
                            name="orderEndDate"
                            aria-label="Fecha Hasta"
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
                    {paginatedOrders.map((order) => {
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
                              ) : order.hasManualCustomItems ? (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">A MEDIDA</span>
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
                              id={`admin-order-status-card-${order.id}`}
                              name={`orderStatusCard_${order.id}`}
                              aria-label={`Estado del pedido ${order.id}`}
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
                        paginatedOrders.map((order) => {
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
                              ) : order.hasManualCustomItems ? (
                                <span className="inline-block text-[9px] font-bold text-amber-600 dark:text-amber-400">A MEDIDA</span>
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
                                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/70 dark:border-purple-800 dark:text-purple-300 rounded uppercase truncate max-w-32.5" title={order.appliedCouponCode || 'CUPÓN'}>
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
                                id={`admin-order-status-row-${order.id}`}
                                name={`orderStatusRow_${order.id}`}
                                aria-label={`Estado del pedido ${order.id}`}
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

              {renderPaginationControls(
                validOrdersPage,
                totalOrderPages,
                filteredOrders.length,
                setOrdersPage,
                'pedido',
                'pedidos'
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
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <Package className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> INVENTARIO DE PRODUCTOS ({filteredInventory.length} DE {products.length})
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Control de stock, códigos SKU y canales de venta
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
                    <Plus className="w-4 h-4 stroke-3" /> AGREGAR PRODUCTO
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
                      id="admin-inventory-search-input"
                      name="inventorySearchQuery"
                      aria-label="Buscar producto en inventario por nombre, SKU, material, categoría o estilo"
                      type="text"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      placeholder="Buscar producto por nombre, SKU, material, categoría o estilo..."
                      className={`w-full rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none border transition-all ${
                        isAdminDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-slate-700'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-800 shadow-xs'
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
                      { id: 'OFERTA', label: 'EN OFERTA', icon: Tag, count: products.filter((p) => isProductOnSale(p)).length },
                      { id: 'NORMAL', label: 'STOCK COMPLETO', icon: CheckCircle2, count: products.filter((p) => { const s = getProductStockStatus(p); return !s.isTotalOutOfStock && !s.hasOutOfStockVariations; }).length },
                      { id: 'PARTIAL', label: 'VAR. AGOTADAS', icon: AlertTriangle, count: products.filter((p) => getProductStockStatus(p).hasOutOfStockVariations).length },
                      { id: 'OUT_OF_STOCK', label: 'SIN STOCK TOTAL', icon: XCircle, count: products.filter((p) => getProductStockStatus(p).isTotalOutOfStock).length },
                      { id: 'UNIQUE', label: 'PIEZAS ÚNICAS', icon: Sparkles, count: products.filter((p) => p.isUnique).length },
                      { id: 'REWARDS', label: 'PRODUCTOS OCULTOS', icon: Award, count: products.filter((p) => p.isRewardOnly || p.hiddenFromCatalog).length },
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
                        {
                          inventoryStockFilter === 'OFERTA' ? 'Promoción: En Oferta' :
                          inventoryStockFilter === 'NORMAL' ? 'Stock: Completo' :
                          inventoryStockFilter === 'PARTIAL' ? 'Stock: Var. Agotadas' :
                          inventoryStockFilter === 'OUT_OF_STOCK' ? 'Stock: Sin Stock Total' :
                          inventoryStockFilter === 'UNIQUE' ? 'Stock: Piezas Únicas' :
                          inventoryStockFilter === 'REWARDS' ? 'Catálogo: Productos Ocultos' :
                          `Filtro: ${inventoryStockFilter}`
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
                    {paginatedInventory.map((product) => {
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
                                {!product.isUnique && (
                                  <button
                                    onClick={() => handleOpenMatrixModal(product)}
                                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                      isAdminDarkMode ? 'text-purple-400 hover:text-purple-300 hover:bg-slate-800' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                                    }`}
                                    title="Gestionar Variaciones y Matriz de Stock"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleProductVisibility(product)}
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    product.hiddenFromCatalog || product.isRewardOnly
                                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                                      : (isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                                  }`}
                                  title={product.hiddenFromCatalog || product.isRewardOnly ? 'Producto oculto del catálogo. Clic para mostrar.' : 'Visible en catálogo. Clic para ocultar.'}
                                >
                                  {product.hiddenFromCatalog || product.isRewardOnly ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
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
                              {(product.hiddenFromCatalog || product.isRewardOnly) && (
                                <span className="border text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-amber-400 text-black">
                                  OCULTO
                                </span>
                              )}
                              {(() => {
                                const eff = getEffectiveProductBadge(product, tags);
                                return eff ? (
                                  <span className={`border text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${eff.badgeBg}`}>
                                    {eff.text}
                                  </span>
                                ) : null;
                              })()}
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
                        paginatedInventory.map((product) => {
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
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className={`font-bold truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{product.name}</p>
                                      {(product.hiddenFromCatalog || product.isRewardOnly) && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border bg-amber-400 text-black">
                                          OCULTO
                                        </span>
                                      )}
                                      {(() => {
                                        const eff = getEffectiveProductBadge(product, tags);
                                        return eff ? (
                                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase border ${eff.badgeBg}`}>
                                            {eff.text}
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
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
                                    <span className="block text-[9px] text-amber-300 font-bold mt-0.5 truncate max-w-32.5" title={`Variedad agotada: ${stockInfo.outOfStockVariationNames.join(', ')}`}>
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
                                  {!product.isUnique && (
                                    <button
                                      onClick={() => handleOpenMatrixModal(product)}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        isAdminDarkMode ? 'text-purple-400 hover:text-purple-300 hover:bg-slate-800' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                                      }`}
                                      title="Variaciones y Matriz de Stock"
                                    >
                                      <SlidersHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleToggleProductVisibility(product)}
                                    className={`p-1 rounded transition-colors cursor-pointer ${
                                      product.hiddenFromCatalog || product.isRewardOnly
                                        ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                                        : (isAdminDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                                    title={product.hiddenFromCatalog || product.isRewardOnly ? 'Producto oculto del catálogo. Clic para mostrar.' : 'Visible en catálogo. Clic para ocultar.'}
                                  >
                                    {product.hiddenFromCatalog || product.isRewardOnly ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
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

              {renderPaginationControls(
                validInventoryPage,
                totalInventoryPages,
                filteredInventory.length,
                setInventoryPage,
                'producto',
                'productos'
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
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <Users className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> REGISTRO Y GESTIÓN DE CLIENTES ({filteredCustomers.length} DE {customers.length})
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
                    type="button"
                    onClick={() =>
                      downloadCsvReport(
                        `clientes_buttoncat_${new Date().toISOString().slice(0, 10)}.csv`,
                        ['ID Cliente', 'Nombre Completo', 'Email', 'Telefono', 'Rol', 'Cantidad Pedidos', 'Total Gastado ARS', 'Puntos'],
                        filteredCustomers.map((u) => [
                          u.id,
                          u.name,
                          u.email,
                          u.phone || '',
                          u.role,
                          u.ordersCount,
                          u.totalSpent,
                          u.points,
                        ])
                      )
                    }
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      isAdminDarkMode
                        ? 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                    }`}
                    title="Exportar listado de clientes a CSV / Excel"
                  >
                    <FileText className="w-3.5 h-3.5" /> EXPORTAR CSV
                  </button>

                  <button
                    onClick={handleOpenAddCustomer}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-3" /> REGISTRAR CLIENTE
                  </button>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DEDICADA CLIENTES */}
              <div className="relative max-w-xl">
                <input
                  id="admin-customer-search-input"
                  name="customerSearchQuery"
                  aria-label="Buscar cliente por nombre, email, rol o ID"
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, email, rol o ID..."
                  className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                    isAdminDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-xs'
                  }`}
                />
                <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              </div>

              {/* CUSTOMERS CONTENT: VISTA EN FICHAS VS VISTA EN TABLA */}
              {isLoadingCustomers ? (
                <AdminSectionLoader
                  label="Cargando directorio de usuarios desde PostgreSQL..."
                  isDarkMode={isAdminDarkMode}
                />
              ) : customersViewMode === 'grid' ? (
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
                              user.role === 'ADMIN'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
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
                                user.role === 'ADMIN'
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
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

          {/* TAB 5: GASTOS Y PROVEEDORES (FULL CRUD CON SUB-TABS) */}
          {activeTab === 'expenses' && (
            <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
            }`}>
              <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <Receipt className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> GASTOS OPERATIVOS, PROVEEDORES Y CATEGORÍAS DE GASTO
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Administración integral de compras operativas, directorio maestro de proveedores y rubros contables
                  </p>
                </div>

                {/* SUB-TABS DE GASTOS Y PROVEEDORES */}
                <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border ${
                  isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setExpenseSubTab('expenses')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      expenseSubTab === 'expenses'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Registro de Gastos ({expenses.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseSubTab('suppliers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      expenseSubTab === 'suppliers'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Proveedores ({availableSuppliers.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpenseSubTab('categories')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      expenseSubTab === 'categories'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Categorías de Gasto ({availableExpenseCategories.length})
                  </button>
                </div>
              </div>

              {expenseSubTab === 'expenses' ? (
                <>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* BARRA DE BÚSQUEDA DEDICADA GASTOS */}
                    <div className="relative flex-1 max-w-xl">
                      <input
                        id="admin-expense-search-input"
                        name="expenseSearchQuery"
                        aria-label="Buscar gasto por proveedor, categoría, descripción o forma de pago"
                        type="text"
                        value={expenseSearchQuery}
                        onChange={(e) => setExpenseSearchQuery(e.target.value)}
                        placeholder="Buscar gasto por proveedor, categoría, descripción o forma de pago..."
                        className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                          isAdminDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-xs'
                        }`}
                      />
                      <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
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
                        type="button"
                        onClick={() =>
                          downloadCsvReport(
                            `gastos_buttoncat_${new Date().toISOString().slice(0, 10)}.csv`,
                            ['ID Gasto', 'Fecha', 'Proveedor', 'Categoria', 'Descripcion', 'Metodo de Pago', 'Monto ARS'],
                            filteredExpenses.map((ex) => [
                              ex.id,
                              ex.date,
                              ex.supplier,
                              ex.category,
                              ex.description,
                              ex.paymentMethod,
                              ex.amount,
                            ])
                          )
                        }
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                          isAdminDarkMode
                            ? 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border-emerald-500/40'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                        }`}
                        title="Exportar registro de gastos a CSV / Excel"
                      >
                        <FileText className="w-3.5 h-3.5" /> EXPORTAR CSV
                      </button>

                      <button
                        onClick={handleOpenAddExpense}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs border ${
                          isAdminDarkMode
                            ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                            : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-3" /> REGISTRAR GASTO
                      </button>
                    </div>
                  </div>

              {/* EXPENSES CONTENT: VISTA EN FICHAS VS VISTA EN TABLA */}
              {isLoadingExpenses ? (
                <AdminSectionLoader
                  label="Cargando registro de gastos desde PostgreSQL..."
                  isDarkMode={isAdminDarkMode}
                />
              ) : expensesViewMode === 'grid' ? (
                filteredExpenses.length === 0 ? (
                  <div className={`p-8 text-center font-bold border rounded-xl ${
                    isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                  }`}>
                    No se encontraron gastos con el término de búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedExpenses.map((expense) => (
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
                            <span className={`text-[10px] ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formatPaymentMethod(expense.paymentMethod)}</span>
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
                        paginatedExpenses.map((expense) => (
                          <tr key={expense.id} className={`transition-colors ${
                            isAdminDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'
                          }`}>
                            <td className="p-3">
                              <span className={`font-mono font-bold block ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>#{expense.id}</span>
                              <span className={`text-[10px] block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{expense.date}</span>
                            </td>
                            <td className="p-3">
                              <p className={`font-bold truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{expense.supplier}</p>
                              <p className={`text-[10px] truncate max-w-37.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`} title={expense.description}>{expense.description}</p>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                isAdminDarkMode ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {expense.category}
                              </span>
                              <span className={`block text-[10px] mt-0.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{formatPaymentMethod(expense.paymentMethod)}</span>
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

              {renderPaginationControls(
                validExpensesPage,
                totalExpensesPages,
                filteredExpenses.length,
                setExpensesPage,
                'gasto',
                'gastos'
              )}
                </>
              ) : (
                <AdminSuppliersAndCategoriesManager
                  suppliers={availableSuppliers}
                  onSuppliersChange={setAvailableSuppliers}
                  expenseCategories={availableExpenseCategories}
                  onExpenseCategoriesChange={setAvailableExpenseCategories}
                  activeSubSection={expenseSubTab}
                  isDarkMode={isAdminDarkMode}
                />
              )}
            </div>
          )}

          {/* TAB 6: PREMIOS Y CUPONES & CATEGORÍAS (GESTIÓN EN PARALELO Y SUB-TABS) */}
          {activeTab === 'rewards' && (
            <div className="space-y-6 animate-in fade-in">
              {/* BARRA SUPERIOR DE CONTROL, SUB-TABS & ACCIONES */}
              <div className={`p-5 border rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${
                isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
              }`}>
                <div>
                  <h2 className={`text-base font-black uppercase font-display flex items-center gap-2 ${
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    <Award className={`w-5 h-5 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} />
                    GESTIÓN DE PREMIOS & CATEGORÍAS ({adminRewards.length} PREMIOS · {adminRewardCategories.length} CATEGORÍAS)
                  </h2>
                  <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Administración de recompensas canjeables por puntos y taxonomía de categorías de beneficios
                  </p>
                </div>

                {/* VISTA CONTROLS / SUB-TABS */}
                <div className={`flex items-center gap-1.5 p-1 rounded-xl border self-start md:self-auto ${
                  isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setRewardSubTab('parallel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      rewardSubTab === 'parallel'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Ver premios y categorías en paralelo en la misma pantalla"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    Vista en Paralelo
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardSubTab('rewards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      rewardSubTab === 'rewards'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Premios ({adminRewards.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setRewardSubTab('categories')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      rewardSubTab === 'categories'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Categorías ({adminRewardCategories.length})
                  </button>
                </div>

                {/* BOTONES DE CREACIÓN */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddRewardCategory}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> NUEVA CATEGORÍA
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddReward}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-xs border ${
                      isAdminDarkMode
                        ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                        : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> CREAR PREMIO
                  </button>
                </div>
              </div>

              {/* MODO 1: VISTA EN PARALELO (SIDE-BY-SIDE PREMIOS + CATEGORÍAS) */}
              {rewardSubTab === 'parallel' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* COLUMNA IZQUIERDA: PREMIOS CANJEABLES (7 COLS) */}
                  <div className={`lg:col-span-7 border p-5 space-y-4 rounded-xl shadow-xs transition-colors ${
                    isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-inherit">
                      <div>
                        <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${
                          isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                        }`}>
                          <Award className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} />
                          PREMIOS CANJEABLES ({filteredRewards.length} DE {adminRewards.length})
                        </h3>
                        <p className={`text-[11px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Beneficios y cupones configurados para canjear con puntos
                        </p>
                      </div>

                      {/* BUSCADOR DE PREMIOS */}
                      <div className="relative w-full sm:w-64">
                        <input
                          id="admin-reward-search-input"
                          name="rewardSearchQuery"
                          aria-label="Buscar premio por título, código o categoría"
                          type="text"
                          value={rewardSearchQuery}
                          onChange={(e) => setRewardSearchQuery(e.target.value)}
                          placeholder="Buscar premio..."
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none pr-8 border ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-2xs'
                          }`}
                        />
                        <Search className={`w-3.5 h-3.5 absolute right-2.5 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                      </div>
                    </div>

                    {/* FILTROS RÁPIDOS POR CATEGORÍA */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedRewardCategoryFilter('TODOS')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                          selectedRewardCategoryFilter === 'TODOS'
                            ? isAdminDarkMode
                              ? 'bg-slate-800 text-white border-slate-700'
                              : 'bg-gray-900 text-white border-gray-900'
                            : isAdminDarkMode
                              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900'
                        }`}
                      >
                        Todos ({adminRewards.length})
                      </button>
                      {adminRewardCategories.map((cat) => {
                        const count = adminRewards.filter(
                          (r) => r.categoryId === cat.id || r.category === cat.name
                        ).length;
                        const isSelected = selectedRewardCategoryFilter === cat.name || selectedRewardCategoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedRewardCategoryFilter(isSelected ? 'TODOS' : cat.name)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                              isSelected
                                ? isAdminDarkMode
                                  ? 'bg-slate-800 text-white border-slate-700'
                                  : 'bg-gray-900 text-white border-gray-900'
                                : isAdminDarkMode
                                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900'
                            }`}
                          >
                            {cat.name} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* LISTA / GRID DE PREMIOS */}
                    {filteredRewards.length === 0 ? (
                      <div className={`p-8 text-center font-bold border rounded-xl ${
                        isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-gray-50 shadow-xs'
                      }`}>
                        No se encontraron premios con los filtros especificados.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {filteredRewards.map((reward) => (
                          <div
                            key={reward.id}
                            className={`border rounded-xl p-3.5 space-y-2.5 shadow-xs transition-all flex flex-col justify-between ${
                              isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50/70 text-gray-900'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <img
                                  src={reward.image}
                                  alt={reward.title}
                                  onError={handleProductImageError}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-700 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                      reward.badgeBg || (isAdminDarkMode ? 'bg-slate-900 text-amber-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-200')
                                    }`}>
                                      {reward.category}
                                    </span>
                                    {reward.productId && (
                                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/40">
                                        PRODUCTO FÍSICO
                                      </span>
                                    )}
                                  </div>
                                  <h4 className={`text-xs font-black uppercase mt-1 leading-tight truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                    {reward.title}
                                  </h4>
                                </div>
                              </div>
                              <p className={`text-[11px] font-medium line-clamp-2 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {reward.description}
                              </p>
                            </div>

                            <div className={`flex items-center justify-between pt-2 border-t text-xs font-bold ${
                              isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-700 dark:text-emerald-400 font-black">{reward.discountValue}</span>
                                <span className={`text-[11px] ${isAdminDarkMode ? 'text-amber-400' : 'text-gray-900'}`}>{reward.pointsCost} PTS</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReward(reward)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
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

                  {/* COLUMNA DERECHA: CATEGORÍAS DE PREMIOS (5 COLS) */}
                  <div className={`lg:col-span-5 border p-5 space-y-4 rounded-xl shadow-xs transition-colors ${
                    isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-inherit">
                      <div>
                        <h3 className={`text-sm font-black uppercase flex items-center gap-2 ${
                          isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                        }`}>
                          <Tag className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} />
                          CATEGORÍAS DE PREMIOS ({filteredRewardCategories.length} DE {adminRewardCategories.length})
                        </h3>
                        <p className={`text-[11px] font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Taxonomía para clasificar tipos de recompensas
                        </p>
                      </div>

                      {/* BUSCADOR DE CATEGORÍAS */}
                      <div className="relative w-full sm:w-48">
                        <input
                          id="admin-reward-cat-search-input"
                          name="rewardCategorySearchQuery"
                          aria-label="Buscar categoría por nombre o descripción"
                          type="text"
                          value={rewardCategorySearchQuery}
                          onChange={(e) => setRewardCategorySearchQuery(e.target.value)}
                          placeholder="Buscar categoría..."
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none pr-8 border ${
                            isAdminDarkMode
                              ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-2xs'
                          }`}
                        />
                        <Search className={`w-3.5 h-3.5 absolute right-2.5 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                      </div>
                    </div>

                    {/* LISTA DE TARJETAS DE CATEGORÍA */}
                    {filteredRewardCategories.length === 0 ? (
                      <div className={`p-8 text-center font-bold border rounded-xl ${
                        isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-gray-50 shadow-xs'
                      }`}>
                        No se encontraron categorías de premios.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredRewardCategories.map((cat) => {
                          const associatedCount = adminRewards.filter(
                            (r) => r.categoryId === cat.id || r.category === cat.name
                          ).length;

                          return (
                            <div
                              key={cat.id}
                              className={`border rounded-xl p-3.5 space-y-2 shadow-xs transition-all ${
                                isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50/70 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-2xs ${cat.badgeBg || 'bg-slate-800 text-white'}`}>
                                    {cat.name}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    [{cat.id}]
                                  </span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isAdminDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {associatedCount} {associatedCount === 1 ? 'premio' : 'premios'}
                                </span>
                              </div>

                              {cat.description ? (
                                <p className={`text-[11px] font-medium leading-relaxed ${
                                  isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {cat.description}
                                </p>
                              ) : (
                                <p className="text-[11px] italic text-slate-500">Sin descripción registrada.</p>
                              )}

                              <div className={`flex items-center justify-between pt-2 border-t text-xs font-bold ${
                                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRewardCategoryFilter(selectedRewardCategoryFilter === cat.name ? 'TODOS' : cat.name)}
                                  className={`text-[11px] font-bold hover:underline cursor-pointer ${
                                    selectedRewardCategoryFilter === cat.name ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {selectedRewardCategoryFilter === cat.name ? 'Quitar filtro de columna' : 'Filtrar premios a la izquierda'}
                                </button>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditRewardCategory(cat)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRewardCategory(cat.id)}
                                    className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODO 2: SOLO PREMIOS (ANCHO COMPLETO) */}
              {rewardSubTab === 'rewards' && (
                <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative max-w-xl flex-1">
                      <input
                        id="admin-reward-search-input-full"
                        name="rewardSearchQuery"
                        aria-label="Buscar premio por título, código prefijo, categoría o descuento"
                        type="text"
                        value={rewardSearchQuery}
                        onChange={(e) => setRewardSearchQuery(e.target.value)}
                        placeholder="Buscar premio por título, código prefijo, categoría o descuento..."
                        className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                          isAdminDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-xs'
                        }`}
                      />
                      <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    </div>

                    {/* FILTROS POR CATEGORÍA EN VISTA COMPLETA */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedRewardCategoryFilter('TODOS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                          selectedRewardCategoryFilter === 'TODOS'
                            ? isAdminDarkMode
                              ? 'bg-slate-800 text-white border-slate-700'
                              : 'bg-gray-900 text-white border-gray-900'
                            : isAdminDarkMode
                              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900'
                        }`}
                      >
                        Todos ({adminRewards.length})
                      </button>
                      {adminRewardCategories.map((cat) => {
                        const isSelected = selectedRewardCategoryFilter === cat.name || selectedRewardCategoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedRewardCategoryFilter(isSelected ? 'TODOS' : cat.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                              isSelected
                                ? isAdminDarkMode
                                  ? 'bg-slate-800 text-white border-slate-700'
                                  : 'bg-gray-900 text-white border-gray-900'
                                : isAdminDarkMode
                                  ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:text-gray-900'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filteredRewards.length === 0 ? (
                    <div className={`p-8 text-center font-bold border rounded-xl ${
                      isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                    }`}>
                      No se encontraron premios con los filtros especificados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredRewards.map((reward) => (
                        <div key={reward.id} className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                          isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                        }`}>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <img src={reward.image} alt={reward.title} onError={handleProductImageError} className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-700 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                    reward.badgeBg || (isAdminDarkMode ? 'bg-slate-900 text-amber-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-200')
                                  }`}>
                                    {reward.category}
                                  </span>
                                  {reward.productId && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/40">
                                      PRODUCTO FÍSICO
                                    </span>
                                  )}
                                </div>
                                <h4 className={`text-xs font-black uppercase mt-1 leading-tight truncate ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{reward.title}</h4>
                              </div>
                            </div>
                            <p className={`text-[11px] font-medium line-clamp-2 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{reward.description}</p>
                          </div>
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

              {/* MODO 3: SOLO CATEGORÍAS (ANCHO COMPLETO) */}
              {rewardSubTab === 'categories' && (
                <div className={`border p-6 space-y-6 animate-in fade-in rounded-xl shadow-xs transition-colors ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                }`}>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative max-w-xl flex-1">
                      <input
                        id="admin-reward-category-search-input-full"
                        name="rewardCategorySearchQuery"
                        aria-label="Buscar categoría por nombre o descripción"
                        type="text"
                        value={rewardCategorySearchQuery}
                        onChange={(e) => setRewardCategorySearchQuery(e.target.value)}
                        placeholder="Buscar categoría de premio por nombre o descripción..."
                        className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                          isAdminDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-xs'
                        }`}
                      />
                      <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddRewardCategory}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-xs border ${
                        isAdminDarkMode
                          ? 'bg-slate-100 text-slate-900 hover:bg-white border-slate-100'
                          : 'bg-gray-900 text-white hover:bg-black border-gray-900'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> NUEVA CATEGORÍA
                    </button>
                  </div>

                  {filteredRewardCategories.length === 0 ? (
                    <div className={`p-8 text-center font-bold border rounded-xl ${
                      isAdminDarkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-gray-200 text-gray-500 bg-white shadow-xs'
                    }`}>
                      No se encontraron categorías de premios con los filtros especificados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRewardCategories.map((cat) => {
                        const associatedRewards = adminRewards.filter(
                          (r) => r.categoryId === cat.id || r.category === cat.name
                        );

                        return (
                          <div
                            key={cat.id}
                            className={`border rounded-xl p-4 space-y-3 shadow-xs transition-all flex flex-col justify-between ${
                              isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black uppercase px-2.5 py-1 rounded shadow-2xs ${cat.badgeBg || 'bg-slate-800 text-white'}`}>
                                    {cat.name}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">
                                    [{cat.id}]
                                  </span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isAdminDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {associatedRewards.length} {associatedRewards.length === 1 ? 'premio' : 'premios'}
                                </span>
                              </div>

                              <p className={`text-xs font-medium leading-relaxed ${
                                isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'
                              }`}>
                                {cat.description || 'Sin descripción adicional registrada.'}
                              </p>

                              {associatedRewards.length > 0 && (
                                <div className="pt-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Premios en esta categoría:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {associatedRewards.slice(0, 3).map((r) => (
                                      <span key={r.id} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate max-w-40 ${
                                        isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                                      }`}>
                                        {r.title}
                                      </span>
                                    ))}
                                    {associatedRewards.length > 3 && (
                                      <span className="text-[10px] font-bold text-slate-400 self-center">
                                        +{associatedRewards.length - 3} más
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={`flex items-center justify-end gap-3 pt-3 border-t text-xs font-bold ${
                              isAdminDarkMode ? 'border-slate-800' : 'border-gray-100'
                            }`}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRewardCategory(cat)}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRewardCategory(cat.id)}
                                className="text-red-600 dark:text-red-400 hover:underline text-xs font-bold cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TABLAS GENERALES & TAXONOMÍA DEL SISTEMA (SUB-TABS DEDICADAS) */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* BARRA SUPERIOR DE CONTROL, SUB-TABS & BÚSQUEDA */}
              <div className={`p-4 border rounded-xl flex flex-col gap-4 transition-colors ${
                isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900 shadow-xs'
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-base font-black uppercase font-display ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      TABLAS GENERALES & CONFIGURACIÓN DEL SISTEMA
                    </h3>
                    <p className={`text-xs font-semibold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Administración centralizada de taxonomía del catálogo, estilos, geografía (provincias y localidades) y métodos de pago
                    </p>
                  </div>

                  {(categorySubTab === 'categories' || categorySubTab === 'marketing') && (
                    /* SEARCH INPUT */
                    <div className="relative w-full md:w-72">
                      <input
                        id="admin-tag-search-input"
                        name="tagSearchQuery"
                        aria-label="Filtrar categorías, estilos y etiquetas por nombre"
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder="Filtrar por nombre..."
                        className={`w-full rounded-lg px-3.5 py-2 text-xs font-medium focus:outline-none pr-10 border ${
                          isAdminDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 shadow-xs'
                        }`}
                      />
                      <Search className={`w-4 h-4 absolute right-3 top-2.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                    </div>
                  )}
                </div>

                {/* SUB-TABS NAVIGATION CONTROLS */}
                <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border self-start ${
                  isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-100 border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setCategorySubTab('categories')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      categorySubTab === 'categories'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Categorías y Variaciones ({categories.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategorySubTab('marketing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      categorySubTab === 'marketing'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Estilos y Etiquetas ({vibes.length + tags.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategorySubTab('geography')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      categorySubTab === 'geography'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Geografía (Provincias / Localidades)
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategorySubTab('payments')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      categorySubTab === 'payments'
                        ? isAdminDarkMode
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                          : 'bg-gray-900 text-white shadow-xs'
                        : isAdminDarkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Métodos de Pago ({availablePaymentMethods.length})
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: CATEGORÍAS Y VARIACIONES ASOCIADAS (TABLA DEDICADA DE ANCHO COMPLETO) */}
              {categorySubTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className={`font-bold uppercase text-sm flex items-center gap-2 ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        <Layers className={`w-4 h-4 ${isAdminDarkMode ? 'text-slate-300' : 'text-gray-700'}`} />
                        TABLA DE CATEGORÍAS & VARIANTES SUGERIDAS
                      </h4>
                      <p className={`text-xs font-medium ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Cada categoría define dinámicamente los tipos de variantes (ej: Talle, Color, Tamaño, Tipo de tela) que adoptarán los productos del catálogo.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddCategory}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer border flex items-center gap-1.5 transition-all ${
                        isAdminDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-gray-900 hover:bg-black text-white border-gray-900 shadow-xs'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> NUEVA CATEGORÍA
                    </button>
                  </div>

                  {/* TABLA DE ANCHO COMPLETO PARA CATEGORÍAS Y VARIANTES */}
                  <div className={`border rounded-xl overflow-hidden shadow-xs ${
                    isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-200' : 'border-gray-200 bg-white text-gray-800'
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                            isAdminDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            <th className="py-3 px-4 w-[28%]">Categoría</th>
                            <th className="py-3 px-4 w-[14%]">Precio Base</th>
                            <th className="py-3 px-4 w-[36%]">Tipos de Variantes Asociadas</th>
                            <th className="py-3 px-4 w-[10%] text-center">Catálogo</th>
                            <th className="py-3 px-4 w-[12%] text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'} text-xs font-semibold`}>
                          {filteredCategories.length === 0 ? (
                            <tr>
                              <td colSpan={5} className={`py-8 text-center font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                No se encontraron categorías que coincidan con la búsqueda.
                              </td>
                            </tr>
                          ) : (
                            filteredCategories.map((cat, idx) => {
                              const productCount = products.filter(
                                (p) => p.category?.toUpperCase() === cat.name.toUpperCase()
                              ).length;
                              const varTypesCount = cat.variationTypes?.length || 0;

                              return (
                                <tr
                                  key={cat.id}
                                  className={`transition-colors ${
                                    idx % 2 === 0
                                      ? 'bg-transparent'
                                      : isAdminDarkMode
                                        ? 'bg-slate-900/30'
                                        : 'bg-gray-50/50'
                                  } ${isAdminDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}
                                >
                                  {/* CATEGORÍA */}
                                  <td className="py-3.5 px-4 align-top">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 ${cat.bgColor?.split(' ')[0] || 'bg-brand-pink'}`}
                                          title={`Color temático: ${cat.bgColor || 'Predeterminado'}`}
                                        />
                                        <span className={`font-bold text-xs uppercase tracking-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                          {cat.name}
                                        </span>
                                      </div>
                                      {cat.description && (
                                        <p className={`text-[11px] line-clamp-1 pl-4.5 ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                          {cat.description}
                                        </p>
                                      )}
                                    </div>
                                  </td>

                                  {/* PRECIO BASE */}
                                  <td className="py-3.5 px-4 align-top font-mono">
                                    {cat.basePrice !== undefined && cat.basePrice !== null ? (
                                      <span className={`font-bold text-xs ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                        ${cat.basePrice.toLocaleString('es-AR')}
                                      </span>
                                    ) : (
                                      <span className={isAdminDarkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                                    )}
                                  </td>

                                  {/* VARIANTES ASOCIADAS */}
                                  <td className="py-3.5 px-4 align-top">
                                    <div className="space-y-1.5">
                                      {cat.variationTypes && cat.variationTypes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {cat.variationTypes.map((vt) => (
                                            <span
                                              key={vt.name}
                                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border flex items-center gap-1 ${
                                                isAdminDarkMode
                                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                                              }`}
                                              title={`${vt.name}: ${vt.options.map(getOptionLabel).join(', ')}`}
                                            >
                                              <span className="font-bold">{vt.name}</span>
                                              <span className={isAdminDarkMode ? 'text-slate-400 text-[9px]' : 'text-gray-500 text-[9px]'}>({vt.options.length})</span>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className={`text-[11px] italic ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                          Sin variantes asociadas
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* CANTIDAD EN CATÁLOGO */}
                                  <td className="py-3.5 px-4 align-top text-center">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                                      isAdminDarkMode
                                        ? 'bg-slate-900 text-slate-300 border-slate-800'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                    }`}>
                                      {productCount} un.
                                    </span>
                                  </td>

                                  {/* ACCIONES */}
                                  <td className="py-3.5 px-4 align-top text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setManagingVariationsCategory(cat)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                                          isAdminDarkMode
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                            : 'bg-gray-900 hover:bg-black text-white border-gray-900 shadow-xs'
                                        }`}
                                        title={`Abrir tabla de variantes de ${cat.name}`}
                                      >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Variantes ({varTypesCount})</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditCategory(cat)}
                                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                          isAdminDarkMode
                                            ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                                            : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:bg-gray-100'
                                        }`}
                                        title="Editar datos de categoría"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCategoryClick(cat)}
                                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                          isAdminDarkMode
                                            ? 'text-red-400 hover:text-red-300 border-slate-800 hover:bg-red-950/30'
                                            : 'text-red-500 hover:text-red-700 border-gray-200 hover:bg-red-50'
                                        }`}
                                        title="Eliminar categoría"
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
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: MARKETING (ESTILOS Y ETIQUETAS EN 2 COLUMNAS AMPLIAS) */}
              {categorySubTab === 'marketing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
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
                        + NUEVO ESTILO
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
                              <button onClick={() => handleOpenEditVibe(vibe)} className={`text-xs font-bold hover:underline cursor-pointer ${isAdminDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Editar</button>
                              <button onClick={() => handleDeleteVibeClick(vibe)} className={`text-xs font-bold hover:underline cursor-pointer ${isAdminDarkMode ? 'text-red-400' : 'text-red-600'}`}>Borrar</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ETIQUETAS / BADGES MANAGEMENT */}
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
                        + NUEVA ETIQUETA
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                      {filteredTags.length === 0 ? (
                        <p className={`text-xs font-bold p-4 text-center ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No se encontraron etiquetas.</p>
                      ) : (
                        filteredTags.map((tag) => {
                          const isOfferTag = tag.name.toUpperCase().includes('OFERTA');
                          const productCount = products.filter((p) => {
                            if (isOfferTag && isProductOnSale(p)) return true;
                            return p.badgeId === tag.id || (p.badge && p.badge.toUpperCase() === tag.name.toUpperCase());
                          }).length;

                          return (
                            <div key={tag.id} className={`border p-3 flex items-center justify-between rounded-lg ${
                              isAdminDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50 text-gray-900'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 border text-[10px] font-black uppercase rounded ${tag.badgeBg || 'bg-gray-900 text-white'}`}>
                                  [{tag.name}]
                                </span>
                                <span className={`text-[11px] font-bold ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                  ({productCount} {productCount === 1 ? 'producto' : 'productos'})
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenEditTag(tag)} className={`text-xs font-bold hover:underline cursor-pointer ${isAdminDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Editar</button>
                                <button onClick={() => handleDeleteTagClick(tag)} className={`text-xs font-bold hover:underline cursor-pointer ${isAdminDarkMode ? 'text-red-400' : 'text-red-600'}`}>Borrar</button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* SUB-TABS 3 Y 4: GEOGRAFÍA Y MÉTODOS DE PAGO */}
              {(categorySubTab === 'geography' || categorySubTab === 'payments') && (
                <AdminGeneralTablesManager
                  activeSubSection={categorySubTab}
                  paymentMethods={availablePaymentMethods}
                  onPaymentMethodsChange={setAvailablePaymentMethods}
                  isDarkMode={isAdminDarkMode}
                />
              )}

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
        rewards={adminRewards}
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
        suppliers={availableSuppliers}
        expenseCategories={availableExpenseCategories}
        paymentMethods={availablePaymentMethods}
        isDarkMode={isAdminDarkMode}
      />

      <AddRewardAdminModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onSave={handleSaveReward}
        rewardToEdit={editingReward}
        isDarkMode={isAdminDarkMode}
        products={products}
        rewardCategories={adminRewardCategories}
      />

      <AddEditRewardCategoryModal
        isOpen={isRewardCategoryModalOpen}
        onClose={() => setIsRewardCategoryModalOpen(false)}
        onSave={handleSaveRewardCategory}
        categoryToEdit={editingRewardCategory}
        existingCategories={adminRewardCategories}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        existingProducts={products}
        categories={categories}
        tags={tags}
        isDarkMode={isAdminDarkMode}
        onOpenVariationsMatrix={handleOpenMatrixModal}
      />

      <ProductVariationsMatrixModal
        isOpen={!!matrixProduct}
        onClose={() => setMatrixProduct(null)}
        onSave={handleSaveMatrixProduct}
        product={matrixProduct}
        categories={categories}
        isDarkMode={isAdminDarkMode}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={editingCategory}
        existingCategories={categories}
        isDarkMode={isAdminDarkMode}
      />

      <CategoryVariationsModal
        isOpen={!!managingVariationsCategory}
        onClose={() => setManagingVariationsCategory(null)}
        category={managingVariationsCategory}
        onSave={(updatedCat) => {
          onEditCategory(updatedCat);
          setManagingVariationsCategory(null);
        }}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditStyleModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        onSave={handleSaveVibe}
        styleToEdit={editingVibe}
        existingStyles={vibes}
        isDarkMode={isAdminDarkMode}
      />

      <AddEditBadgeModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={handleSaveTag}
        badgeToEdit={editingTag}
        existingBadges={tags}
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
                <div className="w-full sm:w-56 border-2 border-black divide-y-2 text-center shadow-brutal-xs shrink-0 bg-white">
                  <div className="bg-gray-100 py-1.5 font-black uppercase text-xs tracking-wider text-black">
                    Pedido
                  </div>
                  <div className="py-2.5 font-black text-base font-mono text-black">
                    No. {detailOrder.id}
                  </div>
                </div>
              </div>

              {/* SECCIÓN CLIENTE & DATOS DE ENTREGA (GRILLA CON BORDES CONTINUOS) */}
              <div className="mt-4 border-2 border-black text-xs divide-y-2 font-bold">
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
                      {detailOrder.salesChannel?.replace('_', ' ') || 'TIENDA WEB'} • {detailOrder.isCustomOrder ? 'TALLER CUSTOM' : detailOrder.hasManualCustomItems ? 'A MEDIDA' : 'ESTÁNDAR'}
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
                <div className="grid grid-cols-12 bg-gray-50 border-b-2 border-black font-black text-xs text-black divide-x-2 text-center py-2 uppercase">
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
              <div className="mt-4 border-2 border-black grid grid-cols-1 sm:grid-cols-12 divide-y-2 sm:divide-y-0 sm:divide-x-2 text-xs font-bold">
                
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
                      <span className="font-bold text-emerald-700">{formatPaymentMethod(detailOrder.paymentMethod)}</span>
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
                      {detailOrder.hasManualCustomItems && !detailOrder.isCustomOrder && (
                        <p className="font-bold text-amber-700">• Incluye Artículos a Medida / Personalizados fuera de catálogo.</p>
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
                      {detailOrder.receiptUrl ? (
                        <div className="pt-1.5">
                          <a
                            href={detailOrder.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-black text-black bg-brand-yellow hover:bg-brand-pink hover:text-white px-2.5 py-1 border-2 border-black shadow-brutal-xs uppercase transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> VER COMPROBANTE DE PAGO
                          </a>
                        </div>
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
      {/* PRODUCT DETAIL OVERLAY MODAL */}
      {detailProduct && (() => {
        const rawGallery = (detailProduct.images && detailProduct.images.length > 0)
          ? detailProduct.images
          : (detailProduct.image ? [detailProduct.image] : []);
        const productGallery = detailProduct.image
          ? [detailProduct.image, ...rawGallery.filter((img) => img && img !== detailProduct.image)]
          : rawGallery;
        const activeImg = productGallery[detailActiveImgIdx] || detailProduct.image;
        const totalStock = calculateTotalProductStock(detailProduct);

        return (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in overflow-y-auto"
            onClick={() => setDetailProduct(null)}
          >
            <div 
              className={`w-full max-w-2xl my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto ${
                isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* TOP HEADER */}
              <div className={`flex items-start justify-between border-b pb-4 ${
                isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isAdminDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}>
                      {detailProduct.sku || `BTC-${detailProduct.id.slice(-4).toUpperCase()}`}
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {detailProduct.category}
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                      Alta: {getSpanishFormattedDate(detailProduct.dateAdded)}
                    </span>
                    {detailProduct.badge && (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        detailProduct.badgeBg || 'bg-brand-pink text-white border-pink-400'
                      }`}>
                        {detailProduct.badge}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-bold text-base sm:text-xl uppercase tracking-tight leading-tight ${
                    isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    {detailProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailProduct(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isAdminDarkMode 
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MEDIA GALLERY SECTION */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isAdminDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase flex items-center gap-1.5 ${
                    isAdminDarkMode ? 'text-slate-300' : 'text-gray-800'
                  }`}>
                    <Camera className="w-4 h-4 text-purple-500" />
                    Galería de Fotos ({productGallery.length})
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 font-medium">
                    Foto {detailActiveImgIdx + 1} de {productGallery.length}
                  </span>
                </div>

                {/* MAIN ACTIVE PHOTO PREVIEW */}
                <div className={`relative w-full h-48 sm:h-60 rounded-xl overflow-hidden border flex items-center justify-center ${
                  isAdminDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                  <img
                    src={activeImg}
                    alt={detailProduct.name}
                    onError={handleProductImageError}
                    className="w-full h-full object-contain sm:object-cover"
                  />
                  {detailActiveImgIdx === 0 && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                      isAdminDarkMode ? 'bg-slate-950/80 text-slate-200 border-slate-700 backdrop-blur-xs' : 'bg-white/90 text-gray-800 border-gray-300 backdrop-blur-xs shadow-2xs'
                    }`}>
                      Portada Principal
                    </div>
                  )}
                </div>

                {/* THUMBNAILS CAROUSEL / STRIP */}
                {productGallery.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                    {productGallery.map((imgUrl, idx) => {
                      const isCurrent = detailActiveImgIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDetailActiveImgIdx(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 relative ${
                            isCurrent
                              ? (isAdminDarkMode ? 'border-slate-100 ring-2 ring-slate-400' : 'border-gray-900 ring-2 ring-gray-900')
                              : (isAdminDarkMode ? 'border-slate-700 opacity-60 hover:opacity-100' : 'border-gray-200 opacity-70 hover:opacity-100')
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Miniatura ${idx + 1}`}
                            onError={handleProductImageError}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FINANCIAL & STOCK OVERVIEW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className={`p-3 rounded-xl border ${
                  isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Precio Público</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base sm:text-lg block">
                    ${detailProduct.price.toFixed(2)}
                  </span>
                  {detailProduct.originalPrice && detailProduct.originalPrice > detailProduct.price && (
                    <span className="text-[10px] font-mono text-gray-500 line-through block">
                      ${detailProduct.originalPrice.toFixed(2)} (-{calculateDiscountPercentage(detailProduct.price, detailProduct.originalPrice)}%)
                    </span>
                  )}
                </div>

                <div className={`p-3 rounded-xl border ${
                  isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Stock Total</span>
                  <span className={`font-bold text-sm block ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                    {totalStock} unidades
                  </span>
                  {getProductStockStatus(detailProduct).hasOutOfStockVariations && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                      Variantes agotadas
                    </span>
                  )}
                </div>

                <div className={`p-3 rounded-xl border ${
                  isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Canales de Venta</span>
                  <span className={`font-bold text-xs uppercase block ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                    {detailProduct.salesChannel || 'AMBOS'}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {detailProduct.hiddenFromCatalog ? 'Solo Canjes / Oculto' : 'Visible en Tienda'}
                  </span>
                </div>
              </div>

              {/* TECHNICAL & CATALOG ATTRIBUTES */}
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Estilos / Vibes:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {detailProduct.vibe.map((v, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                          isAdminDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-300'
                        }`}>
                          #{v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Material / Composición:</span>
                    <span className={`font-medium text-xs block mt-0.5 ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      {detailProduct.material || 'No especificado en ficha técnica'}
                    </span>
                  </div>
                </div>

                <div className={`border-t pt-2 flex items-center justify-between text-[11px] ${
                  isAdminDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-200 text-gray-500'
                }`}>
                  <span>Fecha de Alta: <strong className={isAdminDarkMode ? 'text-slate-300' : 'text-gray-800'}>{detailProduct.dateAdded || '01/01/2026'}</strong></span>
                  <span>Personalizable: <strong className={isAdminDarkMode ? 'text-slate-300' : 'text-gray-800'}>{detailProduct.isCustomizable ? 'Sí (Studio)' : 'No'}</strong></span>
                </div>
              </div>

              {/* DESCRIPTION */}
              {detailProduct.description && (
                <div className="space-y-1">
                  <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Descripción</span>
                  <p className={`p-3 rounded-xl border font-medium leading-relaxed text-xs ${
                    isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}>
                    {detailProduct.description}
                  </p>
                </div>
              )}

              {/* VARIACIONES Y MATRIZ CON IMÁGENES ASOCIADAS */}
              {(() => {
                if (detailProduct.isUnique) {
                  return (
                    <div className={`p-3.5 rounded-xl border ${
                      isAdminDarkMode ? 'bg-purple-950/20 border-purple-800/40 text-purple-200' : 'bg-purple-50/70 border-purple-200 text-purple-900'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>PIEZA ÚNICA / STOCK UNITARIO</span>
                      </div>
                      <p className="text-[11px] font-normal mt-1 opacity-90">
                        Producto de stock unitario e irrepetible. No cuenta con variaciones ni matrices adicionales.
                      </p>
                    </div>
                  );
                }

                const varGroups = detailProduct.variations;
                if (!varGroups || varGroups.length === 0) {
                  return (
                    <div className={`p-3.5 rounded-xl border ${
                      isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      <span className="text-[10px] font-semibold uppercase tracking-wider block text-slate-400">
                        ESTRUCTURA DE PRODUCTO:
                      </span>
                      <p className="text-xs font-medium mt-0.5">
                        Producto estándar de stock global ({detailProduct.stock} unidades) sin variaciones configuradas.
                      </p>
                    </div>
                  );
                }

                const allCombos = getAllCombinations(detailProduct);

                return (
                  <div className="space-y-3">
                    {/* GRUPOS */}
                    <div className="space-y-1.5">
                      <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Grupos de Variantes ({varGroups.length})
                      </span>
                      <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                        isAdminDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                      }`}>
                        {varGroups.map((vg) => (
                          <div key={vg.name} className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[11px]">{vg.name}:</span>
                            {vg.options.map((opt, i) => {
                              const lbl = getOptionLabel(opt);
                              const delta = getOptionPriceDelta(opt);
                              return (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                                    isAdminDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-800 border-gray-300 shadow-2xs'
                                  }`}
                                >
                                  {lbl} {delta > 0 && `(+${delta})`}
                                </span>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MATRIZ CON FOTOS ASOCIADAS (ESTILO TIENDANUBE) */}
                    {allCombos.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Matriz de Variantes y Fotos Asociadas ({allCombos.length} combinaciones)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const prod = detailProduct;
                              setDetailProduct(null);
                              handleOpenMatrixModal(prod);
                            }}
                            className={`text-[10px] font-semibold uppercase hover:underline cursor-pointer flex items-center gap-1 ${
                              isAdminDarkMode ? 'text-slate-300' : 'text-gray-800'
                            }`}
                          >
                            <SlidersHorizontal className="w-3 h-3" /> Configurar en Matriz
                          </button>
                        </div>

                        <div className={`border rounded-xl overflow-hidden max-h-56 overflow-y-auto ${
                          isAdminDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
                        }`}>
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className={`text-[10px] font-bold uppercase sticky top-0 border-b ${
                              isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-100 border-gray-200 text-gray-700'
                            }`}>
                              <tr>
                                <th className="p-2.5">Variante</th>
                                <th className="p-2.5 text-center">Stock</th>
                                <th className="p-2.5 text-right">Precio</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800' : 'divide-gray-100'}`}>
                              {allCombos.map((combo) => {
                                const comboKey = getCombinationKey(combo);
                                const cleanLabel = formatKeyToCleanLabel(comboKey);
                                const stk = getCombinationStock(detailProduct, combo);
                                const isOut = stk === 0;
                                const assignedImg = detailProduct.variantImages?.[comboKey];

                                return (
                                  <tr key={comboKey} className={isAdminDarkMode ? 'hover:bg-slate-900/40' : 'hover:bg-gray-50'}>
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2.5">
                                        {/* FOTO ASOCIADA */}
                                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden ${
                                          assignedImg 
                                            ? (isAdminDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-white') 
                                            : (isAdminDarkMode ? 'border-dashed border-slate-800 bg-slate-900/50 text-slate-500' : 'border-dashed border-gray-300 bg-gray-50 text-gray-400')
                                        }`}>
                                          {assignedImg ? (
                                            <img src={assignedImg} alt={cleanLabel} className="w-full h-full object-cover" />
                                          ) : (
                                            <Camera className="w-3.5 h-3.5 text-gray-400" />
                                          )}
                                        </div>
                                        <div>
                                          <span className="font-semibold text-xs block">{cleanLabel}</span>
                                          <span className="font-mono text-[9px] text-gray-400 block truncate max-w-xs">{comboKey}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                        isOut
                                          ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      }`}>
                                        {isOut ? 'SIN STOCK' : `${stk} un.`}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right font-semibold text-xs">
                                      ${detailProduct.price.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* BOTTOM ACTIONS FOOTER */}
              <div className={`border-t pt-4 flex items-center justify-between gap-3 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 mt-4 ${
                isAdminDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prod = detailProduct;
                      setDetailProduct(null);
                      handleOpenMatrixModal(prod);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isAdminDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Gestionar Variantes y Fotos
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailProduct(null)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isAdminDarkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                    }`}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      const prod = detailProduct;
                      setDetailProduct(null);
                      handleOpenEditProduct(prod);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isAdminDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 hover:bg-black'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar Producto
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto"
          onClick={() => setDetailExpense(null)}
        >
          <div 
            className={`w-full max-w-lg my-6 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors p-6 space-y-5 ${
              isAdminDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${
              isAdminDarkMode ? 'border-slate-800' : 'border-gray-200'
            }`}>
              <div>
                <span className={`font-mono text-xs font-bold block ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>#{detailExpense.id}</span>
                <h3 className={`font-bold text-sm leading-tight ${isAdminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{detailExpense.supplier}</h3>
              </div>
              <button
                onClick={() => setDetailExpense(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isAdminDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Categoría</span>
                <span className={`font-bold ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{detailExpense.category}</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isAdminDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Método de Pago</span>
                <span className={`font-bold ${isAdminDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{formatPaymentMethod(detailExpense.paymentMethod)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Concepto / Descripción</span>
              <p className={`p-3 rounded-xl border font-medium leading-relaxed ${
                isAdminDarkMode ? 'bg-slate-900 border-slate-800/80 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {detailExpense.description}
              </p>
            </div>

            {detailExpense.receiptUrl && (
              <div className="space-y-1.5 text-xs">
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Comprobante / Factura</span>
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isAdminDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Archivo de comprobante adjuntado</span>
                  <a
                    href={detailExpense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Comprobante
                  </a>
                </div>
              </div>
            )}

            <div className={`border-t pt-4 flex items-center justify-between -mx-6 -mb-6 px-6 py-4 mt-4 ${
              isAdminDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div>
                <span className={`text-[10px] uppercase font-bold block ${isAdminDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Monto del Gasto</span>
                <span className={`text-xl font-extrabold ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>${detailExpense.amount.toLocaleString('es-AR')} ARS</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailExpense(null)}
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
                    const exp = detailExpense;
                    setDetailExpense(null);
                    handleOpenEditExpense(exp);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-2 ${
                    isAdminDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  <Edit className="w-4 h-4" /> EDITAR GASTO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        description={deleteConfirmation.description}
        confirmText={deleteConfirmation.confirmText}
        onConfirm={deleteConfirmation.onConfirm}
        onClose={() => setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))}
        isDarkMode={isAdminDarkMode}
      />

    </div>
  );
};
