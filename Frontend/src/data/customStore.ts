import type { CustomizableCategory } from '../types/types';
import { 
  type CustomizableProductCategoryInfo, 
  type CategoryOptionGroup 
} from './customData';
import {
  mapBackendTemplateToCategoryInfo,
  mapBackendTemplateToOptionGroups,
} from '../services/mappers';
import { customProductsApi, uploadApi } from '../services/api';

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
    if (raw) {
      const parsed: CustomizableProductCategoryInfo[] = JSON.parse(raw);
      return parsed.filter(
        (c) =>
          c.id !== 'TALLER CUSTOM' &&
          c.name?.toUpperCase() !== 'TALLER CUSTOM' &&
          c.id !== 'SISTEMA_ITEM_A_MEDIDA'
      );
    }
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
  const validTemplates = (templates || []).filter(
    (t) =>
      t.activo !== false &&
      t.nombrePlantilla !== 'SISTEMA_ITEM_A_MEDIDA' &&
      t.nombrePlantilla?.toUpperCase() !== 'TALLER CUSTOM'
  );
  if (validTemplates.length === 0) {
    activeCategoriesData = [];
    activeOptionsMap = {} as Record<CustomizableCategory, CategoryOptionGroup[]>;
  } else {
    activeCategoriesData = validTemplates.map(mapBackendTemplateToCategoryInfo);
    const newOptionsMap: Record<string, CategoryOptionGroup[]> = {};
    validTemplates.forEach((t) => {
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

const slugifyGroupKey = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

const resolveCanonicalTargetKey = (
  group: CategoryOptionGroup,
  allGroups: CategoryOptionGroup[]
): string | undefined => {
  const rawTarget = group.targetGroupKey || group.transform?.targetGroupKey;
  if (!rawTarget) return undefined;
  if (rawTarget === '__BASE_MOCKUP__') return '__BASE_MOCKUP__';
  const matched = allGroups.find(
    (og) =>
      og.key === rawTarget ||
      slugifyGroupKey(og.label) === slugifyGroupKey(rawTarget) ||
      og.label.trim().toLowerCase() === rawTarget.trim().toLowerCase()
  );
  if (matched) {
    return slugifyGroupKey(matched.label || matched.key);
  }
  return rawTarget;
};

const isColorAttributeGroup = (group: CategoryOptionGroup): boolean => {
  const hasImages = (group.choices || []).some((c) => Boolean(c.imageUrl && c.imageUrl.trim().length > 0));
  if (hasImages) return false;
  return (
    Boolean(group.targetGroupKey || group.transform?.targetGroupKey) ||
    group.key.toLowerCase().includes('color') ||
    group.label.toLowerCase().includes('color') ||
    group.label.toLowerCase().includes('tono')
  );
};

const uploadGroupImagesIfNeeded = async (
  groups: CategoryOptionGroup[],
  folder: string = 'buttoncat/custom-templates'
): Promise<CategoryOptionGroup[]> => {
  return Promise.all(
    groups.map(async (g) => {
      const uploadedChoices = await Promise.all(
        (g.choices || []).map(async (ch) => {
          if (ch.imageUrl && ch.imageUrl.startsWith('data:')) {
            const uploadedUrl = await uploadApi.uploadImageWithFallback(ch.imageUrl, folder);
            return { ...ch, imageUrl: uploadedUrl };
          }
          return ch;
        })
      );
      return { ...g, choices: uploadedChoices };
    })
  );
};

export const updateCustomCategoryOptions = (category: CustomizableCategory, newGroups: CategoryOptionGroup[]) => {
  activeOptionsMap = {
    ...activeOptionsMap,
    [category]: newGroups,
  };

  const targetCategory = activeCategoriesData.find((cat) => cat.id === category);
  if (targetCategory && targetCategory.backendId) {
    customProductsApi
      .updateTemplate(targetCategory.backendId, {
        variaciones: newGroups.map((g, gIdx) => {
          const canonicalTarget = resolveCanonicalTargetKey(g, newGroups);
          const isColorGrp = isColorAttributeGroup(g);
          return {
            nombreVariacion: g.label,
            nroPaso: gIdx + 1,
            ordenCapaSvg: gIdx + 1,
            transformVariante: (g.transform || canonicalTarget
              ? { ...(g.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 }), targetGroupKey: canonicalTarget }
              : undefined) as any,
            opciones: (g.choices || []).map((ch) => ({
              nombreOpcion: ch.name,
              imagenPlantillaUrl: ch.imageUrl || '',
              colorHex: ch.colorSwatch || (isColorGrp ? '#18181B' : undefined),
              precioExtra: ch.priceDelta || 0,
              transformOpcion: ch.transform as any,
            })),
          };
        }),
      })
      .then((res) => {
        if (res.success && res.data) {
          activeOptionsMap = {
            ...activeOptionsMap,
            [category]: mapBackendTemplateToOptionGroups(res.data),
          };
          try {
            localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
          } catch {}
          notifyListeners();
        }
      })
      .catch((err) => console.error('[UpdateTemplateOptions API Error]:', err));
  }

  try {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error saving options to localStorage', err);
  }
  notifyListeners();
};

export const saveCustomCategoryComplete = async (
  category: CustomizableCategory,
  updates: Partial<CustomizableProductCategoryInfo>,
  newGroups: CategoryOptionGroup[]
): Promise<boolean> => {
  const existing = activeCategoriesData.find((cat) => cat.id === category);
  const mergedCategory: CustomizableProductCategoryInfo = existing
    ? { ...existing, ...updates, id: (updates.name || existing.name).trim().toUpperCase() as CustomizableCategory }
    : {
        id: (updates.name || category).trim().toUpperCase() as CustomizableCategory,
        name: (updates.name || category).trim().toUpperCase(),
        description: updates.description || '',
        basePrice: Number(updates.basePrice || 0),
        bgColor: updates.bgColor || 'bg-yellow-100 hover:bg-yellow-200',
        baseImage: updates.baseImage || '',
        thumbnailUrl: updates.thumbnailUrl || updates.baseImage || '',
        supportsImageUpload: Boolean(updates.supportsImageUpload),
        isCustomTemplate: true,
        baseArchetype: updates.baseArchetype || 'CUSTOM',
        defaultImageTransform: updates.defaultImageTransform,
        backendId: updates.backendId,
      };

  const uploadedBaseImage =
    mergedCategory.baseImage && mergedCategory.baseImage.startsWith('data:')
      ? await uploadApi.uploadImageWithFallback(mergedCategory.baseImage, 'buttoncat/custom-templates')
      : mergedCategory.baseImage || '';
  mergedCategory.baseImage = uploadedBaseImage;
  if (mergedCategory.thumbnailUrl && mergedCategory.thumbnailUrl.startsWith('data:')) {
    mergedCategory.thumbnailUrl = uploadedBaseImage;
  }

  const uploadedGroups = await uploadGroupImagesIfNeeded(newGroups, 'buttoncat/custom-templates');

  const payload = {
    nombrePlantilla: mergedCategory.name,
    descripcion: mergedCategory.description || '',
    precioBase: Number(mergedCategory.basePrice || 0),
    permiteSubirImagen: Boolean(mergedCategory.supportsImageUpload),
    transformGlobal: mergedCategory.defaultImageTransform as any,
    imagenBaseUrl: uploadedBaseImage,
    variaciones: uploadedGroups.map((g, gIdx) => {
      const canonicalTarget = resolveCanonicalTargetKey(g, uploadedGroups);
      const isColorGrp = isColorAttributeGroup(g);
      return {
        nombreVariacion: g.label,
        nroPaso: gIdx + 1,
        ordenCapaSvg: gIdx + 1,
        transformVariante: (g.transform || canonicalTarget
          ? { ...(g.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 }), targetGroupKey: canonicalTarget }
          : undefined) as any,
        opciones: (g.choices || []).map((ch) => ({
          nombreOpcion: ch.name,
          imagenPlantillaUrl: ch.imageUrl || '',
          colorHex: ch.colorSwatch || (isColorGrp ? '#18181B' : undefined),
          precioExtra: ch.priceDelta || 0,
          transformOpcion: ch.transform as any,
        })),
      };
    }),
  };

  try {
    const res = mergedCategory.backendId
      ? await customProductsApi.updateTemplate(mergedCategory.backendId, payload)
      : await customProductsApi.createTemplate(payload);

    if (res.success && res.data) {
      const mappedCat = mapBackendTemplateToCategoryInfo(res.data);
      const mappedGroups = mapBackendTemplateToOptionGroups(res.data);

      activeCategoriesData = activeCategoriesData.map((cat) =>
        cat.id === category || cat.backendId === mappedCat.backendId ? { ...mergedCategory, ...mappedCat } : cat
      );

      const nextOptionsMap = { ...activeOptionsMap };
      if (category !== mappedCat.id) {
        delete (nextOptionsMap as Record<string, CategoryOptionGroup[]>)[category];
      }
      nextOptionsMap[mappedCat.id] = mappedGroups;
      activeOptionsMap = nextOptionsMap;

      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
        localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
      } catch {}
      notifyListeners();
      return true;
    }
  } catch (err) {
    console.error('[SaveCustomCategoryComplete API Error]:', err);
  }

  activeCategoriesData = activeCategoriesData.map((cat) => (cat.id === category ? mergedCategory : cat));
  const nextOptionsMap = { ...activeOptionsMap };
  if (category !== mergedCategory.id) {
    delete (nextOptionsMap as Record<string, CategoryOptionGroup[]>)[category];
  }
  nextOptionsMap[mergedCategory.id] = newGroups;
  activeOptionsMap = nextOptionsMap;

  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch {}
  notifyListeners();
  return false;
};

export const addCustomCategory = async (
  newCategory: CustomizableProductCategoryInfo,
  initialGroups: CategoryOptionGroup[] = []
): Promise<boolean> => {
  const normalizedId = newCategory.name.trim().toUpperCase() as CustomizableCategory;
  const catWithId: CustomizableProductCategoryInfo = {
    ...newCategory,
    id: normalizedId,
    name: normalizedId,
    isCustomTemplate: true,
  };

  try {
    const uploadedBaseImage =
      catWithId.baseImage && catWithId.baseImage.startsWith('data:')
        ? await uploadApi.uploadImageWithFallback(catWithId.baseImage, 'buttoncat/custom-templates')
        : catWithId.baseImage || '';
    catWithId.baseImage = uploadedBaseImage;
    if (catWithId.thumbnailUrl && catWithId.thumbnailUrl.startsWith('data:')) {
      catWithId.thumbnailUrl = uploadedBaseImage;
    }

    const uploadedGroups = await uploadGroupImagesIfNeeded(initialGroups, 'buttoncat/custom-templates');

    const res = await customProductsApi.createTemplate({
      nombrePlantilla: catWithId.name,
      descripcion: catWithId.description || '',
      precioBase: Number(catWithId.basePrice || 0),
      permiteSubirImagen: Boolean(catWithId.supportsImageUpload),
      transformGlobal: catWithId.defaultImageTransform as any,
      imagenBaseUrl: uploadedBaseImage,
      variaciones: uploadedGroups.map((g, gIdx) => {
        const canonicalTarget = resolveCanonicalTargetKey(g, uploadedGroups);
        const isColorGrp = isColorAttributeGroup(g);
        return {
          nombreVariacion: g.label,
          nroPaso: gIdx + 1,
          ordenCapaSvg: gIdx + 1,
          transformVariante: (g.transform || canonicalTarget
            ? { ...(g.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 }), targetGroupKey: canonicalTarget }
            : undefined) as any,
          opciones: (g.choices || []).map((ch) => ({
            nombreOpcion: ch.name,
            imagenPlantillaUrl: ch.imageUrl || '',
            colorHex: ch.colorSwatch || (isColorGrp ? '#18181B' : undefined),
            precioExtra: ch.priceDelta || 0,
            transformOpcion: ch.transform as any,
          })),
        };
      }),
    });

    if (res.success && res.data) {
      const mappedCat = mapBackendTemplateToCategoryInfo(res.data);
      const mappedGroups = mapBackendTemplateToOptionGroups(res.data);

      const exists = activeCategoriesData.some((c) => c.id === mappedCat.id || c.backendId === mappedCat.backendId);
      if (exists) {
        activeCategoriesData = activeCategoriesData.map((c) =>
          c.id === mappedCat.id || c.backendId === mappedCat.backendId ? { ...catWithId, ...mappedCat } : c
        );
      } else {
        activeCategoriesData = [...activeCategoriesData, { ...catWithId, ...mappedCat }];
      }

      activeOptionsMap = {
        ...activeOptionsMap,
        [mappedCat.id]: mappedGroups,
      };

      try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
        localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
      } catch {}
      notifyListeners();
      return true;
    }
  } catch (err) {
    console.error('[CreateTemplate API Error]:', err);
  }

  const exists = activeCategoriesData.some((c) => c.id === catWithId.id);
  if (exists) {
    activeCategoriesData = activeCategoriesData.map((c) => (c.id === catWithId.id ? { ...c, ...catWithId } : c));
  } else {
    activeCategoriesData = [...activeCategoriesData, catWithId];
  }

  activeOptionsMap = {
    ...activeOptionsMap,
    [catWithId.id]: initialGroups,
  };

  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(activeCategoriesData));
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(activeOptionsMap));
  } catch (err) {
    console.error('Error saving new custom category to localStorage', err);
  }
  notifyListeners();
  return false;
};

export const deleteCustomCategory = async (categoryId: string): Promise<boolean> => {
  const targetCategory = activeCategoriesData.find((c) => c.id === categoryId);
  if (targetCategory && targetCategory.backendId) {
    try {
      await customProductsApi.deleteTemplate(targetCategory.backendId);
    } catch (err) {
      console.error('[DeleteTemplate API Error]:', err);
    }
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
  return true;
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
