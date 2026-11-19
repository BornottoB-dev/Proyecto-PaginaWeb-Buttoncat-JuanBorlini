import type { CustomizableCategory } from '../types/types';

export interface CustomizableProductCategoryInfo {
  id: CustomizableCategory;
  name: string;
  description: string;
  basePrice: number;
  bgColor: string;
  baseImage?: string;
  thumbnailUrl?: string;
  supportsImageUpload?: boolean;
  isCustomTemplate?: boolean;
  baseArchetype?: string;
  defaultImageTransform?: ChoiceTransform;
  backendId?: number;
}

export interface ChoiceTransform {
  posX: number;
  posY: number;
  zoom: number;
  rotate: number;
  targetGroupKey?: string;
}

export interface OptionChoice {
  id: string;
  name: string;
  priceDelta: number;
  colorSwatch?: string;
  iconVisual?: string;
  imageUrl?: string;
  transform?: ChoiceTransform;
}

export interface CategoryOptionGroup {
  key: string;
  label: string;
  choices: OptionChoice[];
  transform?: ChoiceTransform;
  targetGroupKey?: string;
}

export function isSpatialAttribute(key: string, label: string): boolean {
  const k = key.toLowerCase();
  const l = label.toLowerCase();

  const spatialKeywords = [
    'forma', 'figura', 'cuerpo', 'orejas', 'dije', 'ojos', 'costuras', 
    'accesorio', 'estampa', 'posicion', 'ubicacion', 'silueta', 'modelo',
    'cadena', 'anzuelo', 'enganche', 'broche', 'colgante', 'llavero'
  ];

  const nonSpatialKeywords = [
    'color', 'metal', 'acabado', 'largo', 'talle', 'tamano', 'tamaño', 
    'material', 'laminado', 'corte', 'estilo'
  ];

  const matchesSpatial = spatialKeywords.some((kw) => k.includes(kw) || l.includes(kw));
  if (matchesSpatial) {
    return true;
  }

  const matchesNonSpatial = nonSpatialKeywords.some((kw) => k.includes(kw) || l.includes(kw));
  if (matchesNonSpatial) {
    return false;
  }

  return true;
}

// Las plantillas personalizadas y sus opciones se obtienen dinamicamente desde la API real del Backend (/api/custom/templates)
export const CUSTOMIZABLE_CATEGORIES_DATA: CustomizableProductCategoryInfo[] = [];

export const CATEGORY_OPTIONS_MAP: Record<CustomizableCategory, CategoryOptionGroup[]> = {} as Record<CustomizableCategory, CategoryOptionGroup[]>;
