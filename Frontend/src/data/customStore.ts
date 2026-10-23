import type { CustomizableCategory } from '../types/types';
import { 
  CUSTOMIZABLE_CATEGORIES_DATA, 
  CATEGORY_OPTIONS_MAP, 
  type CustomizableProductCategoryInfo, 
  type CategoryOptionGroup 
} from './customData';

const STORAGE_KEY_CATEGORIES = 'buttoncat_custom_categories_v2';
const STORAGE_KEY_OPTIONS = 'buttoncat_custom_options_v2';

const loadSavedCategories = (): CustomizableProductCategoryInfo[] => {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(CUSTOMIZABLE_CATEGORIES_DATA));
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading custom categories from localStorage', err);
  }
  return JSON.parse(JSON.stringify(CUSTOMIZABLE_CATEGORIES_DATA));
};

const loadSavedOptions = (): Record<CustomizableCategory, CategoryOptionGroup[]> => {
  const defaults = JSON.parse(JSON.stringify(CATEGORY_OPTIONS_MAP));
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch (err) {
    console.error('Error loading custom options from localStorage', err);
  }
  return defaults;
};

// Global mutable state to ensure client customizer & admin customizer share 100% unified data & formats
let activeCategoriesData: CustomizableProductCategoryInfo[] = loadSavedCategories();
let activeOptionsMap: Record<CustomizableCategory, CategoryOptionGroup[]> = loadSavedOptions();

// Store listeners for real-time reactivity
type StoreListener = () => void;
const listeners: Set<StoreListener> = new Set();

export const getCustomCategoriesData = (): CustomizableProductCategoryInfo[] => activeCategoriesData;
export const getCustomOptionsMap = (): Record<CustomizableCategory, CategoryOptionGroup[]> => activeOptionsMap;

export const updateCustomCategoryInfo = (category: CustomizableCategory, updates: Partial<CustomizableProductCategoryInfo>) => {
  activeCategoriesData = activeCategoriesData.map((cat) => (cat.id === category ? { ...cat, ...updates } : cat));
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

export const resetCustomStoreToDefaults = () => {
  activeCategoriesData = JSON.parse(JSON.stringify(CUSTOMIZABLE_CATEGORIES_DATA));
  activeOptionsMap = JSON.parse(JSON.stringify(CATEGORY_OPTIONS_MAP));
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
