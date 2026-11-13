// Cliente HTTP tipado para conectar el Frontend con la API Modular del Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Array<{ path: string; message: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('buttoncat_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Error] Error en peticion a ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexion con el servidor',
    };
  }
}

// ==========================================
// AUTENTICACION Y SESIONES
// ==========================================
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () =>
    request<any>('/auth/me'),
};

// ==========================================
// MODULO 1: GEOGRAFIA Y UBICACION
// ==========================================
export const locationsApi = {
  getProvincias: () => request<any[]>('/locations/provincias'),
  getProvinciaById: (idProvincia: number) => request<any>(`/locations/provincias/${idProvincia}`),
  getLocalidades: (idProvincia?: number) =>
    request<any[]>(`/locations/localidades${idProvincia ? `?idProvincia=${idProvincia}` : ''}`),
  createProvincia: (provincia: string) =>
    request<any>('/locations/provincias', {
      method: 'POST',
      body: JSON.stringify({ provincia }),
    }),
  createLocalidad: (idProvincia: number, localidad: string) =>
    request<any>('/locations/localidades', {
      method: 'POST',
      body: JSON.stringify({ idProvincia, localidad }),
    }),
};

// ==========================================
// MODULO 2: CLIENTES Y DOMICILIOS
// ==========================================
export const clientsApi = {
  getAll: (activo?: boolean) =>
    request<any[]>(`/clients${activo !== undefined ? `?activo=${activo}` : ''}`),
  getById: (idCliente: number) => request<any>(`/clients/${idCliente}`),
  create: (data: { correo: string; nombreCompleto: string; contrasenaHash?: string; telefono?: string }) =>
    request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (idCliente: number, data: any) =>
    request<any>(`/clients/${idCliente}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getDomicilios: (idCliente: number) => request<any[]>(`/clients/${idCliente}/domicilios`),
  createDomicilio: (idCliente: number, data: any) =>
    request<any>(`/clients/${idCliente}/domicilios`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDomicilio: (idCliente: number, idDomicilio: number, data: any) =>
    request<any>(`/clients/${idCliente}/domicilios/${idDomicilio}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDomicilio: (idCliente: number, idDomicilio: number) =>
    request<any>(`/clients/${idCliente}/domicilios/${idDomicilio}`, {
      method: 'DELETE',
    }),
  deleteClient: (idCliente: number) =>
    request<any>(`/clients/${idCliente}`, {
      method: 'DELETE',
    }),
  getFavoritos: (idCliente: number) => request<any[]>(`/clients/${idCliente}/favoritos`),
  toggleFavorito: (idCliente: number, idProducto: number) =>
    request<{ isFavorite: boolean }>(`/clients/${idCliente}/favoritos/${idProducto}`, {
      method: 'POST',
    }),
};

// ==========================================
// MODULO 3: CATALOGO Y PRODUCTOS
// ==========================================
export const catalogApi = {
  // Categorias
  getCategories: () => request<any[]>('/catalog/categories'),
  getCategoryById: (idCategoria: number) => request<any>(`/catalog/categories/${idCategoria}`),
  createCategory: (data: any) =>
    request<any>('/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (idCategoria: number, data: any) =>
    request<any>(`/catalog/categories/${idCategoria}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (idCategoria: number) =>
    request<any>(`/catalog/categories/${idCategoria}`, {
      method: 'DELETE',
    }),

  // Estilos, Etiquetas y Variaciones
  getStyles: () => request<any[]>('/catalog/attributes/styles'),
  createStyle: (data: { estilo: string; color?: string }) =>
    request<any>('/catalog/attributes/styles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStyle: (idEstilo: number, data: { estilo?: string; color?: string }) =>
    request<any>(`/catalog/attributes/styles/${idEstilo}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteStyle: (idEstilo: number) =>
    request<any>(`/catalog/attributes/styles/${idEstilo}`, {
      method: 'DELETE',
    }),
  getTags: () => request<any[]>('/catalog/attributes/tags'),
  createTag: (data: { nombreEtiqueta: string; color?: string }) =>
    request<any>('/catalog/attributes/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTag: (idEtiqueta: number, data: { nombreEtiqueta?: string; color?: string }) =>
    request<any>(`/catalog/attributes/tags/${idEtiqueta}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTag: (idEtiqueta: number) =>
    request<any>(`/catalog/attributes/tags/${idEtiqueta}`, {
      method: 'DELETE',
    }),
  getVariations: () => request<any[]>('/catalog/attributes/variations'),
  createVariation: (nombreVariacion: string) =>
    request<any>('/catalog/attributes/variations', {
      method: 'POST',
      body: JSON.stringify({ nombreVariacion }),
    }),
  addOptionToVariation: (idVariacion: number, data: { nombreOpcion: string; precioExtra?: number }) =>
    request<any>(`/catalog/attributes/variations/${idVariacion}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Productos
  getProducts: (filters?: {
    categoria?: number;
    estilo?: number;
    etiqueta?: number;
    activo?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.categoria) params.append('categoria', String(filters.categoria));
    if (filters?.estilo) params.append('estilo', String(filters.estilo));
    if (filters?.etiqueta) params.append('etiqueta', String(filters.etiqueta));
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/catalog/products${queryString}`);
  },
  getProductById: (idProducto: number) => request<any>(`/catalog/products/${idProducto}`),
  createProduct: (data: any) =>
    request<any>('/catalog/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (idProducto: number, data: any) =>
    request<any>(`/catalog/products/${idProducto}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (idProducto: number, permanent: boolean = false) =>
    request<any>(`/catalog/products/${idProducto}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    }),
  addProductReview: (idProducto: number, data: { idCliente: number; calificacion: number; comentario?: string }) =>
    request<any>(`/catalog/products/${idProducto}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==========================================
// MODULO 4: METODOS DE PAGO Y PREMIOS
// ==========================================
export const paymentsRewardsApi = {
  // Metodos de Pago
  getPaymentMethods: (all: boolean = false) =>
    request<any[]>(`/payments${all ? '?all=true' : ''}`),
  createPaymentMethod: (data: any) =>
    request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePaymentMethod: (idMetodoPago: number, data: any) =>
    request<any>(`/payments/${idMetodoPago}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePaymentMethod: (idMetodoPago: number) =>
    request<any>(`/payments/${idMetodoPago}`, {
      method: 'DELETE',
    }),

  // Premios y Categorias
  getRewardCategories: () => request<any[]>('/rewards/categories'),
  createRewardCategory: (categoria: string) =>
    request<any>('/rewards/categories', {
      method: 'POST',
      body: JSON.stringify({ categoria }),
    }),
  updateRewardCategory: (idCategoriaPremio: number, categoria: string) =>
    request<any>(`/rewards/categories/${idCategoriaPremio}`, {
      method: 'PUT',
      body: JSON.stringify({ categoria }),
    }),
  deleteRewardCategory: (idCategoriaPremio: number) =>
    request<any>(`/rewards/categories/${idCategoriaPremio}`, {
      method: 'DELETE',
    }),
  getRewards: (all: boolean = false) =>
    request<any[]>(`/rewards${all ? '?all=true' : ''}`),
  getRewardById: (idPremio: number) =>
    request<any>(`/rewards/${idPremio}`),
  createReward: (data: any) =>
    request<any>('/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReward: (idPremio: number, data: any) =>
    request<any>(`/rewards/${idPremio}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteReward: (idPremio: number) =>
    request<any>(`/rewards/${idPremio}`, {
      method: 'DELETE',
    }),
  claimReward: (idCliente: number, idPremio: number) =>
    request<any>('/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ idCliente, idPremio }),
    }),
  getClientRewards: (idCliente: number) =>
    request<any[]>(`/rewards/client/${idCliente}`),
  validateRewardCode: (codigoPremio: string) =>
    request<any>(`/rewards/validate/${codigoPremio}`),
};

// ==========================================
// MODULO 5: PEDIDOS Y CHECKOUT
// ==========================================
export const ordersApi = {
  create: (data: any) =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: (filters?: { idCliente?: number; estado?: string; desde?: string; hasta?: string }) => {
    const params = new URLSearchParams();
    if (filters?.idCliente) params.append('idCliente', String(filters.idCliente));
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.desde) params.append('desde', filters.desde);
    if (filters?.hasta) params.append('hasta', filters.hasta);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/orders${queryString}`);
  },
  getById: (idPedido: string | bigint) => request<any>(`/orders/${idPedido}`),
  updateStatus: (idPedido: string | bigint, estado: string) =>
    request<any>(`/orders/${idPedido}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
  updateTracking: (idPedido: string | bigint, data: { codigoSeguimiento?: string; costoDeEnvio?: number }) =>
    request<any>(`/orders/${idPedido}/tracking`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOrder: (idPedido: string | bigint) =>
    request<any>(`/orders/${idPedido}`, {
      method: 'DELETE',
    }),
};

// ==========================================
// MODULO 6: PROVEEDORES Y GASTOS
// ==========================================
export const expensesApi = {
  // Proveedores
  getSuppliers: (all: boolean = false) =>
    request<any[]>(`/suppliers${all ? '?all=true' : ''}`),
  getSupplierById: (idProveedor: number) =>
    request<any>(`/suppliers/${idProveedor}`),
  createSupplier: (data: any) =>
    request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (idProveedor: number, data: any) =>
    request<any>(`/suppliers/${idProveedor}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSupplier: (idProveedor: number) =>
    request<any>(`/suppliers/${idProveedor}`, {
      method: 'DELETE',
    }),

  // Gastos
  getExpenseCategories: (all: boolean = false) =>
    request<any[]>(`/expenses/categories${all ? '?all=true' : ''}`),
  createExpenseCategory: (data: { nombreCategoria: string; descripcion?: string }) =>
    request<any>('/expenses/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpenseCategory: (idCategoriaGasto: number, data: any) =>
    request<any>(`/expenses/categories/${idCategoriaGasto}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getExpenses: (filters?: { idProveedor?: number; idCategoriaGasto?: number; idMetodoPago?: number }) => {
    const params = new URLSearchParams();
    if (filters?.idProveedor) params.append('idProveedor', String(filters.idProveedor));
    if (filters?.idCategoriaGasto) params.append('idCategoriaGasto', String(filters.idCategoriaGasto));
    if (filters?.idMetodoPago) params.append('idMetodoPago', String(filters.idMetodoPago));
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/expenses${queryString}`);
  },
  getExpenseById: (idGasto: number) =>
    request<any>(`/expenses/${idGasto}`),
  createExpense: (data: any) =>
    request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpense: (idGasto: number, data: any) =>
    request<any>(`/expenses/${idGasto}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExpense: (idGasto: number) =>
    request<any>(`/expenses/${idGasto}`, {
      method: 'DELETE',
    }),
  getSummary: () => request<any>('/expenses/summary'),
};

// ==========================================
// MODULO 7: PRODUCTO CUSTOM
// ==========================================
export const customProductsApi = {
  getTemplates: (all: boolean = false) =>
    request<any[]>(`/custom/templates${all ? '?all=true' : ''}`),
  getTemplateById: (idPlantilla: number) =>
    request<any>(`/custom/templates/${idPlantilla}`),
  createTemplate: (data: any) =>
    request<any>('/custom/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (idPlantilla: number, data: any) =>
    request<any>(`/custom/templates/${idPlantilla}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (idPlantilla: number) =>
    request<any>(`/custom/templates/${idPlantilla}`, {
      method: 'DELETE',
    }),
  addVariation: (idPlantilla: number, data: any) =>
    request<any>(`/custom/templates/${idPlantilla}/variations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addOption: (idVariacion: number, data: any) =>
    request<any>(`/custom/variations/${idVariacion}/options`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createCustomProduct: (data: {
    idPlantillaCustom: number;
    nombreCustom: string;
    opcionIds: number[];
    imagenSubidaClienteUrl?: string;
    transformImagenSubida?: any;
    comentarioCliente?: string;
    svgRenderizado?: string;
  }) =>
    request<any>('/custom/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCustomProductById: (idProductoCustom: string) =>
    request<any>(`/custom/products/${idProductoCustom}`),
  toggleFavorite: (idCliente: number, idProductoCustom: string) =>
    request<any>(`/custom/products/${idProductoCustom}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ idCliente }),
    }),
  getClientFavorites: (idCliente: number) =>
    request<any[]>(`/custom/favorites/client/${idCliente}`),
};

// ==========================================
// MODULO 8: ALMACENAMIENTO DE IMAGENES (CLOUDINARY)
// ==========================================
export const uploadApi = {
  uploadImage: async (
    image: string | File,
    folder: string = 'buttoncat'
  ): Promise<ApiResponse<{ url: string; publicId: string }>> => {
    if (typeof image === 'string') {
      return request<{ url: string; publicId: string }>('/upload', {
        method: 'POST',
        body: JSON.stringify({ image, folder }),
      });
    }

    const formData = new FormData();
    formData.append('file', image);
    formData.append('folder', folder);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir imagen',
      };
    }
  },

  uploadMultiple: async (
    images: (string | File)[],
    folder: string = 'buttoncat'
  ): Promise<ApiResponse<Array<{ url: string; publicId: string }>>> => {
    if (images.length === 0) return { success: true, data: [] };

    if (images.every((img) => typeof img === 'string')) {
      return request<Array<{ url: string; publicId: string }>>('/upload/multiple', {
        method: 'POST',
        body: JSON.stringify({ images, folder }),
      });
    }

    const formData = new FormData();
    formData.append('folder', folder);
    images.forEach((img) => {
      if (typeof img === 'string') {
        formData.append('images', img);
      } else {
        formData.append('files', img);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir imagenes',
      };
    }
  },

  deleteImage: (publicId: string) =>
    request<any>(`/upload/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    }),
};

