import type { CustomizableCategory } from '../types/types';
import { 
  type CustomizableProductCategoryInfo, 
  type CategoryOptionGroup 
} from './customData';
import {
  mapBackendTemplateToCategoryInfo,
  mapBackendTemplateToOptionGroups,
} from '../services/mappers';
import { customProductsApi } from '../services/api';

const STORAGE_KEY_CATEGORIES = 'buttoncat_custom_categories_v3';
const STORAGE_KEY_OPTIONS = 'buttoncat_custom_options_v3';

// Limpieza de claves previas v2 con datos mockups
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('buttoncat_custom_categories_v2');
    localStorage.removeItem('buttoncat_custom_options_v2');
  } catch {
    // Ignorar errores de acceso a almacenamiento
  }
}

const loadSavedCategories = (): CustomizableProductCategoryInfo[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading custom categories from localStorage', err);
  }
  return [];
};

const loadSavedOptions = (): Record<CustomizableCategory, CategoryOptionGroup[]> => {
  const emptyOptions = {} as Record<CustomizableCategory, CategoryOptionGroup[]>;
  if (typeof window === 'undefined') return emptyOptions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading custom options from localStorage', err);
  }
  return emptyOptions;
};

// Global mutable state to ensure client customizer & admin customizer share 100% unified data & formats
let activeCategoriesData: CustomizableProductCategoryInfo[] = loadSavedCategories();
let activeOptionsMap: Record<CustomizableCategory, CategoryOptionGroup[]> = loadSavedOptions();

// Store listeners for real-time reactivity
type StoreListener = () => void;
const listeners: Set<StoreListener> = new Set();

export const getCustomCategoriesData = (): CustomizableProductCategoryInfo[] => activeCategoriesData;
export const getCustomOptionsMap = (): Record<CustomizableCategory, CategoryOptionGroup[]> => activeOptionsMap;

export const syncTemplatesFromBackend = (templates: any[]) => {
  if (!templates || templates.length === 0) {
    activeCategoriesData = [];
    activeOptionsMap = {} as Record<CustomizableCategory, CategoryOptionGroup[]>;
  } else {
    activeCategoriesData = templates.map(mapBackendTemplateToCategoryInfo);
    const newOptionsMap: Record<string, CategoryOptionGroup[]> = {};
    templates.forEach((t) => {
      const catId = (t.nombrePlantilla || '').toUpperCase();
      newOptionsMap[catId] = mapBackendTemplateToOptionGroups(t);
    });
    activeOptionsMap = newOptionsMap as Record<CustomizableCategory, CategoryOptionGroup[]>;
  }
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error saving custom templates to localStorage', err);
  }
  notifyListeners();
};

export const updateCustomCategoryInfo = (category: CustomizableCategory, updates: Partial<CustomizableProductCategoryInfo>) => {
  activeCategoriesData = activeCategoriesData.map((cat) => (cat.id === category ? { ...cat, ...updates } : cat));
  const targetCategory = activeCategoriesData.find((cat) => cat.id === category);
  if (targetCategory && targetCategory.backendId) {
    customProductsApi.updateTemplate(targetCategory.backendId, {
      nombrePlantilla: targetCategory.name,
      descripcion: targetCategory.description,
      precioBase: targetCategory.basePrice,
      permiteSubirImagen: targetCategory.supportsImageUpload,
      transformGlobal: targetCategory.defaultImageTransform as any,
      imagenBaseUrl: targetCategory.baseImage,
    }).catch((err) => console.error('[UpdateTemplate API Error]:', err));
  }
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
  } catch (err) {
    console.error('Error saving categories to localStorage', err);
  }
  notifyListeners();
};

export const updateCustomCategoryOptions = (category: CustomizableCategory, newGroups: CategoryOptionGroup[]) => {
  activeOptionsMap = {
    ...activeOptionsMap,
    [category]: newGroups,
  };
  try {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error saving options to localStorage', err);
  }
  notifyListeners();
};

export const addCustomCategory = (
  newCategory: CustomizableProductCategoryInfo,
  initialGroups: CategoryOptionGroup[] = []
) => {
  const exists = activeCategoriesData.some((c) => c.id === newCategory.id);
  if (exists) {
    activeCategoriesData = activeCategoriesData.map((c) => (c.id === newCategory.id ? { ...c, ...newCategory } : c));
  } else {
    activeCategoriesData = [...activeCategoriesData, { ...newCategory, isCustomTemplate: true }];
  }

  activeOptionsMap = {
    ...activeOptionsMap,
    [newCategory.id]: initialGroups,
  };

  customProductsApi.createTemplate({
    nombrePlantilla: newCategory.name,
    descripcion: newCategory.description || '',
    precioBase: Number(newCategory.basePrice || 0),
    permiteSubirImagen: Boolean(newCategory.supportsImageUpload),
    transformGlobal: newCategory.defaultImageTransform as any,
    imagenBaseUrl: newCategory.baseImage || '',
    variaciones: initialGroups.map((g, gIdx) => ({
      nombreVariacion: g.label,
      nroPaso: gIdx + 1,
      ordenCapaSvg: gIdx + 1,
      transformVariante: g.transform as any,
      opciones: (g.choices || []).map((ch) => ({
        nombreOpcion: ch.name,
        imagenPlantillaUrl: ch.imageUrl || '',
        colorHex: ch.colorSwatch,
        precioExtra: ch.priceDelta || 0,
        transformOpcion: ch.transform as any,
      })),
    })),
  }).then((res) => {
    if (res.success && res.data) {
      activeCategoriesData = activeCategoriesData.map((c) =>
        c.id === newCategory.id ? { ...c, backendId: res.data.idPlantillaCustom } : c
      );
      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
      } catch {}
    }
  }).catch((err) => console.error('[CreateTemplate API Error]:', err));

  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error saving new custom category to localStorage', err);
  }
  notifyListeners();
};

export const deleteCustomCategory = (categoryId: string) => {
  const targetCategory = activeCategoriesData.find((c) => c.id === categoryId);
  if (targetCategory && targetCategory.backendId) {
    customProductsApi.deleteTemplate(targetCategory.backendId).catch((err) =>
      console.error('[DeleteTemplate API Error]:', err)
    );
  }

  activeCategoriesData = activeCategoriesData.filter((c) => c.id !== categoryId);
  const newOptionsMap = { ...activeOptionsMap };
  delete (newOptionsMap as Record<string, CategoryOptionGroup[]>)[categoryId];
  activeOptionsMap = newOptionsMap;

  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error deleting custom category from localStorage', err);
  }
  notifyListeners();
};

export const resetCustomStoreToDefaults = () => {
  activeCategoriesData = [];
  activeOptionsMap = {} as Record<CustomizableCategory, CategoryOptionGroup[]>;
  try {
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_OPTIONS);
  } catch (err) {
    console.error('Error clearing custom store localStorage', err);
  }
  notifyListeners();
};

export const subscribeToCustomStore = (listener: StoreListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn());
};
