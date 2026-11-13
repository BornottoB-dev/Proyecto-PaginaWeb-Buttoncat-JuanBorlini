// Tipos de dominio para Producto Custom (Modulo 7) segun el Diagrama de Clases

export interface Transform2D {
  posicionX: number;
  posicionY: number;
  escalaZoom: number;
  rotacionGrados: number;
}

export interface PlantillaCustomDTO {
  idPlantillaCustom: number;
  nombrePlantilla: string;
  descripcion: string;
  precioBase: number;
  permiteSubirImagen: boolean;
  transformGlobal?: Transform2D;
  imagenBaseUrl: string;
  activo: boolean;
}

export interface VariacionCustomDTO {
  idVariacionCustom: number;
  idPlantillaCustom: number;
  nombreVariacion: string;
  nroPaso: number;
  ordenCapaSvg: number;
  transformVariante?: Transform2D;
  activo: boolean;
}

export interface OpcionVariacionCustomDTO {
  idOpcionCustom: number;
  idVariacionCustom: number;
  colorHex?: string;
  imagenPlantillaUrl: string;
  nombreOpcion: string;
  precioExtra: number;
  transformOpcion?: Transform2D;
  activo: boolean;
}

export interface ProductoCustomDTO {
  idProductoCustom: string; // UUID
  idPlantillaCustom: number;
  precioFinal: number;
  nombreCustom: string;
  imagenSubidaClienteUrl?: string;
  svgRenderizado: string;
  transformImagenSubida?: Transform2D;
  comentarioCliente?: string;
  opcionIds: number[];
}

