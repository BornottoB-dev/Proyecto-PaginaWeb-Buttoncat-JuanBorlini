// Tipos de dominio para entidades de base de datos PostgreSQL nativa
// Acceso a datos via SQL puro y driver pg

export type CanalDeVenta = 'WEB' | 'LOCAL' | 'AMBOS';

export type EstadoPedido =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type EstadoPremioCliente = 'DISPONIBLE' | 'USADO' | 'EXPIRADO';

export interface Transform2D {
  posicionX: number;
  posicionY: number;
  escalaZoom: number;
  rotacionGrados: number;
}

// 1. Geografía
export interface ProvinciaRow {
  id_provincia: number;
  provincia: string;
}

export interface LocalidadRow {
  id_localidad: number;
  id_provincia: number;
  localidad: string;
}

// 2. Usuarios, Clientes y Domicilios
export interface UsuarioRow {
  id_usuario: number;
  correo: string;
  nombre_completo: string;
  contrasena_hash: string;
  rol: 'ADMIN' | 'CLIENTE';
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ClienteRow {
  id_cliente: number;
  id_usuario: number | null;
  correo: string;
  nombre_completo: string;
  contrasena_hash: string;
  telefono: string | null;
  puntos: number;
  rol: 'ADMIN' | 'CLIENTE';
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CodigoRecuperacionClaveRow {
  id_recuperacion: number;
  id_usuario: number | null;
  id_cliente: number | null;
  correo: string;
  codigo_hash: string;
  expira_en: Date;
  usado: boolean;
  created_at: Date;
}

export interface DomicilioRow {
  id_domicilio: number;
  id_cliente: number;
  id_localidad: number;
  nombre_domicilio: string;
  calle: string;
  altura: number;
  codigo_postal: string;
  depto: string | null;
  es_predeterminado: boolean;
  activo: boolean;
}

// 3. Catálogo
export interface CategoriaRow {
  id_categoria: number;
  nombre_categoria: string;
  precio_base: number | string;
  color: string | null;
  descripcion: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EstiloRow {
  id_estilo: number;
  estilo: string;
  color: string | null;
}

export interface EtiquetaRow {
  id_etiqueta: number;
  nombre_etiqueta: string;
  color: string | null;
}

export interface VariacionRow {
  id_variacion: number;
  nombre_variacion: string;
}

export interface OpcionVariacionRow {
  id_opcion_variacion: number;
  id_variacion: number;
  nombre_opcion: string;
  precio_extra: number | string;
}

export interface ProductoRow {
  id_producto: number;
  id_categoria: number;
  nombre_producto: string;
  codigo_producto: string | null;
  descripcion: string | null;
  precio_costo: number | string | null;
  precio_base: number | string;
  precio_anterior: number | string | null;
  activo: boolean;
  canal_de_venta: CanalDeVenta;
  created_at: Date;
  updated_at: Date;
}

export interface ImagenProductoRow {
  id_imagen: number;
  id_producto: number;
  es_portada: boolean;
  imagen_producto_url: string;
  posicion: number;
}

export interface VarianteRow {
  id_variante: number;
  id_producto: number;
  sku: string;
  stock: number;
  precio_final: number | string;
  imagen_variante_url: string | null;
  activo: boolean;
}

export interface ResenaProductoRow {
  id_resena: number;
  id_producto: number;
  id_cliente: number;
  calificacion: number;
  comentario: string | null;
  fecha: Date;
}

// 4. Pagos y Premios
export interface MetodoPagoRow {
  id_metodo_pago: number;
  nombre_metodo_pago: string;
  porcentaje_descuento: number;
  activo: boolean;
  datos_bancarios: string | null;
}

export interface CategoriaPremioRow {
  id_categoria_premio: number;
  categoria: string;
}

export interface PremioRow {
  id_premio: number;
  id_categoria_premio: number;
  id_variante: number | null;
  titulo: string;
  descripcion: string;
  costo_puntos: number;
  imagen_premio_url: string;
  stock_premios: number;
  activo: boolean;
}

export interface PremioClienteRow {
  codigo_premio: string;
  id_cliente: number;
  id_premio: number;
  estado: EstadoPremioCliente;
  fecha_expiracion: Date;
  costo_puntos: number;
}

// 5. Pedidos
export interface PedidoClienteRow {
  id_pedido: string | number;
  id_cliente: number;
  id_metodo_pago: number;
  codigo_premio: string | null;
  fecha_emision: Date;
  nombre_completo: string;
  telefono_contacto: string;
  correo_contacto: string;
  provincia_entrega: string | null;
  localidad_entrega: string | null;
  calle_entrega: string | null;
  altura_entrega: number | null;
  codigo_postal: string | null;
  depto_entrega: string | null;
  codigo_seguimiento: string | null;
  comprobante_url: string | null;
  costo_de_envio: number | string | null;
  descuento: number | string;
  total: number | string;
  estado: EstadoPedido;
}

export interface DetallePedidoRow {
  numero_item: number;
  id_pedido: string | number;
  id_producto_custom: string | null;
  id_variante: number | null;
  cantidad: number;
  subtotal: number | string;
}

// 6. Proveedores y Gastos
export interface ProveedorRow {
  id_proveedor: number;
  razon_social: string;
  cuit: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface CategoriaGastoRow {
  id_categoria_gasto: number;
  nombre_categoria: string;
  descripcion: string | null;
  activo: boolean;
}

export interface GastoRow {
  id_gasto: number;
  id_categoria_gasto: number;
  id_metodo_pago: number;
  id_proveedor: number;
  concepto_gasto: string;
  monto_total: number | string;
  comprobante_url: string | null;
  fecha_gasto: Date;
}

// 7. Custom Products
export interface PlantillaProductoCustomRow {
  id_plantilla_custom: number;
  nombre_plantilla: string;
  descripcion: string;
  precio_base: number | string;
  permite_subir_imagen: boolean;
  transform_global: any;
  imagen_base_url: string;
  activo: boolean;
}

export interface VariacionCustomRow {
  id_variacion_custom: number;
  id_plantilla_custom: number;
  nombre_variacion: string;
  nro_paso: number;
  orden_capa_svg: number;
  transform_variante: any;
  activo: boolean;
}

export interface OpcionVariacionCustomRow {
  id_opcion_custom: number;
  id_variacion_custom: number;
  color_hex: string | null;
  imagen_plantilla_url: string;
  nombre_opcion: string;
  precio_extra: number | string;
  transform_opcion: any;
  activo: boolean;
}

export interface ProductoCustomRow {
  id_producto_custom: string;
  id_plantilla_custom: number;
  precio_final: number | string;
  nombre_custom: string;
  imagen_subida_cliente_url: string | null;
  svg_renderizado: string;
  transform_imagen_subida: any;
  comentario_cliente: string | null;
  created_at: Date;
}

