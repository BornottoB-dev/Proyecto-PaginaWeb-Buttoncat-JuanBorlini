import type {
  Product,
  CategoryItem,
  StyleItem,
  BadgeItem,
  RewardItem,
  RewardCategoryItem,
  RedeemedCoupon,
  UserAddress,
  SavedDesign,
  AdminOrder,
  CustomizableCategory,
  ProductVariationGroup,
  ProductVariationOption,
} from '../types/types.js';
import { parseCombinationKey, getOptionLabel, getOptionPriceDelta } from '../types/types.js';
import type { CustomizableProductCategoryInfo, CategoryOptionGroup } from '../data/customData.js';

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    const rawApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3001/api';
    const backendOrigin = rawApiUrl.replace(/\/api\/?$/, '');
    return `${backendOrigin}${url}`;
  }
  return url;
}

export function mapBackendProductToFrontend(p: any): Product {
  const rawCover =
    p.imagenes?.find((img: any) => img.esPortada)?.imagenProductoUrl ||
    p.imagenes?.[0]?.imagenProductoUrl ||
    'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop';
  const coverImage = resolveImageUrl(rawCover);

  const rawImages = p.imagenes && p.imagenes.length > 0
    ? p.imagenes.map((img: any) => resolveImageUrl(img.imagenProductoUrl)).filter(Boolean)
    : [];
  const allImages = coverImage
    ? [coverImage, ...rawImages.filter((url: string) => url !== coverImage)]
    : rawImages;

  const totalStock = p.variantes && p.variantes.length > 0
    ? p.variantes.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
    : 0;

  const vibes = p.estilos && p.estilos.length > 0
    ? p.estilos.map((e: any) => e.estilo?.estilo || '').filter(Boolean)
    : [];

  const mainTag = p.etiquetas?.[0]?.etiqueta;

  // Reconstruccion de variaciones, matriz de stocks e imagenes
  let hasVariations = false;
  let variations: ProductVariationGroup[] = [];
  const variantStocks: Record<string, number> = {};
  const variantImages: Record<string, string> = {};

  if (p.variantes && p.variantes.length > 0) {
    const varGroupMap = new Map<string, Map<string, number>>();
    let hasAnyOptions = false;

    p.variantes.forEach((v: any) => {
      const comboOptions: Record<string, string> = {};
      if (v.opciones && v.opciones.length > 0) {
        hasAnyOptions = true;
        v.opciones.forEach((optItem: any) => {
          const ov = optItem.opcionVariacion || optItem;
          const varName = ov.variacion?.nombreVariacion || 'VARIACION';
          const optName = ov.nombreOpcion;
          const extraPrice = Number(ov.precioExtra || 0);
          if (!varGroupMap.has(varName)) {
            varGroupMap.set(varName, new Map());
          }
          const currentMap = varGroupMap.get(varName)!;
          if (!currentMap.has(optName) || extraPrice > (currentMap.get(optName) || 0)) {
            currentMap.set(optName, extraPrice);
          }
          comboOptions[varName] = optName;
        });
      }

      const comboKey = Object.keys(comboOptions).length > 0
        ? Object.keys(comboOptions).sort().map((k) => `${k.trim()}:${comboOptions[k].trim()}`).join(' | ')
        : v.sku;

      variantStocks[comboKey] = v.stock || 0;
      if (v.imagenVarianteUrl) {
        variantImages[comboKey] = resolveImageUrl(v.imagenVarianteUrl);
      }
    });

    if (hasAnyOptions || p.variantes.length > 1) {
      hasVariations = true;
      variations = Array.from(varGroupMap.entries()).map(([name, optsMap]) => ({
        name,
        options: Array.from(optsMap.entries()).map(([label, priceDelta]): ProductVariationOption | string =>
          priceDelta > 0 ? { label, priceDelta } : label
        ),
      }));
    }
  }

  const rawSalesChannel = (p.canalDeVenta || 'AMBOS').toUpperCase();
  const mappedSalesChannel: 'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL' =
    rawSalesChannel === 'WEB' || rawSalesChannel === 'SOLO_WEB'
      ? 'SOLO_WEB'
      : rawSalesChannel === 'LOCAL' || rawSalesChannel === 'SOLO_LOCAL'
      ? 'SOLO_LOCAL'
      : 'AMBOS';

  return {
    id: String(p.idProducto),
    sku: p.codigoProducto || undefined,
    categoryId: p.idCategoria ? String(p.idCategoria) : undefined,
    category: p.categoria?.nombreCategoria || '',
    name: p.nombreProducto,
    price: Number(p.precioBase || 0),
    originalPrice: p.precioAnterior ? Number(p.precioAnterior) : undefined,
    image: coverImage,
    images: allImages,
    badge: mainTag?.nombreEtiqueta,
    badgeBg: mainTag?.color || 'bg-brand-pink text-white',
    description: p.descripcion || '',
    stock: totalStock,
    vibe: vibes,
    salesChannel: mappedSalesChannel,
    hiddenFromCatalog: p.activo === false,
    isRewardOnly: p.activo === false,
    isCustomizable: false,
    hasVariations,
    variations: hasVariations && variations.length > 0 ? variations : undefined,
    variantStocks: hasVariations && Object.keys(variantStocks).length > 0 ? variantStocks : undefined,
    variantImages: hasVariations && Object.keys(variantImages).length > 0 ? variantImages : undefined,
    rawVariants: p.variantes || [],
    rating:
      p.resenas && p.resenas.length > 0
        ? Number(
            (
              p.resenas.reduce((sum: number, r: any) => sum + Number(r.calificacion || 5), 0) /
              p.resenas.length
            ).toFixed(1)
          )
        : p.promedioCalificacion
        ? Number(p.promedioCalificacion)
        : 5.0,
    reviewsCount: p._count?.resenas || (p.resenas ? p.resenas.length : 0),
    reviews: p.resenas?.map((r: any) => ({
      id: String(r.idResena),
      userName: r.cliente?.nombreCompleto || 'Cliente Buttoncat',
      rating: r.calificacion,
      date: new Date(r.fecha).toLocaleDateString('es-AR'),
      comment: r.comentario,
    })) || [],
  };
}

export function mapBackendCategoryToFrontend(c: any): CategoryItem {
  const varGroupMap = new Map<string, Array<string | { label: string; priceDelta?: number }>>();
  if (Array.isArray(c.opciones)) {
    c.opciones.forEach((item: any) => {
      const ov = item.opcionVariacion || item;
      const varName = ov.variacion?.nombreVariacion;
      const optName = ov.nombreOpcion;
      const priceExtra = Number(ov.precioExtra || 0);
      if (varName && optName) {
        if (!varGroupMap.has(varName)) {
          varGroupMap.set(varName, []);
        }
        const list = varGroupMap.get(varName)!;
        const exists = list.some((existing) => (typeof existing === 'string' ? existing : existing.label) === optName);
        if (!exists) {
          list.push(priceExtra > 0 ? { label: optName, priceDelta: priceExtra } : optName);
        }
      }
    });
  }
  const variationTypes: ProductVariationGroup[] = Array.from(varGroupMap.entries()).map(([name, options]) => ({
    name,
    options,
  }));

  return {
    id: String(c.idCategoria),
    name: c.nombreCategoria,
    description: c.descripcion || '',
    basePrice: Number(c.precioBase || 0),
    bgColor: c.color || 'bg-brand-pink text-white',
    variationTypes,
  };
}

export function mapBackendStyleToFrontend(s: any): StyleItem {
  return {
    id: String(s.idEstilo),
    name: s.estilo,
    badgeBg: s.color || 'bg-black text-white',
  };
}

export function mapBackendTagToFrontend(t: any): BadgeItem {
  return {
    id: String(t.idEtiqueta),
    name: t.nombreEtiqueta,
    badgeBg: t.color || 'bg-brand-orange text-white',
  };
}

export function mapBackendRewardToFrontend(r: any): RewardItem {
  const fullText = `${r.titulo || ''} ${r.descripcion || ''}`.toUpperCase();
  let discountValue = `${r.costoPuntos} PTS`;
  const dollarMatch = fullText.match(/\$\s*([\d.]+)/);
  const pctMatch = fullText.match(/(\d+)%/);
  if (fullText.includes('ENVIO GRATIS') || fullText.includes('ENVÍO GRATIS')) {
    discountValue = 'ENVIO GRATIS';
  } else if (dollarMatch) {
    discountValue = `$${dollarMatch[1]} OFF`;
  } else if (pctMatch) {
    discountValue = `${pctMatch[1]}% OFF`;
  } else if (r.variante?.producto?.idProducto) {
    discountValue = 'PRODUCTO FISICO';
  }

  return {
    id: String(r.idPremio),
    title: r.titulo,
    description: r.descripcion,
    pointsCost: r.costoPuntos,
    image: resolveImageUrl(r.imagenPremioUrl),
    stock: r.stockPremios,
    category: (r.categoriaPremio?.categoria as any) || 'DESCUENTO',
    categoryId: r.idCategoriaPremio ? String(r.idCategoriaPremio) : undefined,
    discountValue,
    codePrefix: 'REWARD',
    productId: r.variante?.producto?.idProducto
      ? String(r.variante.producto.idProducto)
      : undefined,
  };
}

export function mapBackendRewardCategoryToFrontend(rc: any): RewardCategoryItem {
  return {
    id: String(rc.idCategoriaPremio),
    name: rc.categoria,
  };
}

export function mapBackendClientRewardToFrontend(pc: any): RedeemedCoupon {
  const premio = pc.premio || {};
  const fullText = `${premio.titulo || ''} ${premio.descripcion || ''}`.toUpperCase();
  let discountValue = `${pc.costoPuntos || premio.costoPuntos || 0} PTS`;
  const dollarMatch = fullText.match(/\$\s*([\d.]+)/);
  const pctMatch = fullText.match(/(\d+)%/);
  if (fullText.includes('ENVIO GRATIS') || fullText.includes('ENVÍO GRATIS')) {
    discountValue = 'ENVIO GRATIS';
  } else if (dollarMatch) {
    discountValue = `$${dollarMatch[1]} OFF`;
  } else if (pctMatch) {
    discountValue = `${pctMatch[1]}% OFF`;
  }

  return {
    id: String(pc.codigoPremio),
    rewardId: String(pc.idPremio || premio.idPremio || ''),
    rewardTitle: premio.titulo || 'Premio Buttoncat',
    code: String(pc.codigoPremio),
    discountValue,
    pointsSpent: Number(pc.costoPuntos || premio.costoPuntos || 0),
    redeemedAt: pc.fechaExpiracion
      ? new Date(new Date(pc.fechaExpiracion).getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    isUsed: pc.estado === 'USADO' || pc.estado === 'EXPIRADO',
    productId: premio.variante?.idProducto
      ? String(premio.variante.idProducto)
      : premio.variante?.producto?.idProducto
      ? String(premio.variante.producto.idProducto)
      : undefined,
  };
}

export function mapBackendDomicilioToFrontend(d: any): UserAddress {
  return {
    id: String(d.idDomicilio),
    label: (d.nombreDomicilio || 'MI DIRECCION').toUpperCase(),
    street: d.calle || '',
    number: String(d.altura ?? ''),
    floorDept: d.depto || '',
    city: d.localidad?.localidad || '',
    province: d.localidad?.provincia?.provincia || '',
    zipCode: d.codigoPostal || '',
    isDefault: Boolean(d.esPredeterminado),
  };
}

export function mapBackendOrderToFrontend(o: any): AdminOrder {
  const itemsText = o.detalles && o.detalles.length > 0
    ? o.detalles.map((d: any) => {
        const prodName = d.variante?.producto?.nombreProducto || d.productoCustom?.nombreCustom || 'Item';
        const customNote = d.productoCustom?.comentarioCliente ? ` (${d.productoCustom.comentarioCliente})` : '';
        return `${d.cantidad}x ${prodName}${customNote}`;
      }).join(', ')
    : '1x Pedido Buttoncat';

  const subtotal = Number(o.total || 0) + Number(o.descuento || 0) - Number(o.costoDeEnvio || 0);
  const mappedStatus = o.estado === 'EN_PREPARACION' ? 'EN_CONFECCION' : o.estado;
  const totalUnits = o.detalles && o.detalles.length > 0
    ? o.detalles.reduce((acc: number, d: any) => acc + (Number(d.cantidad) || 1), 0)
    : 1;

  const items = Array.isArray(o.detalles)
    ? o.detalles.map((d: any) => {
        const prodName = d.variante?.producto?.nombreProducto || d.productoCustom?.nombreCustom || 'Item';
        const isCustom = Boolean(d.idProductoCustom || d.productoCustom);
        const templateName = d.productoCustom?.nombrePlantilla;
        const isSystemManual =
          templateName === 'SISTEMA_ITEM_A_MEDIDA' ||
          d.productoCustom?.plantillaActiva === false ||
          templateName?.toUpperCase() === 'TALLER CUSTOM';
        const customType: 'WORKSHOP' | 'MANUAL' | undefined = isCustom
          ? isSystemManual
            ? 'MANUAL'
            : 'WORKSHOP'
          : undefined;

        const qty = Math.max(1, Number(d.cantidad || 1));
        const computedUnitPrice = d.subtotal
          ? Number(d.subtotal) / qty
          : Number(d.precioUnitario || d.variante?.precioFinal || d.productoCustom?.precioFinal || 0);
        return {
          productId: d.variante?.idProducto
            ? String(d.variante.idProducto)
            : d.variante?.producto?.idProducto
            ? String(d.variante.producto.idProducto)
            : undefined,
          variantId: d.idVariante ? Number(d.idVariante) : undefined,
          productName: prodName,
          quantity: qty,
          unitPrice: computedUnitPrice,
          optionsText: d.productoCustom?.comentarioCliente || undefined,
          isCustom,
          customType,
          templateCategory: customType === 'WORKSHOP' ? templateName : undefined,
        };
      })
    : undefined;

  const hasWorkshopItems = Boolean(
    o.detalles?.some(
      (d: any) =>
        d.productoCustom &&
        d.productoCustom.nombrePlantilla !== 'SISTEMA_ITEM_A_MEDIDA' &&
        d.productoCustom.plantillaActiva !== false &&
        d.productoCustom.nombrePlantilla?.toUpperCase() !== 'TALLER CUSTOM'
    )
  );

  const hasManualItems = Boolean(
    o.detalles?.some(
      (d: any) =>
        d.productoCustom &&
        (d.productoCustom.nombrePlantilla === 'SISTEMA_ITEM_A_MEDIDA' ||
          d.productoCustom.plantillaActiva === false ||
          d.productoCustom.nombrePlantilla?.toUpperCase() === 'TALLER CUSTOM')
    )
  );

  return {
    id: String(o.idPedido),
    customerId: o.idCliente ? String(o.idCliente) : undefined,
    customerName: o.nombreCompleto,
    customerEmail: o.correoContacto,
    customerPhone: o.telefonoContacto || undefined,
    date: new Date(o.fechaEmision).toLocaleDateString('es-AR'),
    total: Number(o.total || 0),
    subtotal: subtotal > 0 ? subtotal : Number(o.total || 0),
    discountAmount: Number(o.descuento || 0),
    status: mappedStatus,
    itemsCount: totalUnits,
    itemsSummary: itemsText,
    items,
    isCustomOrder: hasWorkshopItems,
    hasManualCustomItems: hasManualItems,
    trackingNumber: o.codigoSeguimiento || undefined,
    receiptUrl: resolveImageUrl(o.comprobanteUrl) || undefined,
    shippingAddress: [o.calleEntrega, o.alturaEntrega, o.localidadEntrega, o.provinciaEntrega].filter(Boolean).join(', ') || undefined,
    shippingProvince: o.provinciaEntrega || undefined,
    shippingCity: o.localidadEntrega || undefined,
    carrier: o.codigoSeguimiento ? 'Envio Andreani' : 'Retiro en Sucursal',
    paymentMethod: o.metodoPago?.nombreMetodoPago || 'Digital',
    idMetodoPago: o.idMetodoPago ? Number(o.idMetodoPago) : (o.metodoPago?.idMetodoPago ? Number(o.metodoPago.idMetodoPago) : undefined),
    paymentStatus: o.estado === 'PENDIENTE' ? 'PENDIENTE' : 'PAGADO',
  };
}

export function mapBackendTemplateToCategoryInfo(t: any): CustomizableProductCategoryInfo {
  return {
    id: (t.nombrePlantilla || '').toUpperCase() as CustomizableCategory,
    name: t.nombrePlantilla || '',
    description: t.descripcion || '',
    basePrice: Number(t.precioBase || 0),
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
    baseImage: resolveImageUrl(t.imagenBaseUrl) || '',
    thumbnailUrl: resolveImageUrl(t.imagenBaseUrl) || '',
    supportsImageUpload: Boolean(t.permiteSubirImagen),
    isCustomTemplate: true,
    baseArchetype: 'CUSTOM',
    defaultImageTransform: t.transformGlobal || { posX: 0, posY: 0, zoom: 100, rotate: 0 },
    backendId: t.idPlantillaCustom ? Number(t.idPlantillaCustom) : undefined,
  };
}

export function mapBackendTemplateToOptionGroups(t: any): CategoryOptionGroup[] {
  if (!t.variaciones || t.variaciones.length === 0) return [];
  return t.variaciones.map((v: any) => ({
    key: (v.nombreVariacion || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label: v.nombreVariacion,
    transform: v.transformVariante || undefined,
    targetGroupKey: v.transformVariante?.targetGroupKey || undefined,
    choices: (v.opciones || []).map((opt: any) => ({
      id: String(opt.idOpcionCustom),
      name: opt.nombreOpcion,
      priceDelta: Number(opt.precioExtra || 0),
      colorSwatch: opt.colorHex || undefined,
      imageUrl: resolveImageUrl(opt.imagenPlantillaUrl) || undefined,
      transform: opt.transformOpcion || undefined,
    })),
  }));
}

export function mapBackendSavedDesignToFrontend(fav: any): SavedDesign {
  const pc = fav.productoCustom || fav;
  const rawTransform = pc.transformImagenSubida || {};

  // Extraer opciones desde opcionesMapa (si se guardo el mapa directo) o desde opcionesSeleccionadas
  let options: Record<string, string> = {};
  if (rawTransform.opcionesMapa && typeof rawTransform.opcionesMapa === 'object') {
    options = { ...rawTransform.opcionesMapa };
  } else if (Array.isArray(pc.opcionesSeleccionadas)) {
    pc.opcionesSeleccionadas.forEach((os: any) => {
      const oc = os.opcionCustom || os;
      const varName = oc.variacion?.nombreVariacion || 'opcion';
      const key = varName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (oc.nombreOpcion) {
        options[key] = oc.nombreOpcion;
      }
    });
  }

  const category = (
    rawTransform.categoriaCustom ||
    pc.plantilla?.nombrePlantilla ||
    'PINES'
  ).toUpperCase();

  const summaryParts = Object.values(options).filter(Boolean);
  const summaryText =
    summaryParts.length > 0
      ? pc.imagenSubidaClienteUrl
        ? `${summaryParts.join(', ')} (Imagen personalizada)`
        : summaryParts.join(', ')
      : pc.comentarioCliente || 'Diseno personalizado';

  const imageTransforms =
    rawTransform.zoom !== undefined || rawTransform.posX !== undefined
      ? {
          zoom: Number(rawTransform.zoom ?? 100),
          posX: Number(rawTransform.posX ?? 0),
          posY: Number(rawTransform.posY ?? 0),
          rotate: Number(rawTransform.rotate ?? 0),
        }
      : undefined;

  return {
    id: String(pc.idProductoCustom),
    name: pc.nombreCustom || 'Diseno Personalizado',
    description: pc.comentarioCliente || undefined,
    category,
    summaryText,
    customImage: resolveImageUrl(pc.imagenSubidaClienteUrl || pc.plantilla?.imagenBaseUrl) || undefined,
    options,
    createdAt: pc.createdAt
      ? new Date(pc.createdAt).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    imageTransforms,
  };
}

// ==========================================
// MAPPERS: FRONTEND -> BACKEND MUTATIONS
// ==========================================

export function mapFrontendProductToBackend(
  p: Product,
  categoriesList?: CategoryItem[],
  tagsList?: BadgeItem[],
  stylesList?: StyleItem[]
) {
  // Resolver idCategoria
  let categoryIdNum = p.categoryId ? Number(p.categoryId) : undefined;
  if (!categoryIdNum && categoriesList) {
    const matched = categoriesList.find(
      (c) => c.name.toUpperCase() === (p.category || '').toUpperCase()
    );
    if (matched) categoryIdNum = Number(matched.id);
  }
  if (!categoryIdNum || isNaN(categoryIdNum)) {
    categoryIdNum = 1; // Default fallback a la primera categoria
  }

  // Resolver estilos
  let estiloIds: number[] = [];
  if (p.styleIds && p.styleIds.length > 0) {
    estiloIds = p.styleIds.map(Number).filter((n) => !isNaN(n));
  } else if (p.vibe && p.vibe.length > 0 && stylesList) {
    estiloIds = p.vibe
      .map((v) => {
        const found = stylesList.find((s) => s.name.toUpperCase() === v.toUpperCase());
        return found ? Number(found.id) : null;
      })
      .filter((n): n is number => n !== null && !isNaN(n));
  }

  // Resolver etiqueta
  let etiquetaIds: { idEtiqueta: number; esPredeterminado?: boolean }[] = [];
  if (p.badgeId) {
    etiquetaIds = [{ idEtiqueta: Number(p.badgeId), esPredeterminado: true }];
  } else if (p.badge && tagsList) {
    const found = tagsList.find((t) => t.name.toUpperCase() === (p.badge || '').toUpperCase());
    if (found && !isNaN(Number(found.id))) {
      etiquetaIds = [{ idEtiqueta: Number(found.id), esPredeterminado: true }];
    }
  }

  // Resolver imagenes
  const imagenesList = (p.images && p.images.length > 0 ? p.images : [p.image]).filter(Boolean);
  const imagenesPayload = imagenesList.map((url, idx) => ({
    imagenProductoUrl: url,
    esPortada: idx === 0,
    posicion: idx,
  }));

  // Resolver variantes
  const resolveOptionPriceExtra = (varName: string, optName: string): number => {
    const groups = p.variations || [];
    const matchedGroup = groups.find((g) => g.name.trim().toUpperCase() === varName.trim().toUpperCase());
    if (!matchedGroup) return 0;
    const matchedOpt = (matchedGroup.options || []).find(
      (o) => getOptionLabel(o).trim().toUpperCase() === optName.trim().toUpperCase()
    );
    return matchedOpt ? getOptionPriceDelta(matchedOpt) : 0;
  };

  const variantesPayload = [];
  if (p.variantStocks && Object.keys(p.variantStocks).length > 0) {
    let index = 1;
    for (const [key, stock] of Object.entries(p.variantStocks)) {
      const parsed = parseCombinationKey(key);
      let opcionesNombres: Array<{ nombreVariacion: string; nombreOpcion: string; precioExtra?: number }> = [];

      if (Object.keys(parsed).length > 0) {
        opcionesNombres = Object.entries(parsed).map(([varName, optName]) => ({
          nombreVariacion: varName,
          nombreOpcion: optName,
          precioExtra: resolveOptionPriceExtra(varName, optName),
        }));
      } else if (p.variations && p.variations.length > 0) {
        const parts = key.split(/[\/|]/).map((s) => s.trim());
        opcionesNombres = parts.map((part, idx) => {
          const vName = p.variations![idx]?.name || `VARIACION_${idx + 1}`;
          return {
            nombreVariacion: vName,
            nombreOpcion: part,
            precioExtra: resolveOptionPriceExtra(vName, part),
          };
        });
      }

      const extraSum = opcionesNombres.reduce((acc, o) => acc + Number(o.precioExtra || 0), 0);
      const origStock = p.originalVariantStocks?.[key] !== undefined ? Number(p.originalVariantStocks[key]) : undefined;
      const currentStockNum = Number(stock) || 0;
      const stockDelta = origStock !== undefined ? currentStockNum - origStock : undefined;

      variantesPayload.push({
        sku: `${p.sku || 'SKU'}-${index}`,
        stock: currentStockNum,
        stockOriginal: origStock,
        stockDelta: stockDelta,
        precioFinal: Number(p.price || 0) + extraSum,
        imagenVarianteUrl: p.variantImages?.[key] || p.image,
        opcionesNombres: opcionesNombres.length > 0 ? opcionesNombres : undefined,
      });
      index++;
    }
  } else {
    const currentStockNum = Number(p.stock !== undefined ? p.stock : 10);
    const origStock = p.originalStock !== undefined ? Number(p.originalStock) : undefined;
    const stockDelta = origStock !== undefined ? currentStockNum - origStock : undefined;

    variantesPayload.push({
      sku: p.sku || `SKU-${Date.now().toString().slice(-6)}`,
      stock: currentStockNum,
      stockOriginal: origStock,
      stockDelta: stockDelta,
      precioFinal: Number(p.price || 0),
      imagenVarianteUrl: p.image,
    });
  }

  const rawChannel = (p.salesChannel || 'AMBOS').toUpperCase();
  const normalizedBackendChannel =
    rawChannel === 'SOLO_WEB' || rawChannel === 'WEB'
      ? 'WEB'
      : rawChannel === 'SOLO_LOCAL' || rawChannel === 'LOCAL'
      ? 'LOCAL'
      : 'AMBOS';

  return {
    idCategoria: categoryIdNum,
    nombreProducto: p.name,
    codigoProducto: p.sku || `BTC-${Date.now().toString().slice(-6)}`,
    descripcion: p.description || '',
    precioBase: Number(p.price || 0),
    precioAnterior: p.originalPrice ? Number(p.originalPrice) : undefined,
    activo: !(p.hiddenFromCatalog || p.isRewardOnly),
    canalDeVenta: normalizedBackendChannel as any,
    estiloIds,
    etiquetaIds,
    imagenes: imagenesPayload,
    variantes: variantesPayload,
  };
}

export function mapFrontendRewardToBackend(
  r: RewardItem,
  rewardCategoriesList?: RewardCategoryItem[]
) {
  let catId = r.categoryId ? Number(r.categoryId) : undefined;
  if (!catId && rewardCategoriesList) {
    const matched = rewardCategoriesList.find(
      (c) => c.name.toUpperCase() === (r.category || '').toUpperCase()
    );
    if (matched) catId = Number(matched.id);
  }
  if (!catId || isNaN(catId)) catId = 1;

  return {
    titulo: r.title,
    descripcion: r.description,
    costoPuntos: Number(r.pointsCost || 0),
    imagenPremioUrl: r.image || '',
    stockPremios: Number(r.stock !== undefined ? r.stock : 100),
    idCategoriaPremio: catId,
    idVariante: r.productId ? Number(r.productId) : undefined,
    activo: true,
  };
}


