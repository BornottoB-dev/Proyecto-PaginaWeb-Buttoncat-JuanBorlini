-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CanalDeVenta" AS ENUM ('WEB', 'LOCAL', 'AMBOS');

-- CreateEnum
CREATE TYPE "EstadoPremioCliente" AS ENUM ('DISPONIBLE', 'USADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "provincias" (
    "id_provincia" SERIAL NOT NULL,
    "provincia" TEXT NOT NULL,

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id_provincia")
);

-- CreateTable
CREATE TABLE "localidades" (
    "id_localidad" SERIAL NOT NULL,
    "id_provincia" INTEGER NOT NULL,
    "localidad" TEXT NOT NULL,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id_localidad")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "correo" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "telefono" TEXT,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "rol" VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "codigos_recuperacion_clave" (
    "id_recuperacion" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "id_cliente" INTEGER,
    "correo" VARCHAR(150) NOT NULL,
    "codigo_hash" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_recuperacion_clave_pkey" PRIMARY KEY ("id_recuperacion")
);

-- CreateTable
CREATE TABLE "domicilios" (
    "id_domicilio" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_localidad" INTEGER NOT NULL,
    "nombre_domicilio" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "altura" INTEGER NOT NULL,
    "codigo_postal" TEXT NOT NULL,
    "depto" TEXT,
    "es_predeterminado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "domicilios_pkey" PRIMARY KEY ("id_domicilio")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre_categoria" TEXT NOT NULL,
    "precio_base" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "color" TEXT,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "estilos" (
    "id_estilo" SERIAL NOT NULL,
    "estilo" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "estilos_pkey" PRIMARY KEY ("id_estilo")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id_etiqueta" SERIAL NOT NULL,
    "nombre_etiqueta" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id_etiqueta")
);

-- CreateTable
CREATE TABLE "variaciones" (
    "id_variacion" SERIAL NOT NULL,
    "nombre_variacion" TEXT NOT NULL,

    CONSTRAINT "variaciones_pkey" PRIMARY KEY ("id_variacion")
);

-- CreateTable
CREATE TABLE "opciones_variacion" (
    "id_opcion_variacion" SERIAL NOT NULL,
    "id_variacion" INTEGER NOT NULL,
    "nombre_opcion" TEXT NOT NULL,
    "precio_extra" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "opciones_variacion_pkey" PRIMARY KEY ("id_opcion_variacion")
);

-- CreateTable
CREATE TABLE "opciones_categoria" (
    "id_categoria" INTEGER NOT NULL,
    "id_opcion_variacion" INTEGER NOT NULL,

    CONSTRAINT "opciones_categoria_pkey" PRIMARY KEY ("id_categoria","id_opcion_variacion")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "codigo_producto" TEXT,
    "descripcion" TEXT DEFAULT '',
    "precio_costo" DECIMAL(10,2),
    "precio_base" DECIMAL(10,2) NOT NULL,
    "precio_anterior" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "canal_de_venta" "CanalDeVenta" NOT NULL DEFAULT 'AMBOS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "imagenes_producto" (
    "id_imagen" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "es_portada" BOOLEAN NOT NULL DEFAULT false,
    "imagen_producto_url" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "imagenes_producto_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateTable
CREATE TABLE "producto_estilos" (
    "id_producto" INTEGER NOT NULL,
    "id_estilo" INTEGER NOT NULL,

    CONSTRAINT "producto_estilos_pkey" PRIMARY KEY ("id_producto","id_estilo")
);

-- CreateTable
CREATE TABLE "producto_etiquetas" (
    "id_producto" INTEGER NOT NULL,
    "id_etiqueta" INTEGER NOT NULL,
    "es_predeterminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "producto_etiquetas_pkey" PRIMARY KEY ("id_producto","id_etiqueta")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id_variante" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "imagen_variante_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id_variante")
);

-- CreateTable
CREATE TABLE "opciones_variante" (
    "id_variante" INTEGER NOT NULL,
    "id_opcion_variacion" INTEGER NOT NULL,

    CONSTRAINT "opciones_variante_pkey" PRIMARY KEY ("id_variante","id_opcion_variacion")
);

-- CreateTable
CREATE TABLE "resenas_producto" (
    "id_resena" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_producto_pkey" PRIMARY KEY ("id_resena")
);

-- CreateTable
CREATE TABLE "productos_favoritos" (
    "id_producto" INTEGER NOT NULL,
    "id_cliente" INTEGER NOT NULL,

    CONSTRAINT "productos_favoritos_pkey" PRIMARY KEY ("id_producto","id_cliente")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id_metodo_pago" SERIAL NOT NULL,
    "nombre_metodo_pago" TEXT NOT NULL,
    "porcentaje_descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "datos_bancarios" TEXT,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id_metodo_pago")
);

-- CreateTable
CREATE TABLE "categorias_premio" (
    "id_categoria_premio" SERIAL NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "categorias_premio_pkey" PRIMARY KEY ("id_categoria_premio")
);

-- CreateTable
CREATE TABLE "premios" (
    "id_premio" SERIAL NOT NULL,
    "id_categoria_premio" INTEGER NOT NULL,
    "id_variante" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "costo_puntos" INTEGER NOT NULL,
    "imagen_premio_url" TEXT NOT NULL,
    "stock_premios" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "premios_pkey" PRIMARY KEY ("id_premio")
);

-- CreateTable
CREATE TABLE "premios_cliente" (
    "codigo_premio" UUID NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_premio" INTEGER NOT NULL,
    "estado" "EstadoPremioCliente" NOT NULL DEFAULT 'DISPONIBLE',
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "costo_puntos" INTEGER NOT NULL,

    CONSTRAINT "premios_cliente_pkey" PRIMARY KEY ("codigo_premio")
);

-- CreateTable
CREATE TABLE "pedidos_cliente" (
    "id_pedido" BIGSERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "codigo_premio" UUID,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre_completo" TEXT NOT NULL,
    "telefono_contacto" TEXT NOT NULL,
    "correo_contacto" TEXT NOT NULL,
    "provincia_entrega" TEXT,
    "localidad_entrega" TEXT,
    "calle_entrega" TEXT,
    "altura_entrega" INTEGER,
    "codigo_postal" TEXT,
    "depto_entrega" TEXT,
    "codigo_seguimiento" TEXT,
    "comprobante_url" TEXT,
    "costo_de_envio" DECIMAL(10,2),
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "pedidos_cliente_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "detalles_pedido" (
    "numero_item" INTEGER NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "id_producto_custom" UUID,
    "id_variante" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_pedido_pkey" PRIMARY KEY ("numero_item","id_pedido")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id_proveedor" SERIAL NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "categorias_gasto" (
    "id_categoria_gasto" SERIAL NOT NULL,
    "nombre_categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_gasto_pkey" PRIMARY KEY ("id_categoria_gasto")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id_gasto" SERIAL NOT NULL,
    "id_categoria_gasto" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "concepto_gasto" TEXT NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "comprobante_url" TEXT,
    "fecha_gasto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id_gasto")
);

-- CreateTable
CREATE TABLE "plantillas_producto_custom" (
    "id_plantilla_custom" SERIAL NOT NULL,
    "nombre_plantilla" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_base" DECIMAL(10,2) NOT NULL,
    "permite_subir_imagen" BOOLEAN NOT NULL DEFAULT false,
    "transform_global" JSONB,
    "imagen_base_url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plantillas_producto_custom_pkey" PRIMARY KEY ("id_plantilla_custom")
);

-- CreateTable
CREATE TABLE "variaciones_custom" (
    "id_variacion_custom" SERIAL NOT NULL,
    "id_plantilla_custom" INTEGER NOT NULL,
    "nombre_variacion" TEXT NOT NULL,
    "nro_paso" INTEGER NOT NULL,
    "orden_capa_svg" INTEGER NOT NULL,
    "transform_variante" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variaciones_custom_pkey" PRIMARY KEY ("id_variacion_custom")
);

-- CreateTable
CREATE TABLE "opciones_variacion_custom" (
    "id_opcion_custom" SERIAL NOT NULL,
    "id_variacion_custom" INTEGER NOT NULL,
    "color_hex" TEXT,
    "imagen_plantilla_url" TEXT NOT NULL,
    "nombre_opcion" TEXT NOT NULL,
    "precio_extra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transform_opcion" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "opciones_variacion_custom_pkey" PRIMARY KEY ("id_opcion_custom")
);

-- CreateTable
CREATE TABLE "productos_custom" (
    "id_producto_custom" UUID NOT NULL,
    "id_plantilla_custom" INTEGER NOT NULL,
    "precio_final" DECIMAL(10,2) NOT NULL,
    "nombre_custom" TEXT NOT NULL,
    "imagen_subida_cliente_url" TEXT,
    "svg_renderizado" TEXT NOT NULL,
    "transform_imagen_subida" JSONB,
    "comentario_cliente" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_custom_pkey" PRIMARY KEY ("id_producto_custom")
);

-- CreateTable
CREATE TABLE "opciones_seleccionadas" (
    "id_opcion_custom" INTEGER NOT NULL,
    "id_producto_custom" UUID NOT NULL,

    CONSTRAINT "opciones_seleccionadas_pkey" PRIMARY KEY ("id_opcion_custom","id_producto_custom")
);

-- CreateTable
CREATE TABLE "productos_custom_favoritos" (
    "id_cliente" INTEGER NOT NULL,
    "id_producto_custom" UUID NOT NULL,

    CONSTRAINT "productos_custom_favoritos_pkey" PRIMARY KEY ("id_cliente","id_producto_custom")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_id_usuario_key" ON "clientes"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_correo_key" ON "clientes"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_categoria_key" ON "categorias"("nombre_categoria");

-- CreateIndex
CREATE UNIQUE INDEX "estilos_estilo_key" ON "estilos"("estilo");

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_nombre_etiqueta_key" ON "etiquetas"("nombre_etiqueta");

-- CreateIndex
CREATE UNIQUE INDEX "variaciones_nombre_variacion_key" ON "variaciones"("nombre_variacion");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_producto_key" ON "productos"("codigo_producto");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_sku_key" ON "variantes"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_cliente_codigo_premio_key" ON "pedidos_cliente"("codigo_premio");

-- AddForeignKey
ALTER TABLE "localidades" ADD CONSTRAINT "localidades_id_provincia_fkey" FOREIGN KEY ("id_provincia") REFERENCES "provincias"("id_provincia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigos_recuperacion_clave" ADD CONSTRAINT "codigos_recuperacion_clave_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigos_recuperacion_clave" ADD CONSTRAINT "codigos_recuperacion_clave_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domicilios" ADD CONSTRAINT "domicilios_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domicilios" ADD CONSTRAINT "domicilios_id_localidad_fkey" FOREIGN KEY ("id_localidad") REFERENCES "localidades"("id_localidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_variacion" ADD CONSTRAINT "opciones_variacion_id_variacion_fkey" FOREIGN KEY ("id_variacion") REFERENCES "variaciones"("id_variacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_categoria" ADD CONSTRAINT "opciones_categoria_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_categoria" ADD CONSTRAINT "opciones_categoria_id_opcion_variacion_fkey" FOREIGN KEY ("id_opcion_variacion") REFERENCES "opciones_variacion"("id_opcion_variacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_producto" ADD CONSTRAINT "imagenes_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_estilos" ADD CONSTRAINT "producto_estilos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_estilos" ADD CONSTRAINT "producto_estilos_id_estilo_fkey" FOREIGN KEY ("id_estilo") REFERENCES "estilos"("id_estilo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_etiquetas" ADD CONSTRAINT "producto_etiquetas_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_etiquetas" ADD CONSTRAINT "producto_etiquetas_id_etiqueta_fkey" FOREIGN KEY ("id_etiqueta") REFERENCES "etiquetas"("id_etiqueta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_variante" ADD CONSTRAINT "opciones_variante_id_variante_fkey" FOREIGN KEY ("id_variante") REFERENCES "variantes"("id_variante") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_variante" ADD CONSTRAINT "opciones_variante_id_opcion_variacion_fkey" FOREIGN KEY ("id_opcion_variacion") REFERENCES "opciones_variacion"("id_opcion_variacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas_producto" ADD CONSTRAINT "resenas_producto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas_producto" ADD CONSTRAINT "resenas_producto_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_favoritos" ADD CONSTRAINT "productos_favoritos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_favoritos" ADD CONSTRAINT "productos_favoritos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_id_categoria_premio_fkey" FOREIGN KEY ("id_categoria_premio") REFERENCES "categorias_premio"("id_categoria_premio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_id_variante_fkey" FOREIGN KEY ("id_variante") REFERENCES "variantes"("id_variante") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios_cliente" ADD CONSTRAINT "premios_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios_cliente" ADD CONSTRAINT "premios_cliente_id_premio_fkey" FOREIGN KEY ("id_premio") REFERENCES "premios"("id_premio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_cliente" ADD CONSTRAINT "pedidos_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_cliente" ADD CONSTRAINT "pedidos_cliente_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "metodos_pago"("id_metodo_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_cliente" ADD CONSTRAINT "pedidos_cliente_codigo_premio_fkey" FOREIGN KEY ("codigo_premio") REFERENCES "premios_cliente"("codigo_premio") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos_cliente"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_id_variante_fkey" FOREIGN KEY ("id_variante") REFERENCES "variantes"("id_variante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_id_producto_custom_fkey" FOREIGN KEY ("id_producto_custom") REFERENCES "productos_custom"("id_producto_custom") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_categoria_gasto_fkey" FOREIGN KEY ("id_categoria_gasto") REFERENCES "categorias_gasto"("id_categoria_gasto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_metodo_pago_fkey" FOREIGN KEY ("id_metodo_pago") REFERENCES "metodos_pago"("id_metodo_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variaciones_custom" ADD CONSTRAINT "variaciones_custom_id_plantilla_custom_fkey" FOREIGN KEY ("id_plantilla_custom") REFERENCES "plantillas_producto_custom"("id_plantilla_custom") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_variacion_custom" ADD CONSTRAINT "opciones_variacion_custom_id_variacion_custom_fkey" FOREIGN KEY ("id_variacion_custom") REFERENCES "variaciones_custom"("id_variacion_custom") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_custom" ADD CONSTRAINT "productos_custom_id_plantilla_custom_fkey" FOREIGN KEY ("id_plantilla_custom") REFERENCES "plantillas_producto_custom"("id_plantilla_custom") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_seleccionadas" ADD CONSTRAINT "opciones_seleccionadas_id_opcion_custom_fkey" FOREIGN KEY ("id_opcion_custom") REFERENCES "opciones_variacion_custom"("id_opcion_custom") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opciones_seleccionadas" ADD CONSTRAINT "opciones_seleccionadas_id_producto_custom_fkey" FOREIGN KEY ("id_producto_custom") REFERENCES "productos_custom"("id_producto_custom") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_custom_favoritos" ADD CONSTRAINT "productos_custom_favoritos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_custom_favoritos" ADD CONSTRAINT "productos_custom_favoritos_id_producto_custom_fkey" FOREIGN KEY ("id_producto_custom") REFERENCES "productos_custom"("id_producto_custom") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- INDICES DE RENDIMIENTO (Performance Indexes)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON productos (id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_canal_de_venta ON productos (canal_de_venta);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_variantes_id_producto ON variantes (id_producto);
CREATE INDEX IF NOT EXISTS idx_variantes_activo ON variantes (activo);
CREATE INDEX IF NOT EXISTS idx_variantes_sku ON variantes (sku);

CREATE INDEX IF NOT EXISTS idx_opciones_variante_id_variante ON opciones_variante (id_variante);
CREATE INDEX IF NOT EXISTS idx_opciones_variante_id_opcion ON opciones_variante (id_opcion_variacion);

CREATE INDEX IF NOT EXISTS idx_imagenes_producto_id_producto ON imagenes_producto (id_producto);

CREATE INDEX IF NOT EXISTS idx_producto_estilos_id_producto ON producto_estilos (id_producto);
CREATE INDEX IF NOT EXISTS idx_producto_estilos_id_estilo ON producto_estilos (id_estilo);

CREATE INDEX IF NOT EXISTS idx_producto_etiquetas_id_producto ON producto_etiquetas (id_producto);
CREATE INDEX IF NOT EXISTS idx_producto_etiquetas_id_etiqueta ON producto_etiquetas (id_etiqueta);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id_cliente ON pedidos_cliente (id_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_estado ON pedidos_cliente (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_fecha_emision ON pedidos_cliente (fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id_pedido ON detalles_pedido (id_pedido);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido_id_variante ON detalles_pedido (id_variante);

CREATE INDEX IF NOT EXISTS idx_gastos_id_proveedor ON gastos (id_proveedor);
CREATE INDEX IF NOT EXISTS idx_gastos_id_categoria_gasto ON gastos (id_categoria_gasto);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha_gasto ON gastos (fecha_gasto DESC);

CREATE INDEX IF NOT EXISTS idx_premios_cliente_id_cliente ON premios_cliente (id_cliente);
CREATE INDEX IF NOT EXISTS idx_domicilios_id_cliente ON domicilios (id_cliente);
CREATE INDEX IF NOT EXISTS idx_resenas_producto_id_producto ON resenas_producto (id_producto);
CREATE INDEX IF NOT EXISTS idx_resenas_producto_id_cliente ON resenas_producto (id_cliente);


