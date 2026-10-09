import type { CustomizableCategory } from '../types/types';
import { 
  CUSTOMIZABLE_CATEGORIES_DATA, 
  CATEGORY_OPTIONS_MAP, 
  type CustomizableProductCategoryInfo, 
  type CategoryOptionGroup 
} from './customData';

// Global mutable state to ensure client customizer & admin customizer share 100% unified data & formats
let activeCategoriesData: CustomizableProductCategoryInfo[] = JSON.parse(JSON.stringify(CUSTOMIZABLE_CATEGORIES_DATA));
let activeOptionsMap: Record<CustomizableCategory, CategoryOptionGroup[]> = JSON.parse(JSON.stringify(CATEGORY_OPTIONS_MAP));

// Store listeners for real-time reactivity
type StoreListener = () => void;
const listeners: Set<StoreListener> = new Set();

export const getCustomCategoriesData = (): CustomizableProductCategoryInfo[] => activeCategoriesData;
export const getCustomOptionsMap = (): Record<CustomizableCategory, CategoryOptionGroup[]> => activeOptionsMap;

export const updateCustomCategoryInfo = (category: CustomizableCategory, updates: Partial<CustomizableProductCategoryInfo>) => {
  activeCategoriesData = activeCategoriesData.map((cat) => (cat.id === category ? { ...cat, ...updates } : cat));
  notifyListeners();
};

export const updateCustomCategoryOptions = (category: CustomizableCategory, newGroups: CategoryOptionGroup[]) => {
  activeOptionsMap = {
    ...activeOptionsMap,
    [category]: newGroups,
  };
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
