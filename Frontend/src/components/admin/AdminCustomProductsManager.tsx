import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Move, 
  SlidersHorizontal, 
  Eye, 
  Sparkles, 
  Search, 
  Check, 
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers,
  PlusCircle
} from 'lucide-react';
import type { CustomizableCategory } from '../../types/types';
import { CustomProductPreview } from '../customizer/CustomProductPreview';
import { 
  getCustomCategoriesData, 
  getCustomOptionsMap, 
  updateCustomCategoryInfo, 
  updateCustomCategoryOptions, 
  addCustomCategory,
  deleteCustomCategory,
  subscribeToCustomStore 
} from '../../data/customStore';
import { isSpatialAttribute } from '../../data/customData';
import type { CategoryOptionGroup } from '../customizer/ProductCustomizerStudio';
import type { CustomizableProductCategoryInfo } from '../customizer/CustomizerCatalogGrid';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { ValidationModal } from '../ui/ValidationModal';

interface AdminCustomProductsManagerProps {
  isDarkMode?: boolean;
}

export const AdminCustomProductsManager: React.FC<AdminCustomProductsManagerProps> = ({
  isDarkMode = true,
}) => {
  const [, setStoreTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TODAS');

  // Modal Editor state
  const [editingCategory, setEditingCategory] = useState<CustomizableCategory | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview-transforms' | 'options' | 'info'>('preview-transforms');

  // Working copy of editing category meta and option groups
  const [editingMeta, setEditingMeta] = useState<CustomizableProductCategoryInfo | null>(null);
  const [editingGroups, setEditingGroups] = useState<CategoryOptionGroup[]>([]);
  const [previewOptions, setPreviewOptions] = useState<Record<string, string>>({});
  const [previewTransforms, setPreviewTransforms] = useState({
    zoom: 100,
    posX: 0,
    posY: 0,
    rotate: 0,
  });
  const [customImageSample, setCustomImageSample] = useState<string | null>(null);

  // Variation / Choice Specific Transform States
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string>('');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [transformTargetMode, setTransformTargetMode] = useState<'choice' | 'group' | 'all'>('choice');

  // Collapsible Accordion & Layer Order States
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleToggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCollapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    editingGroups.forEach((g) => { next[g.key] = true; });
    setCollapsedGroups(next);
  };

  const handleExpandAllGroups = () => {
    setCollapsedGroups({});
  };

  const handleMoveGroupLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingGroups.length) return;
    const copy = [...editingGroups];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setEditingGroups(copy);
  };

  // Notification Banner
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Validation Notice Modal State
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    title: 'CAMPO OBLIGATORIO REQUERIDO',
    message: '',
  });

  const showValidationNotice = (message: string, title: string = 'CAMPO OBLIGATORIO REQUERIDO') => {
    setValidationModal({ isOpen: true, title, message });
  };

  // New Custom Product Template Creator State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState<{
    id: string;
    name: string;
    description: string;
    basePrice: number;
    baseImage: string;
    thumbnailUrl: string;
    supportsImageUpload: boolean;
    bgColor: string;
    baseArchetype?: string;
  }>({
    id: '',
    name: '',
    description: '',
    basePrice: 5000,
    baseImage: '',
    thumbnailUrl: '',
    supportsImageUpload: true,
    bgColor: 'bg-yellow-100 hover:bg-yellow-200',
    baseArchetype: 'CUSTOM',
  });
  const [newTemplateGroups, setNewTemplateGroups] = useState<CategoryOptionGroup[]>([]);
  const [createActiveTab, setCreateActiveTab] = useState<'info' | 'options' | 'preview'>('info');
  const [createPreviewTransforms, setCreatePreviewTransforms] = useState({
    zoom: 100,
    posX: 0,
    posY: 0,
    rotate: 0,
  });
  const [createPreviewOptions, setCreatePreviewOptions] = useState<Record<string, string>>({});
  const [createCustomSampleImage, setCreateCustomSampleImage] = useState<string | null>(null);

  // Calibration and Layer Management States for Create Wizard
  const [createSelectedAttributeKey, setCreateSelectedAttributeKey] = useState<string>('');
  const [createSelectedChoiceId, setCreateSelectedChoiceId] = useState<string>('');
  const [createTransformTargetMode, setCreateTransformTargetMode] = useState<'printArea' | 'choice' | 'group'>('printArea');
  const [createCollapsedGroups, setCreateCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleCreateToggleGroupCollapse = (key: string) => {
    setCreateCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateCollapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    newTemplateGroups.forEach((g) => { next[g.key] = true; });
    setCreateCollapsedGroups(next);
  };

  const handleCreateExpandAllGroups = () => {
    setCreateCollapsedGroups({});
  };

  const handleCreateMoveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTemplateGroups.length) return;
    const copy = [...newTemplateGroups];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setNewTemplateGroups(copy);
  };

  const handleUpdateCreateChoiceTransform = (
    groupKey: string,
    choiceId: string,
    updates: Partial<{ posX: number; posY: number; zoom: number; rotate: number }>
  ) => {
    setNewTemplateGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: g.choices.map((c) => {
            if (c.id !== choiceId) return c;
            const currentTf = c.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
            return {
              ...c,
              transform: { ...currentTf, ...updates },
            };
          }),
        };
      })
    );
  };

  const handleUpdateCreateGroupTransform = (
    groupKey: string,
    updates: Partial<{ posX: number; posY: number; zoom: number; rotate: number }>
  ) => {
    setNewTemplateGroups((prev) =>
      prev.map((g) => {
        if (g.key !== groupKey) return g;
        const currentTf = g.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
        return {
          ...g,
          transform: { ...currentTf, ...updates },
        };
      })
    );
  };

  // Delete Template Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<CustomizableProductCategoryInfo | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    const defaultSlug = `CUSTOM_${Math.floor(1000 + Math.random() * 9000)}`;
    setNewTemplateData({
      id: defaultSlug,
      name: '',
      description: '',
      basePrice: 5000,
      baseImage: '',
      thumbnailUrl: '',
      supportsImageUpload: true,
      bgColor: 'bg-yellow-100 hover:bg-yellow-200',
    });
    const defaultBlankGroups: CategoryOptionGroup[] = [
      {
        key: 'color',
        label: 'COLOR / TONO PRINCIPAL',
        choices: [
          { id: `c-${Date.now()}-1`, name: 'NEGRO', colorSwatch: '#18181B', priceDelta: 0 },
          { id: `c-${Date.now()}-2`, name: 'BLANCO', colorSwatch: '#FFFFFF', priceDelta: 0 },
        ],
      },
      {
        key: 'formato',
        label: 'TAMAÑO / FORMATO',
        choices: [
          { id: `f-${Date.now()}-1`, name: 'ESTÁNDAR', priceDelta: 0 },
        ],
      },
    ];
    setNewTemplateGroups(defaultBlankGroups);
    setCreatePreviewOptions({ color: 'NEGRO', formato: 'ESTÁNDAR' });
    setCreatePreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
    setCreateSelectedAttributeKey('color');
    setCreateSelectedChoiceId(defaultBlankGroups[0].choices[0]?.id || '');
    setCreateTransformTargetMode('printArea');
    setCreateActiveTab('info');
    setIsCreateModalOpen(true);
  };

  const handleCreateNameChange = (val: string) => {
    const prevAutoSlug = newTemplateData.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    const newAutoSlug = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    const shouldUpdateId = !newTemplateData.id || newTemplateData.id === prevAutoSlug;

    setNewTemplateData((prev) => ({
      ...prev,
      name: val,
      id: shouldUpdateId ? newAutoSlug : prev.id,
    }));
  };

  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTemplateData.name.trim()) {
      showValidationNotice('Por favor, ingresa el nombre de la nueva plantilla de producto custom (*).');
      return;
    }

    const cleanId = (newTemplateData.id || newTemplateData.name).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_');
    if (!cleanId) {
      showValidationNotice('El identificador de la plantilla no puede estar vacío (*).', 'IDENTIFICADOR REQUERIDO');
      return;
    }

    if (categoriesData.some((c) => c.id.toUpperCase() === cleanId)) {
      showValidationNotice(`Ya existe una categoría o plantilla con el identificador "${cleanId}". Por favor elige otro diferente.`, 'IDENTIFICADOR DUPLICADO');
      return;
    }

    if (newTemplateData.basePrice === undefined || newTemplateData.basePrice < 0 || isNaN(newTemplateData.basePrice)) {
      showValidationNotice('El precio base debe ser mayor o igual a 0 (*).', 'PRECIO BASE INVÁLIDO');
      return;
    }

    if (!newTemplateGroups || newTemplateGroups.length === 0) {
      showValidationNotice('Debes configurar al menos 1 grupo de atributos o variaciones para el producto custom.', 'ATRIBUTOS REQUERIDOS');
      return;
    }

    for (let i = 0; i < newTemplateGroups.length; i++) {
      const g = newTemplateGroups[i];
      if (!g.label.trim()) {
        showValidationNotice(`El atributo #${i + 1} debe tener un nombre asignado.`, 'NOMBRE DE ATRIBUTO REQUERIDO');
        return;
      }
      if (!g.choices || g.choices.length === 0) {
        showValidationNotice(`El atributo "${g.label}" debe tener al menos 1 variación configurada.`, 'VARIACIÓN REQUERIDA');
        return;
      }
    }

    const newCategory: CustomizableProductCategoryInfo = {
      id: cleanId,
      name: newTemplateData.name.trim().toUpperCase(),
      description: newTemplateData.description.trim() || `Producto personalizado ${newTemplateData.name.trim()}`,
      basePrice: Number(newTemplateData.basePrice),
      bgColor: newTemplateData.bgColor || 'bg-yellow-100 hover:bg-yellow-200',
      baseImage: newTemplateData.baseImage.trim() || undefined,
      thumbnailUrl: newTemplateData.thumbnailUrl.trim() || newTemplateData.baseImage.trim() || undefined,
      supportsImageUpload: newTemplateData.supportsImageUpload,
      baseArchetype: newTemplateData.baseArchetype || 'CUSTOM',
      defaultImageTransform: createPreviewTransforms,
      isCustomTemplate: true,
    };

    addCustomCategory(newCategory, newTemplateGroups);

    setIsCreateModalOpen(false);
    setBannerMsg({
      text: `Plantilla "${newCategory.name}" creada exitosamente. Ya está disponible en el Taller Custom y en el Catálogo de Clientes.`,
      type: 'success',
    });
    setTimeout(() => setBannerMsg(null), 5000);
  };

  const handleOpenDelete = (cat: CustomizableProductCategoryInfo) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    deleteCustomCategory(deletingCategory.id);
    setBannerMsg({
      text: `Plantilla "${deletingCategory.name}" eliminada correctamente.`,
      type: 'success',
    });
    setTimeout(() => setBannerMsg(null), 4000);
    setDeletingCategory(null);
  };

  const handleCreateAddGroup = () => {
    const newKey = `attr_${Date.now()}`;
    const newGroup: CategoryOptionGroup = {
      key: newKey,
      label: 'NUEVO ATRIBUTO',
      choices: [{ id: `ch-${Date.now()}`, name: 'OPCIÓN 1', priceDelta: 0 }],
    };
    setNewTemplateGroups([...newTemplateGroups, newGroup]);
    setCreatePreviewOptions((prev) => ({ ...prev, [newKey]: 'OPCIÓN 1' }));
  };

  const handleCreateRemoveGroup = (key: string) => {
    if (newTemplateGroups.length <= 1) {
      setBannerMsg({ text: 'Debe haber al menos 1 grupo de atributos en la plantilla.', type: 'error' });
      return;
    }
    setNewTemplateGroups(newTemplateGroups.filter((g) => g.key !== key));
  };

  const handleCreateAddChoice = (groupKey: string) => {
    const newChoiceId = `ch-${Date.now()}`;
    setNewTemplateGroups(
      newTemplateGroups.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: [
            ...g.choices,
            { id: newChoiceId, name: 'NUEVA VARIACIÓN', priceDelta: 0 },
          ],
        };
      })
    );
  };

  const handleCreateRemoveChoice = (groupKey: string, choiceId: string) => {
    setNewTemplateGroups(
      newTemplateGroups.map((g) => {
        if (g.key !== groupKey) return g;
        if (g.choices.length <= 1) {
          setBannerMsg({ text: 'Cada atributo debe tener al menos 1 variación.', type: 'error' });
          return g;
        }
        return {
          ...g,
          choices: g.choices.filter((c) => c.id !== choiceId),
        };
      })
    );
  };

  useEffect(() => {
    return subscribeToCustomStore(() => {
      setStoreTick((t) => t + 1);
    });
  }, []);

  const categoriesData = getCustomCategoriesData();
  const optionsMap = getCustomOptionsMap();

  // Filter list
  const filteredCategories = categoriesData.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'TODAS' || cat.id === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenEditCategory = (catId: CustomizableCategory) => {
    const meta = categoriesData.find((c) => c.id === catId);
    const groups = optionsMap[catId] || [];

    if (!meta) return;

    setEditingCategory(catId);
    setEditingMeta(JSON.parse(JSON.stringify(meta)));
    setEditingGroups(JSON.parse(JSON.stringify(groups)));

    // Set initial preview options & attribute selector
    const initialOpts: Record<string, string> = {};
    groups.forEach((g) => {
      if (g.choices && g.choices.length > 0) {
        initialOpts[g.key] = g.choices[0].name;
      }
    });
    setPreviewOptions(initialOpts);

    if (groups.length > 0) {
      // Find first spatial attribute group or default to first
      const firstSpatial = groups.find((g) => isSpatialAttribute(g.key, g.label)) || groups[0];
      setSelectedAttributeKey(firstSpatial.key);
      const firstChoice = firstSpatial.choices[0];
      setSelectedChoiceId(firstChoice?.id || '');

      const initTf = firstChoice?.transform || firstSpatial.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
      setPreviewTransforms(initTf);
    } else {
      setSelectedAttributeKey('');
      setSelectedChoiceId('');
      setPreviewTransforms({ zoom: 100, posX: 0, posY: 0, rotate: 0 });
    }

    setActiveTab('preview-transforms');
    setIsEditorOpen(true);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingMeta) return;

    if (!editingMeta.name.trim()) {
      showValidationNotice('El nombre del producto custom es obligatorio y no puede estar vacío (*).');
      return;
    }

    if (editingMeta.basePrice === undefined || editingMeta.basePrice < 0 || isNaN(editingMeta.basePrice)) {
      showValidationNotice('El precio base debe ser un número válido mayor o igual a 0 (*).', 'PRECIO BASE INVÁLIDO');
      return;
    }

    if (!editingGroups || editingGroups.length === 0) {
      showValidationNotice('Como mínimo el producto debe poseer al menos 1 atributo configurado.', 'ATRIBUTOS REQUERIDOS');
      return;
    }

    for (let i = 0; i < editingGroups.length; i++) {
      const grp = editingGroups[i];
      if (!grp.label || !grp.label.trim()) {
        showValidationNotice(`El nombre del atributo #${i + 1} no puede estar vacío.`, 'NOMBRE DE ATRIBUTO REQUERIDO');
        return;
      }
      if (!grp.choices || grp.choices.length === 0) {
        showValidationNotice(`El atributo "${grp.label}" debe contener al menos 1 variación.`, 'VARIACIÓN REQUERIDA');
        return;
      }
      for (let j = 0; j < grp.choices.length; j++) {
        const ch = grp.choices[j];
        if (!ch.name || !ch.name.trim()) {
          showValidationNotice(`La variación #${j + 1} del atributo "${grp.label}" no puede tener un nombre vacío.`, 'VARIACIÓN INVÁLIDA');
          return;
        }
      }
    }

    // Save changes to unified store
    updateCustomCategoryInfo(editingCategory, editingMeta);
    updateCustomCategoryOptions(editingCategory, editingGroups);

    setIsEditorOpen(false);
    setEditingCategory(null);
    setEditingMeta(null);
    setBannerMsg({ 
      text: `¡Cambios unificados guardados para ${editingMeta.name}! Se han actualizado en la vista de cliente y tienda.`, 
      type: 'success' 
    });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  // OPTION GROUPS ACTIONS
  const handleAddOptionGroup = () => {
    const newKey = `opcion_${Date.now()}`;
    const newGrp: CategoryOptionGroup = {
      key: newKey,
      label: 'NUEVO ATRIBUTO',
      choices: [
        { id: `opt-1`, name: 'VARIACIÓN STANDARD', priceDelta: 0 },
      ],
    };
    setEditingGroups([...editingGroups, newGrp]);
  };

  const handleRemoveOptionGroup = (key: string) => {
    if (editingGroups.length <= 1) {
      setBannerMsg({ 
        text: 'No se puede eliminar el último atributo. El producto custom debe tener como mínimo 1 atributo configurado.', 
        type: 'error' 
      });
      return;
    }
    setEditingGroups(editingGroups.filter((g) => g.key !== key));
  };

  const handleAddChoice = (groupKey: string) => {
    setEditingGroups(
      editingGroups.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: [
            ...g.choices,
            { id: `choice-${Date.now()}`, name: 'NUEVA VARIACIÓN', priceDelta: 0 },
          ],
        };
      })
    );
  };

  const handleRemoveChoice = (groupKey: string, choiceId: string) => {
    const targetGrp = editingGroups.find((g) => g.key === groupKey);
    if (targetGrp && targetGrp.choices.length <= 1) {
      setBannerMsg({ 
        text: `No se puede eliminar la última variación del atributo "${targetGrp.label}". Debe haber al menos 1 variación.`, 
        type: 'error' 
      });
      return;
    }

    setEditingGroups(
      editingGroups.map((g) => {
        if (g.key !== groupKey) return g;
        return {
          ...g,
          choices: g.choices.filter((c) => c.id !== choiceId),
        };
      })
    );
  };

  const containerBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900';
  const labelClass = `text-[11px] font-semibold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 shadow-2xs'
  }`;

  return (
    <div className="space-y-6 font-sans">
      
      {/* SUCCESS / ERROR NOTIFICATION BANNER */}
      {bannerMsg && (
        <div className={`p-4 rounded-xl font-bold text-xs uppercase flex items-center gap-2 border animate-in fade-in ${
          bannerMsg.type === 'error' 
            ? (isDarkMode ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
            : (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
        }`}>
          {bannerMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" /> : <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* HEADER & TOP CONTROLS */}
      <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${containerBg}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-base font-extrabold uppercase tracking-wide flex items-center gap-2 ${
              isDarkMode ? 'text-slate-100' : 'text-gray-900'
            }`}>
              <Wrench className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} /> TALLER CUSTOM & PRODUCTOS PERSONALIZADOS UNIFICADOS
            </h2>
            <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Todos los atributos, siluetas, colores, opciones y precios están 100% unificados. Los cambios realizados por el administrador impactan en tiempo real en la tienda del cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer border flex items-center gap-1.5 transition-all shrink-0 ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                : 'bg-gray-900 hover:bg-black text-white border-gray-900 shadow-2xs'
            }`}
          >
            <Plus className="w-4 h-4" /> NUEVA PLANTILLA CUSTOM
          </button>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              id="admin-custom-search-input"
              name="searchQuery"
              aria-label="Buscar por categoría custom o descripción"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por categoría custom o descripción..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold focus:outline-none border ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className="sm:col-span-4">
            <select
              id="admin-custom-category-filter-select"
              name="selectedCategoryFilter"
              aria-label="Filtrar por categoría custom"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold focus:outline-none border uppercase cursor-pointer ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="TODAS">TODAS LAS CATEGORÍAS CUSTOM ({categoriesData.length})</option>
              {categoriesData.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CATEGORIES / CUSTOM PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const groups = optionsMap[cat.id] || [];
          return (
            <div
              key={cat.id}
              className={`rounded-2xl border overflow-hidden shadow-sm transition-all flex flex-col justify-between ${containerBg}`}
            >
              {/* CARD PREVIEW TOP SILHOUETTE */}
              <div className="relative h-56 bg-linear-to-b from-yellow-50/20 via-white/5 to-pink-50/20 p-4 flex items-center justify-center border-b border-gray-200 dark:border-slate-800">
                <div className="w-full max-w-50 h-full flex items-center justify-center">
                  <CustomProductPreview
                    category={cat.id}
                    overrideBaseImage={cat.baseImage || cat.thumbnailUrl}
                    overrideOptionGroups={groups}
                    compact={true}
                    hideHeader={true}
                  />
                </div>

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-amber-500 text-black shadow-xs">
                    {cat.name}
                  </span>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {cat.name}
                    </h3>
                    <span className="font-black text-emerald-500 text-sm">
                      ${cat.basePrice.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <p className={`text-xs mt-1.5 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 space-y-1">
                  <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Grupos de Atributos ({groups.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {groups.map((g) => (
                      <span key={g.key} className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-700'
                      }`}>
                        {g.label} ({g.choices.length})
                      </span>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditCategory(cat.id)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-xs ${
                      isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100' : 'bg-gray-900 hover:bg-black border-gray-900 text-white'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-400" /> Acomodar Vista Previa y Atributos
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(cat)}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                      isDarkMode
                        ? 'border-slate-800 bg-slate-950 text-red-400 hover:bg-red-950/40 hover:border-red-800'
                        : 'border-gray-300 bg-gray-50 text-red-600 hover:bg-red-50 hover:border-red-300'
                    }`}
                    title={`Eliminar plantilla ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL UNIFIED EDITOR MODAL WITH REALTIME SILHOUETTE PREVIEW & TRANSFORMS */}
      {isEditorOpen && editingCategory && editingMeta && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in"
          onClick={() => setIsEditorOpen(false)}
        >
          <div 
            className={`w-full max-w-6xl my-4 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors max-h-[92vh] flex flex-col ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-amber-500" />
                <h2 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                  EDITOR DE CONFIGURACIÓN Y VISTA PREVIA: {editingMeta.name}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTION */}
            <div className={`flex border-b px-6 pt-3 gap-2 shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('preview-transforms')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'preview-transforms'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <Move className="w-4 h-4" /> 1. ACOMODAR VISTA PREVIA Y TRANSFORMS EN VIVO
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'options'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" /> 2. MODIFICAR ATRIBUTOS, COLORES Y OPCIONES
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'info'
                    ? (isDarkMode ? 'border-amber-400 text-amber-400' : 'border-gray-900 text-gray-900')
                    : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-800')
                }`}
              >
                <Sparkles className="w-4 h-4" /> 3. PRECIO BASE & DESCRIPCIÓN
              </button>
            </div>

            {/* FORM / TAB BODY */}
            <form noValidate onSubmit={handleSaveEditor} className={`flex-1 ${
              activeTab === 'preview-transforms' ? 'overflow-hidden flex flex-col justify-between p-4 space-y-2 min-h-0' : 'overflow-y-auto p-6 space-y-6'
            }`}>

              {/* TAB 1: VISUAL SILHOUETTE PREVIEW & TRANSFORMS */}
              {activeTab === 'preview-transforms' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-0">
                  
                  {/* LEFT: EXACT SAME SILHOUETTE PREVIEW COMPONENT AS CLIENT */}
                  <div className="lg:col-span-6 space-y-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between shrink-0">
                      <span className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                        isDarkMode ? 'text-amber-400' : 'text-gray-800'
                      }`}>
                        <Eye className="w-4 h-4" /> SILUETA & VISTA PREVIA DEL CLIENTE
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">Mismo renderizador SVG</span>
                    </div>

                    <div className={`p-2 rounded-2xl border flex items-center justify-center h-82.5 overflow-hidden shrink-0 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-300'
                    }`}>
                      <CustomProductPreview
                        category={editingCategory}
                        options={previewOptions}
                        overrideOptionGroups={editingGroups}
                        overrideBaseImage={editingMeta?.baseImage}
                        customImage={customImageSample}
                        imageTransforms={previewTransforms}
                        onUpdateTransforms={(newT) => setPreviewTransforms(newT)}
                        compact={true}
                        hideHeader={true}
                      />
                    </div>
                  </div>

                  {/* RIGHT: REALTIME POSITIONING & PREVIEW CONTROLS PER ATTRIBUTE AND VARIATION */}
                  <div className="lg:col-span-6 space-y-2 flex flex-col justify-between">
                    {(() => {
                      const spatialGroups = editingGroups.filter((g) => isSpatialAttribute(g.key, g.label));
                      const targetGroup = spatialGroups.find((g) => g.key === selectedAttributeKey) || spatialGroups[0];
                      const isSpatial = targetGroup ? isSpatialAttribute(targetGroup.key, targetGroup.label) : false;

                      const targetChoice = targetGroup?.choices.find((c) => c.id === selectedChoiceId) ||
                        targetGroup?.choices.find((c) => c.name.toLowerCase() === (previewOptions[targetGroup?.key || ''] || '').toLowerCase()) ||
                        targetGroup?.choices[0];

                      const currentTf = transformTargetMode === 'choice' && targetChoice
                        ? (targetChoice.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 })
                        : (targetGroup?.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 });

                      const handleUpdateTargetTransform = (updates: Partial<{ posX: number; posY: number; zoom: number; rotate: number }>) => {
                        if (!targetGroup) return;
                        const newTf = {
                          posX: currentTf.posX ?? 0,
                          posY: currentTf.posY ?? 0,
                          zoom: currentTf.zoom ?? 100,
                          rotate: currentTf.rotate ?? 0,
                          ...updates,
                        };

                        if (transformTargetMode === 'choice' && targetChoice) {
                          setEditingGroups(
                            editingGroups.map((g) => {
                              if (g.key !== targetGroup.key) return g;
                              return {
                                ...g,
                                choices: g.choices.map((c) => (c.id === targetChoice.id ? { ...c, transform: newTf } : c)),
                              };
                            })
                          );
                          setPreviewOptions((prev) => ({ ...prev, [targetGroup.key]: targetChoice.name }));
                        } else if (transformTargetMode === 'all') {
                          setEditingGroups(
                            editingGroups.map((g) => ({
                              ...g,
                              transform: newTf,
                            }))
                          );
                        } else {
                          setEditingGroups(
                            editingGroups.map((g) => {
                              if (g.key !== targetGroup.key) return g;
                              return {
                                ...g,
                                transform: newTf,
                              };
                            })
                          );
                        }
                        setPreviewTransforms(newTf);
                      };

                      const colorGroups = editingGroups.filter(
                        (g) => g.key === 'color' || g.label.toLowerCase().includes('color') || !isSpatialAttribute(g.key, g.label)
                      );

                      return (
                        <div className={`p-3 rounded-2xl border space-y-2.5 ${
                          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <h4 className="text-[11px] font-extrabold uppercase text-amber-500 border-b border-gray-200 dark:border-slate-800 pb-1 shrink-0">
                            ACOMODAR MANUALMENTE UBICACIÓN Y ESCALA POR VARIACIÓN
                          </h4>

                          {/* ATTRIBUTE SELECTOR & ACTIVE VARIATION PICKER */}
                          <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1.5 shrink-0">
                            <div className="flex items-center justify-between">
                              <label htmlFor="admin-custom-attribute-spatial-select" className="text-[10px] font-extrabold uppercase text-amber-400">
                                ATRIBUTO A ACOMODAR:
                              </label>
                              <span className="text-[9px] text-slate-400 font-mono font-semibold">
                                Clave: {targetGroup?.key || 'Ninguno'}
                              </span>
                            </div>

                            {/* ONLY SPATIAL / POSITION-MODIFIABLE ATTRIBUTES SHOWN */}
                            <select
                              id="admin-custom-attribute-spatial-select"
                              name="selectedAttributeKey"
                              aria-label="Seleccionar capa o elemento para calibrar"
                              value={selectedAttributeKey || targetGroup?.key || ''}
                              onChange={(e) => {
                                const key = e.target.value;
                                setSelectedAttributeKey(key);
                                const found = spatialGroups.find((g) => g.key === key);
                                if (found) {
                                  const firstChoice = found.choices[0];
                                  setSelectedChoiceId(firstChoice?.id || '');
                                  const initTf = firstChoice?.transform || found.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 };
                                  setPreviewTransforms(initTf);

                                  const currentOpt = previewOptions[key];
                                  if (!currentOpt || currentOpt.toLowerCase().includes('sin')) {
                                    const visibleChoice = found.choices.find((c) => !c.name.toLowerCase().includes('sin')) || found.choices[0];
                                    if (visibleChoice) {
                                      setPreviewOptions({ ...previewOptions, [key]: visibleChoice.name });
                                    }
                                  }
                                }
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold uppercase border cursor-pointer ${
                                isDarkMode ? 'bg-slate-950 border-amber-500/40 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                              }`}
                            >
                              {spatialGroups.map((grp) => (
                                <option key={grp.key} value={grp.key}>
                                  {grp.label} ({grp.choices.length} variaciones)
                                </option>
                              ))}
                            </select>

                            {/* SPATIAL CONTROLS & TARGET SELECTION */}
                            {isSpatial && targetGroup && (
                              <div className="space-y-1.5 pt-0.5">
                                {/* CHOICE SELECTOR */}
                                <div className="flex items-center justify-between gap-2">
                                  <label htmlFor="admin-custom-choice-spatial-select" className="text-[9px] uppercase font-bold text-slate-300 shrink-0">
                                    Variación a Acomodar:
                                  </label>
                                  <select
                                    id="admin-custom-choice-spatial-select"
                                    name="selectedChoiceId"
                                    aria-label="Variación a acomodar"
                                    value={selectedChoiceId || targetChoice?.id || ''}
                                    onChange={(e) => {
                                      const choiceId = e.target.value;
                                      setSelectedChoiceId(choiceId);
                                      const ch = targetGroup.choices.find((c) => c.id === choiceId);
                                      if (ch) {
                                        setPreviewOptions({ ...previewOptions, [targetGroup.key]: ch.name });
                                        if (ch.transform) {
                                          setPreviewTransforms(ch.transform);
                                        } else if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-2 text-xs font-extrabold rounded-lg border uppercase flex-1 ${
                                      isDarkMode ? 'bg-slate-950 border-amber-500/50 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                                    }`}
                                  >
                                    {targetGroup.choices.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} {c.transform ? '*(Posición Personalizada)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* TARGET SCOPE SWITCH (CHOICE VS GROUP VS ALL) */}
                                <div className="grid grid-cols-3 gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('choice');
                                      if (targetChoice) {
                                        setPreviewOptions((prev) => ({ ...prev, [targetGroup.key]: targetChoice.name }));
                                        if (targetChoice.transform) {
                                          setPreviewTransforms(targetChoice.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'choice'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title={`Editando solo la variación "${targetChoice?.name}"`}
                                  >
                                    Solo Variación
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('group');
                                      if (targetGroup) {
                                        if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'group'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title={`Editando solo el atributo "${targetGroup.label}"`}
                                  >
                                    Solo Atributo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransformTargetMode('all');
                                      if (targetGroup) {
                                        if (targetGroup.transform) {
                                          setPreviewTransforms(targetGroup.transform);
                                        } else {
                                          setPreviewTransforms({ posX: 0, posY: 0, zoom: 100, rotate: 0 });
                                        }
                                      }
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[9px] font-extrabold uppercase border transition-all text-center cursor-pointer ${
                                      transformTargetMode === 'all'
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                                        : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                                    }`}
                                    title="Acomodar objeto completo (Mueve todos los atributos al mismo tiempo)"
                                  >
                                    Objeto Completo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SLIDERS (ONLY SHOWN IF SPATIAL) */}
                          {isSpatial && targetGroup && (
                            <div className="space-y-2">
                              {/* POS X */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Posición X (Horizontal): {currentTf.posX ?? 0}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ posX: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    Reset
                                  </button>
                                </div>
                                <input
                                  id="admin-custom-posx-range"
                                  name="posX"
                                  aria-label="Posición X horizontal"
                                  type="range"
                                  min="-150"
                                  max="150"
                                  value={currentTf.posX ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ posX: Number(e.target.value) })}
                                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* POS Y */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Posición Y (Vertical): {currentTf.posY ?? 0}px
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ posY: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    Reset
                                  </button>
                                </div>
                                <input
                                  id="admin-custom-posy-range"
                                  name="posY"
                                  aria-label="Posición Y vertical"
                                  type="range"
                                  min="-150"
                                  max="150"
                                  value={currentTf.posY ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ posY: Number(e.target.value) })}
                                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* ZOOM */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Escala / Zoom: {currentTf.zoom ?? 100}%
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ zoom: 100 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    100%
                                  </button>
                                </div>
                                <input
                                  id="admin-custom-zoom-range"
                                  name="zoom"
                                  aria-label="Escala zoom"
                                  type="range"
                                  min="30"
                                  max="250"
                                  value={currentTf.zoom ?? 100}
                                  onChange={(e) => handleUpdateTargetTransform({ zoom: Number(e.target.value) })}
                                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>

                              {/* ROTATION */}
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                    Rotación: {currentTf.rotate ?? 0}°
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTargetTransform({ rotate: 0 })}
                                    className="text-[9px] text-amber-500 hover:underline"
                                  >
                                    0°
                                  </button>
                                </div>
                                <input
                                  id="admin-custom-rotate-range"
                                  name="rotate"
                                  aria-label="Rotación en grados"
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={currentTf.rotate ?? 0}
                                  onChange={(e) => handleUpdateTargetTransform({ rotate: Number(e.target.value) })}
                                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                              </div>
                            </div>
                          )}

                          {/* COMPACT LIVE COLOR SELECTOR */}
                          {colorGroups.length > 0 && (
                            <div className="p-2 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-1.5">
                              <span className="text-[9px] font-extrabold uppercase text-amber-400 block tracking-wide">
                                COLOR / TELA DEL PRODUCTO (CAMBIO EN VIVO)
                              </span>
                              {colorGroups.map((colorGrp) => (
                                <div key={colorGrp.key} className="flex items-center justify-between gap-2 text-xs">
                                  <label htmlFor={`admin-custom-color-${colorGrp.key}`} className="text-slate-300 font-bold text-[10px] uppercase truncate">{colorGrp.label}:</label>
                                  <select
                                    id={`admin-custom-color-${colorGrp.key}`}
                                    name={`customColor_${colorGrp.key}`}
                                    aria-label={`Color para ${colorGrp.label}`}
                                    value={previewOptions[colorGrp.key] || colorGrp.choices[0]?.name || ''}
                                    onChange={(e) => setPreviewOptions({ ...previewOptions, [colorGrp.key]: e.target.value })}
                                    className={`py-1 px-2 text-[10px] font-extrabold rounded-lg border uppercase cursor-pointer ${
                                      isDarkMode ? 'bg-slate-950 border-amber-500/40 text-amber-300' : 'bg-white border-amber-500 text-gray-900'
                                    }`}
                                  >
                                    {colorGrp.choices.map((c) => (
                                      <option key={c.id} value={c.name}>
                                        {c.name} {c.priceDelta ? `(+${c.priceDelta})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* SAMPLE CUSTOM IMAGE URL (ONLY FOR CUSTOM IMAGE UPLOAD CATEGORIES LIKE REMERAS, PINES, STICKERS, POSTERS) */}
                          {['PINES', 'STICKERS', 'REMERAS', 'POSTERS', 'PINTURAS'].includes(editingCategory) && (
                            <div>
                              <label htmlFor="admin-custom-sample-image-input" className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                                Cargar Imagen de Muestra para Probar Estampa
                              </label>
                              <input
                                id="admin-custom-sample-image-input"
                                name="customImageSample"
                                aria-label="Cargar imagen de muestra para probar estampa"
                                type="url"
                                value={customImageSample || ''}
                                onChange={(e) => setCustomImageSample(e.target.value || null)}
                                placeholder="https://images.unsplash.com/..."
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: OPTIONS, SWATCHES & PRICE DELTAS EDITOR */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold uppercase ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        GRUPOS DE ATRIBUTOS Y OPCIONES MODIFICABLES
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Organiza opciones, recargos de precio ($) y jerarquía de capas SVG. Haz clic en un atributo para colapsarlo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleExpandAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Expandir Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleCollapseAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Colapsar Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleAddOptionGroup}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> AGREGAR GRUPO DE OPCIONES
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {editingGroups.map((grp, grpIdx) => {
                      const isCollapsed = !!collapsedGroups[grp.key];

                      return (
                        <div
                          key={grp.key}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* GROUP HEADER & ACCORDION BAR */}
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleGroupCollapse(grp.key)}
                                className="p-1 text-amber-500 hover:bg-amber-500/10 rounded transition-colors cursor-pointer"
                                title={isCollapsed ? 'Expandir grupo' : 'Colapsar grupo'}
                              >
                                {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-3" /> : <ChevronDown className="w-4 h-4 stroke-3" />}
                              </button>

                              <input
                                id={`admin-custom-grp-label-${grp.key}`}
                                name={`groupLabel_${grp.key}`}
                                aria-label={`Nombre visible del grupo ${grp.label || grp.key}`}
                                type="text"
                                value={grp.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setEditingGroups(
                                    editingGroups.map((g) => (g.key === grp.key ? { ...g, label: newLabel } : g))
                                  );
                                }}
                                placeholder="Nombre visible (Ej: Tipo de Cadena / Color de Prenda)"
                                className={`font-black text-xs uppercase max-w-xs ${inputClass}`}
                              />

                              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                Clave: {grp.key}
                              </span>

                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                {grp.choices.length} variaciones
                              </span>

                              {/* LAYER ORDER BADGE & REORDER BUTTONS (ONLY FOR SPATIAL SVG ATTRIBUTES) */}
                              {isSpatialAttribute(grp.key, grp.label) && (
                                <div className="flex items-center gap-1 ml-auto shrink-0 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                                  <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-purple-400" /> Capa {grpIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={grpIdx === 0}
                                    onClick={() => handleMoveGroupLayer(grpIdx, 'up')}
                                    className="p-0.5 text-slate-400 hover:text-amber-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="Subir orden de capa (Mover hacia atrás en SVG)"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={grpIdx === editingGroups.length - 1}
                                    onClick={() => handleMoveGroupLayer(grpIdx, 'down')}
                                    className="p-0.5 text-slate-400 hover:text-amber-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                    title="Bajar orden de capa (Mover al frente en SVG)"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAddChoice(grp.key)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Variación
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionGroup(grp.key)}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                                title="Eliminar grupo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* COLLAPSED SUMMARY */}
                          {isCollapsed && (
                            <div
                              onClick={() => handleToggleGroupCollapse(grp.key)}
                              className="pt-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-between"
                            >
                              <span className="truncate max-w-xl font-medium">
                                Variaciones ({grp.choices.length}): {grp.choices.map((c) => c.name).join(', ')}
                              </span>
                              <span className="text-[9px] text-amber-500 font-bold uppercase shrink-0">Haz clic para desplegar y editar</span>
                            </div>
                          )}

                          {/* EXPANDED CHOICES LIST */}
                          {!isCollapsed && (
                            <div className="space-y-3 pt-2">
                            {grp.choices.map((choice) => (
                              <div 
                                key={choice.id} 
                                className={`p-3 rounded-xl border space-y-3 transition-colors ${
                                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                  {/* VARIATION NAME */}
                                  <div className="sm:col-span-3">
                                    <label htmlFor={`admin-choice-name-${choice.id}`} className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Variación *</label>
                                    <input
                                      id={`admin-choice-name-${choice.id}`}
                                      name={`choiceName_${choice.id}`}
                                      aria-label={`Nombre de la variación ${choice.name}`}
                                      type="text"
                                      value={choice.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingGroups(
                                          editingGroups.map((g) => {
                                            if (g.key !== grp.key) return g;
                                            return {
                                              ...g,
                                              choices: g.choices.map((c) => (c.id === choice.id ? { ...c, name: val } : c)),
                                            };
                                          })
                                        );
                                      }}
                                      placeholder="Ej: Orejas Conejo"
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* PRICE RECARGO */}
                                  <div className="sm:col-span-2">
                                    <label htmlFor={`admin-choice-price-${choice.id}`} className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Recargo ($ ARS)</label>
                                    <input
                                      id={`admin-choice-price-${choice.id}`}
                                      name={`choicePriceDelta_${choice.id}`}
                                      aria-label={`Recargo en pesos para ${choice.name}`}
                                      type="number"
                                      value={choice.priceDelta || ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                        setEditingGroups(
                                          editingGroups.map((g) => {
                                            if (g.key !== grp.key) return g;
                                            return {
                                              ...g,
                                              choices: g.choices.map((c) => (c.id === choice.id ? { ...c, priceDelta: val } : c)),
                                            };
                                          })
                                        );
                                      }}
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </div>

                                  {/* COLOR SWATCH */}
                                  <div className="sm:col-span-2">
                                    <label htmlFor={`admin-choice-color-${choice.id}`} className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Color / Swatch</label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        id={`admin-choice-color-${choice.id}`}
                                        name={`choiceColorSwatch_${choice.id}`}
                                        aria-label={`Color para variación ${choice.name}`}
                                        type="color"
                                        value={choice.colorSwatch || '#18181B'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingGroups(
                                            editingGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        className="w-7 h-7 p-0 bg-transparent cursor-pointer rounded shrink-0 border border-slate-700 shadow-sm"
                                        title="Seleccionar color"
                                      />
                                      <input
                                        id={`admin-choice-color-text-${choice.id}`}
                                        name={`choiceColorSwatchText_${choice.id}`}
                                        aria-label={`Código de color hexadecimal para ${choice.name}`}
                                        type="text"
                                        value={choice.colorSwatch || '#18181B'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingGroups(
                                            editingGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="#18181B"
                                        className={`w-20 text-[10px] font-mono uppercase ${inputClass}`}
                                      />
                                    </div>
                                  </div>

                                  {/* VARIATION IMAGE / PLANTILLA */}
                                  <div className="sm:col-span-4">
                                    <label htmlFor={`admin-choice-image-url-${choice.id}`} className="text-[9px] font-extrabold uppercase text-slate-400 mb-0.5 flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-amber-500" /> Plantilla / Imagen de Variación
                                    </label>
                                    {choice.imageUrl ? (
                                      <div className="flex items-center gap-1.5">
                                        <img 
                                          src={choice.imageUrl} 
                                          alt={choice.name} 
                                          className="w-7 h-7 object-contain bg-white border border-gray-300 rounded shrink-0" 
                                        />
                                        <input
                                          id={`admin-choice-image-url-${choice.id}`}
                                          name={`choiceImageUrl_${choice.id}`}
                                          aria-label={`URL de imagen para ${choice.name}`}
                                          type="text"
                                          value={choice.imageUrl}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: val } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          placeholder="URL de imagen..."
                                          className={`flex-1 text-[11px] ${inputClass}`}
                                        />
                                        <label htmlFor={`admin-choice-file-${choice.id}`} className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded cursor-pointer shrink-0 transition-colors" title="Subir nueva imagen desde equipo">
                                          <Upload className="w-3.5 h-3.5" />
                                          <input
                                            id={`admin-choice-file-${choice.id}`}
                                            name={`choiceFile_${choice.id}`}
                                            aria-label={`Subir nueva imagen para ${choice.name}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                  const res = event.target?.result as string;
                                                  if (res) {
                                                    setEditingGroups(
                                                      editingGroups.map((g) => {
                                                        if (g.key !== grp.key) return g;
                                                        return {
                                                          ...g,
                                                          choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                        };
                                                      })
                                                    );
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: undefined } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded shrink-0 transition-colors"
                                          title="Quitar imagen"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <label htmlFor={`admin-choice-file-upload-${choice.id}`} className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border border-dashed border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer">
                                          <Upload className="w-3.5 h-3.5 text-slate-400" /> Subir Imagen / Plantilla
                                          <input
                                            id={`admin-choice-file-upload-${choice.id}`}
                                            name={`choiceFileUpload_${choice.id}`}
                                            aria-label={`Subir imagen o plantilla para ${choice.name}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                  const res = event.target?.result as string;
                                                  if (res) {
                                                    setEditingGroups(
                                                      editingGroups.map((g) => {
                                                        if (g.key !== grp.key) return g;
                                                        return {
                                                          ...g,
                                                          choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                        };
                                                      })
                                                    );
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingGroups(
                                              editingGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: 'https://' } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className="text-[9px] font-bold text-slate-400 hover:text-slate-200 underline uppercase cursor-pointer"
                                        >
                                          Ingresar URL
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* DELETE BUTTON */}
                                  <div className="sm:col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChoice(grp.key, choice.id)}
                                      className="p-2 text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                      title="Eliminar variación"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: BASE PRICE & DESCRIPTION */}
              {activeTab === 'info' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label htmlFor="admin-custom-meta-name-input" className="text-xs font-bold uppercase block mb-1">Nombre del Producto Custom *</label>
                    <input
                      id="admin-custom-meta-name-input"
                      name="customProductName"
                      aria-label="Nombre del producto custom"
                      type="text"
                      value={editingMeta.name}
                      onChange={(e) => setEditingMeta({ ...editingMeta, name: e.target.value })}
                      placeholder="Ej: COLLARES PERSONALIZADOS"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admin-custom-meta-price-input" className="text-xs font-bold uppercase block mb-1">Precio Base ($ ARS) *</label>
                      <input
                        id="admin-custom-meta-price-input"
                        name="customProductBasePrice"
                        aria-label="Precio base en pesos"
                        type="number"
                        value={editingMeta.basePrice}
                        onChange={(e) => setEditingMeta({ ...editingMeta, basePrice: parseFloat(e.target.value) || 0 })}
                        placeholder="4200"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-custom-meta-category-input" className="text-xs font-bold uppercase block mb-1">Categoría Asociada</label>
                      <input
                        id="admin-custom-meta-category-input"
                        name="customProductCategory"
                        aria-label="Categoría asociada"
                        type="text"
                        disabled
                        value={editingMeta.id}
                        className={`${inputClass} opacity-60 uppercase`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-custom-meta-description-textarea" className="text-xs font-bold uppercase block mb-1">Descripción para Clientes</label>
                    <textarea
                      id="admin-custom-meta-description-textarea"
                      name="customProductDescription"
                      aria-label="Descripción para clientes"
                      rows={3}
                      value={editingMeta.description}
                      onChange={(e) => setEditingMeta({ ...editingMeta, description: e.target.value })}
                      placeholder="Descripción detallada de la personalización..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {/* MODIFIABLE BASE SILHOUETTE IN EDIT MODAL */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="admin-custom-meta-base-image" className="text-xs font-bold uppercase block text-amber-500 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" /> Imagen Mockup / Silueta Base
                      </label>
                      {editingMeta.baseImage && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Silueta Asignada
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="admin-custom-meta-base-image"
                        name="customProductBaseImage"
                        aria-label="URL de imagen base o mockup"
                        type="url"
                        value={editingMeta.baseImage || ''}
                        onChange={(e) => setEditingMeta({ ...editingMeta, baseImage: e.target.value })}
                        placeholder="https://... o sube un archivo desde tu equipo"
                        className={inputClass}
                      />
                      <label className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 border shadow-2xs ${
                        isDarkMode
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400'
                          : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                      }`}>
                        <Upload className="w-3.5 h-3.5" /> Subir
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const res = ev.target?.result as string;
                                if (res) setEditingMeta({ ...editingMeta, baseImage: res });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {editingMeta.baseImage && (
                      <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                        isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-gray-200'
                      }`}>
                        <div className="w-14 h-14 rounded border border-gray-300 dark:border-slate-700 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:6px_6px] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <img
                            src={editingMeta.baseImage}
                            alt="Silueta del producto"
                            className="w-full h-full object-contain filter drop-shadow-sm select-none"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase text-emerald-500">Silueta actual</div>
                          <p className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {editingMeta.baseImage.startsWith('data:') ? 'Imagen local cargada (Base64)' : editingMeta.baseImage}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingMeta({ ...editingMeta, baseImage: '' })}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase text-red-500 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="admin-custom-meta-supports-upload"
                      name="supportsImageUpload"
                      type="checkbox"
                      checked={editingMeta.supportsImageUpload ?? true}
                      onChange={(e) => setEditingMeta({ ...editingMeta, supportsImageUpload: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <label htmlFor="admin-custom-meta-supports-upload" className="text-xs font-bold uppercase cursor-pointer">
                      Permitir al cliente subir su propio diseño / foto para personalizar
                    </label>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t -mx-6 -mb-6 mt-6 shrink-0 ${
                isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-900' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                  }`}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-2 ${
                    isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  <Save className="w-4 h-4" /> GUARDAR Y UNIFICAR CON CLIENTE
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CUSTOM PRODUCT TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            className={`w-full max-w-5xl my-4 rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors max-h-[92vh] flex flex-col ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
                }`}>
                  <Sparkles className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                </div>
                <div>
                  <h2 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    CREAR NUEVA PLANTILLA DE PRODUCTO CUSTOM
                  </h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Ficha técnica, silueta base y atributos • Buttoncat Studio Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEPPER STEP TRACKER BAR */}
            <div className={`flex border-b px-6 pt-2.5 gap-2 shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              {[
                { id: 'info', num: 1, title: 'INFORMACIÓN & SILUETA', icon: Sparkles },
                { id: 'options', num: 2, title: `ATRIBUTOS & CAPAS (${newTemplateGroups.length})`, icon: SlidersHorizontal },
                { id: 'preview', num: 3, title: 'VISTA PREVIA & CALIBRACIÓN', icon: Eye },
              ].map((stepObj) => {
                const isActive = createActiveTab === stepObj.id;
                const IconComponent = stepObj.icon;
                return (
                  <button
                    key={stepObj.id}
                    type="button"
                    onClick={() => setCreateActiveTab(stepObj.id as any)}
                    className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      isActive
                        ? (isDarkMode ? 'border-slate-100 text-slate-100' : 'border-gray-900 text-gray-900')
                        : (isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-gray-500 hover:text-gray-900')
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive 
                        ? (isDarkMode ? 'bg-slate-100 text-slate-900' : 'bg-gray-900 text-white') 
                        : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600')
                    }`}>
                      {stepObj.num}
                    </span>
                    <IconComponent className="w-4 h-4" />
                    <span>{stepObj.title}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT / FORM */}
            <form noValidate onSubmit={handleSaveNewTemplate} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: INFO & SILHOUETTE */}
              {createActiveTab === 'info' && (
                <div className="space-y-6 max-w-4xl">

                  {/* MAIN TECHNICAL CARD */}
                  <div className={`p-5 rounded-xl border space-y-4 ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 text-amber-500">
                        <Sparkles className="w-4 h-4" /> FICHA TÉCNICA PRINCIPAL
                      </span>
                      <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Datos requeridos para catalogar el producto
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="create-custom-template-name" className={labelClass}>
                          Nombre de la Plantilla *
                        </label>
                        <input
                          id="create-custom-template-name"
                          name="templateName"
                          aria-label="Nombre de la nueva plantilla"
                          type="text"
                          value={newTemplateData.name}
                          onChange={(e) => handleCreateNameChange(e.target.value)}
                          placeholder="Ej: TAZAS DE CERÁMICA PREMIUM"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="create-custom-template-id" className={labelClass}>
                          Identificador Único (ID / Código) *
                        </label>
                        <input
                          id="create-custom-template-id"
                          name="templateId"
                          aria-label="Identificador único de la categoría"
                          type="text"
                          value={newTemplateData.id}
                          onChange={(e) => setNewTemplateData({ ...newTemplateData, id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                          placeholder="Ej: TAZAS_CERAMICA"
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="create-custom-template-price" className={labelClass}>
                          Precio Base ($ ARS) *
                        </label>
                        <input
                          id="create-custom-template-price"
                          name="templatePrice"
                          aria-label="Precio base en pesos argentinos"
                          type="number"
                          min="0"
                          value={newTemplateData.basePrice}
                          onChange={(e) => setNewTemplateData({ ...newTemplateData, basePrice: parseFloat(e.target.value) || 0 })}
                          placeholder="5200"
                          className={inputClass}
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                          isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-gray-300 bg-white shadow-2xs'
                        }`}>
                          <input
                            id="create-custom-supports-upload"
                            name="supportsUpload"
                            type="checkbox"
                            checked={newTemplateData.supportsImageUpload}
                            onChange={(e) => setNewTemplateData({ ...newTemplateData, supportsImageUpload: e.target.checked })}
                            className="w-4 h-4 accent-slate-900 dark:accent-slate-100 rounded cursor-pointer"
                          />
                          <label htmlFor="create-custom-supports-upload" className={`text-xs font-semibold uppercase cursor-pointer select-none ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            Permitir al cliente subir foto / diseño propio
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="create-custom-template-desc" className={labelClass}>
                        Descripción para los Clientes
                      </label>
                      <textarea
                        id="create-custom-template-desc"
                        name="templateDesc"
                        aria-label="Descripción de la plantilla"
                        rows={3}
                        value={newTemplateData.description}
                        onChange={(e) => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                        placeholder="Indica materiales, proceso de estampado o características especiales de este producto personalizable..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  {/* MODIFIABLE BASE SILHOUETTE CARD */}
                  <div className={`p-5 rounded-xl border space-y-4 ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
                      <div>
                        <label className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-amber-500">
                          <ImageIcon className="w-4 h-4" /> SILUETA BASE / MOCKUP DEL PRODUCTO (IMAGEN MODIFICABLE) *
                        </label>
                        <p className={`text-[10px] font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Sube o pega la imagen de la silueta base (PNG o SVG con fondo transparente recomendado). Sobre este lienzo se ubicarán estampas, capas y colores en el taller.
                        </p>
                      </div>

                      {newTemplateData.baseImage && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Silueta Asignada
                        </span>
                      )}
                    </div>

                    {/* IMAGE INPUTS */}
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="create-custom-template-image" className={labelClass}>
                          URL de la Imagen de Silueta / Archivo
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="create-custom-template-image"
                            name="templateImage"
                            aria-label="URL de imagen base"
                            type="url"
                            value={newTemplateData.baseImage}
                            onChange={(e) => setNewTemplateData({ ...newTemplateData, baseImage: e.target.value, thumbnailUrl: e.target.value })}
                            placeholder="https://... o sube una imagen desde tu equipo"
                            className={inputClass}
                          />
                          <label className={`px-4 py-2 rounded-lg text-xs font-bold uppercase cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 border shadow-2xs ${
                            isDarkMode
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400'
                              : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                          }`}>
                            <Upload className="w-3.5 h-3.5" /> Subir Mockup
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const res = ev.target?.result as string;
                                    if (res) {
                                      setNewTemplateData({ ...newTemplateData, baseImage: res, thumbnailUrl: res });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* LIVE THUMBNAIL PREVIEW / PLACEHOLDER */}
                      {newTemplateData.baseImage ? (
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
                          isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-gray-200'
                        }`}>
                          <div className="relative w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:8px_8px] flex items-center justify-center p-1 overflow-hidden shrink-0">
                            <img
                              src={newTemplateData.baseImage}
                              alt="Silueta base del producto"
                              className="w-full h-full object-contain filter drop-shadow-sm select-none"
                            />
                          </div>

                          <div className="flex-1 space-y-1.5 text-center sm:text-left">
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                              <span className="text-xs font-black uppercase text-emerald-500">
                                Silueta Activa para Calibración
                              </span>
                            </div>
                            <p className={`text-[11px] font-mono break-all line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {newTemplateData.baseImage.startsWith('data:') ? 'Imagen local cargada (Base64)' : newTemplateData.baseImage}
                            </p>
                            <div className="flex items-center gap-3 pt-1 justify-center sm:justify-start">
                              <label className={`text-[10px] font-bold uppercase underline cursor-pointer ${
                                isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-gray-900 hover:text-black'
                              }`}>
                                Reemplazar archivo
                                <input
                                  type="file"
                                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const res = ev.target?.result as string;
                                        if (res) {
                                          setNewTemplateData({ ...newTemplateData, baseImage: res, thumbnailUrl: res });
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-slate-500">•</span>
                              <button
                                type="button"
                                onClick={() => setNewTemplateData({ ...newTemplateData, baseImage: '', thumbnailUrl: '' })}
                                className="text-[10px] font-bold uppercase text-red-500 hover:underline cursor-pointer"
                              >
                                Quitar silueta
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center space-y-2 ${
                          isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-gray-300 bg-white'
                        }`}>
                          <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-500">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-xs font-bold uppercase">
                            Ninguna silueta asignada
                          </div>
                          <p className={`text-[11px] max-w-md ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Sube una imagen o ingresa una URL con la silueta de tu producto. Podrás posicionar y calibrar el área de diseño del cliente en el Paso 3.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ATTRIBUTE GROUPS & CHOICES */}
              {createActiveTab === 'options' && (
                <div className="space-y-5 max-w-4xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                        ATRIBUTOS CONFIGURABLES PARA EL CLIENTE
                      </h3>
                      <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        Organiza opciones, recargos de precio ($), colores y plantillas de capas. Usa las flechas para ordenar la jerarquía de capas.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCreateExpandAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Expandir Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCollapseAllGroups}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Colapsar Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateAddGroup}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                            : 'bg-gray-900 hover:bg-black text-white border-gray-900 shadow-2xs'
                        }`}
                      >
                        <Plus className="w-4 h-4" /> Agregar Atributo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {newTemplateGroups.map((grp, grpIdx) => {
                      const isCollapsed = !!createCollapsedGroups[grp.key];

                      return (
                        <div
                          key={grp.key}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                          }`}
                        >
                          <div className={`flex items-center justify-between gap-3 pb-2 border-b ${
                            isDarkMode ? 'border-slate-800' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                type="button"
                                onClick={() => handleCreateToggleGroupCollapse(grp.key)}
                                className="p-1 text-amber-500 hover:bg-amber-500/10 rounded transition-colors cursor-pointer"
                                title={isCollapsed ? 'Expandir atributo' : 'Colapsar atributo'}
                              >
                                {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-3" /> : <ChevronDown className="w-4 h-4 stroke-3" />}
                              </button>

                              <input
                                type="text"
                                value={grp.label}
                                onChange={(e) => {
                                  const newLabel = e.target.value;
                                  setNewTemplateGroups(
                                    newTemplateGroups.map((g) => (g.key === grp.key ? { ...g, label: newLabel } : g))
                                  );
                                }}
                                placeholder="Nombre del atributo (Ej: Color de Prenda, Dije Principal, Talle)"
                                className={`font-bold text-xs uppercase max-w-xs ${inputClass}`}
                              />
                              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                Clave: {grp.key}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                                {grp.choices.length} variaciones
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* LAYER REORDER BUTTONS */}
                              <div className={`flex items-center border rounded-lg overflow-hidden ${
                                isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-white shadow-2xs'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => handleCreateMoveGroup(grpIdx, 'up')}
                                  disabled={grpIdx === 0}
                                  className={`p-1.5 transition-colors cursor-pointer ${
                                    grpIdx === 0 ? 'opacity-30 cursor-not-allowed' : (isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-gray-100 text-gray-800')
                                  }`}
                                  title="Subir capa (Z-Index mayor)"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCreateMoveGroup(grpIdx, 'down')}
                                  disabled={grpIdx === newTemplateGroups.length - 1}
                                  className={`p-1.5 transition-colors cursor-pointer border-l ${
                                    isDarkMode ? 'border-slate-700' : 'border-gray-200'
                                  } ${
                                    grpIdx === newTemplateGroups.length - 1 ? 'opacity-30 cursor-not-allowed' : (isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-gray-100 text-gray-800')
                                  }`}
                                  title="Bajar capa (Z-Index menor)"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCreateAddChoice(grp.key)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                                  isDarkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                    : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-2xs'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar Variación
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateRemoveGroup(grp.key)}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                                title="Eliminar atributo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* COLLAPSED SUMMARY */}
                          {isCollapsed && (
                            <div
                              onClick={() => handleCreateToggleGroupCollapse(grp.key)}
                              className="pt-1 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 transition-colors flex items-center justify-between"
                            >
                              <span className="truncate max-w-xl font-medium">
                                Variaciones ({grp.choices.length}): {grp.choices.map((c) => c.name).join(', ')}
                              </span>
                              <span className="text-[9px] text-amber-500 font-bold uppercase shrink-0">Clic para desplegar y editar</span>
                            </div>
                          )}

                          {/* CHOICES LIST */}
                          {!isCollapsed && (
                            <div className="space-y-2.5 pt-1">
                              {grp.choices.map((choice) => (
                                <div 
                                  key={choice.id}
                                  className={`p-3 rounded-xl border flex flex-col gap-3 ${
                                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200 shadow-2xs'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                    {/* VARIATION NAME */}
                                    <div className="sm:col-span-3">
                                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Nombre Variación *</label>
                                      <input
                                        type="text"
                                        value={choice.name}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNewTemplateGroups(
                                            newTemplateGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, name: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="Ej: Negro Azabache / Dije Gatito"
                                        className={inputClass}
                                      />
                                    </div>

                                    {/* PRICE DELTA */}
                                    <div className="sm:col-span-2">
                                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Recargo ($ ARS)</label>
                                      <input
                                        type="number"
                                        value={choice.priceDelta || 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setNewTemplateGroups(
                                            newTemplateGroups.map((g) => {
                                              if (g.key !== grp.key) return g;
                                              return {
                                                ...g,
                                                choices: g.choices.map((c) => (c.id === choice.id ? { ...c, priceDelta: val } : c)),
                                              };
                                            })
                                          );
                                        }}
                                        placeholder="0"
                                        className={inputClass}
                                      />
                                    </div>

                                    {/* COLOR SWATCH */}
                                    <div className="sm:col-span-2">
                                      <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Color Swatch</label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="color"
                                          value={choice.colorSwatch || '#18181B'}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setNewTemplateGroups(
                                              newTemplateGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className="w-7 h-7 p-0 bg-transparent cursor-pointer rounded shrink-0 border border-slate-700"
                                        />
                                        <input
                                          type="text"
                                          value={choice.colorSwatch || '#18181B'}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setNewTemplateGroups(
                                              newTemplateGroups.map((g) => {
                                                if (g.key !== grp.key) return g;
                                                return {
                                                  ...g,
                                                  choices: g.choices.map((c) => (c.id === choice.id ? { ...c, colorSwatch: val } : c)),
                                                };
                                              })
                                            );
                                          }}
                                          className={`w-20 text-[10px] font-mono uppercase ${inputClass}`}
                                        />
                                      </div>
                                    </div>

                                    {/* LAYER IMAGE / OVERLAY IMAGE */}
                                    <div className="sm:col-span-4">
                                      <label className="text-[9px] font-extrabold uppercase text-slate-400 mb-0.5 flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-amber-500" /> Plantilla / Capa Visual
                                      </label>
                                      {choice.imageUrl ? (
                                        <div className="flex items-center gap-1.5">
                                          <img
                                            src={choice.imageUrl}
                                            alt={choice.name}
                                            className="w-7 h-7 object-contain bg-white border border-gray-300 rounded shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={choice.imageUrl}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setNewTemplateGroups(
                                                newTemplateGroups.map((g) => {
                                                  if (g.key !== grp.key) return g;
                                                  return {
                                                    ...g,
                                                    choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: val } : c)),
                                                  };
                                                })
                                              );
                                            }}
                                            placeholder="URL de imagen..."
                                            className={`flex-1 text-[11px] ${inputClass}`}
                                          />
                                          <label className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded cursor-pointer shrink-0 transition-colors" title="Subir nueva imagen">
                                            <Upload className="w-3.5 h-3.5" />
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => {
                                                    const res = event.target?.result as string;
                                                    if (res) {
                                                      setNewTemplateGroups(
                                                        newTemplateGroups.map((g) => {
                                                          if (g.key !== grp.key) return g;
                                                          return {
                                                            ...g,
                                                            choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                          };
                                                        })
                                                      );
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setNewTemplateGroups(
                                                newTemplateGroups.map((g) => {
                                                  if (g.key !== grp.key) return g;
                                                  return {
                                                    ...g,
                                                    choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: undefined } : c)),
                                                  };
                                                })
                                              );
                                            }}
                                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded shrink-0 transition-colors cursor-pointer"
                                            title="Quitar imagen"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <label className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border border-dashed border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer">
                                            <Upload className="w-3.5 h-3.5 text-slate-400" /> Subir Capa
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => {
                                                    const res = event.target?.result as string;
                                                    if (res) {
                                                      setNewTemplateGroups(
                                                        newTemplateGroups.map((g) => {
                                                          if (g.key !== grp.key) return g;
                                                          return {
                                                            ...g,
                                                            choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: res } : c)),
                                                          };
                                                        })
                                                      );
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </label>
                                          <input
                                            type="url"
                                            placeholder="O ingresa URL..."
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (!val) return;
                                              setNewTemplateGroups(
                                                newTemplateGroups.map((g) => {
                                                  if (g.key !== grp.key) return g;
                                                  return {
                                                    ...g,
                                                    choices: g.choices.map((c) => (c.id === choice.id ? { ...c, imageUrl: val } : c)),
                                                  };
                                                })
                                              );
                                            }}
                                            className={`text-[10px] ${inputClass}`}
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* DELETE CHOICE BUTTON */}
                                    <div className="sm:col-span-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleCreateRemoveChoice(grp.key, choice.id)}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                                        title="Eliminar variación"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW & CALIBRATION */}
              {createActiveTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${isDarkMode ? 'text-amber-400' : 'text-gray-800'}`}>
                        <Eye className="w-4 h-4" /> VISTA PREVIA EN VIVO & CALIBRACIÓN DE POSICIÓN
                      </h3>
                      <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        Calibra las coordenadas exactas de la estampa del cliente o la posición de las capas visuales.
                      </p>
                    </div>

                    {/* TARGET MODE SELECTOR */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-800 bg-slate-900/60 shrink-0">
                      {newTemplateData.supportsImageUpload && (
                        <button
                          type="button"
                          onClick={() => setCreateTransformTargetMode('printArea')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            createTransformTargetMode === 'printArea'
                              ? (isDarkMode ? 'bg-amber-400 text-slate-950 font-black' : 'bg-gray-900 text-white')
                              : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                          }`}
                        >
                          1. Estampa / Diseño Cliente
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCreateTransformTargetMode('choice')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          createTransformTargetMode === 'choice' || createTransformTargetMode === 'group'
                            ? (isDarkMode ? 'bg-amber-400 text-slate-950 font-black' : 'bg-gray-900 text-white')
                            : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900')
                        }`}
                      >
                        2. Capas Visuales / Dijes
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: LIVE EXACT COMPOSITE PREVIEW */}
                    <div className="lg:col-span-6 flex flex-col items-center">
                      <div className={`p-3 rounded-2xl border w-full flex items-center justify-center min-h-85 max-h-100 overflow-hidden ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-300'
                      }`}>
                        <CustomProductPreview
                          category={newTemplateData.id || 'NUEVA_PLANTILLA'}
                          options={createPreviewOptions}
                          overrideOptionGroups={newTemplateGroups}
                          overrideBaseImage={newTemplateData.baseImage}
                          customImage={newTemplateData.supportsImageUpload ? createCustomSampleImage : null}
                          imageTransforms={createPreviewTransforms}
                          onUpdateTransforms={(tf) => setCreatePreviewTransforms(tf)}
                          compact={false}
                          hideHeader={true}
                        />
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase mt-2">
                        Renderizado vectorial / fotográfico activo en tiempo real
                      </span>
                    </div>

                    {/* RIGHT COLUMN: CALIBRATION SLIDERS & TESTER */}
                    <div className="lg:col-span-6 space-y-3">

                      {/* MODE 1: PRINT AREA / USER ARTWORK CALIBRATION */}
                      {createTransformTargetMode === 'printArea' && (
                        <div className={`p-4 rounded-xl border space-y-3 ${
                          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                            <span className="text-xs font-black uppercase text-amber-500">
                              CALIBRAR ÁREA DE ESTAMPA DEL CLIENTE
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              X: {createPreviewTransforms.posX}px | Y: {createPreviewTransforms.posY}px | Zoom: {createPreviewTransforms.zoom}%
                            </span>
                          </div>

                          {/* POSITION X */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                Posición Horizontal (X): {createPreviewTransforms.posX}px
                              </span>
                              <button
                                type="button"
                                onClick={() => setCreatePreviewTransforms((prev) => ({ ...prev, posX: 0 }))}
                                className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                              >
                                Centrar (0px)
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-150"
                              max="150"
                              value={createPreviewTransforms.posX}
                              onChange={(e) => setCreatePreviewTransforms((prev) => ({ ...prev, posX: Number(e.target.value) }))}
                              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          {/* POSITION Y */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                Posición Vertical (Y): {createPreviewTransforms.posY}px
                              </span>
                              <button
                                type="button"
                                onClick={() => setCreatePreviewTransforms((prev) => ({ ...prev, posY: 0 }))}
                                className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                              >
                                Centrar (0px)
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-150"
                              max="150"
                              value={createPreviewTransforms.posY}
                              onChange={(e) => setCreatePreviewTransforms((prev) => ({ ...prev, posY: Number(e.target.value) }))}
                              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          {/* ZOOM / SCALE */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                Escala / Zoom: {createPreviewTransforms.zoom}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setCreatePreviewTransforms((prev) => ({ ...prev, zoom: 100 }))}
                                className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                              >
                                100%
                              </button>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="250"
                              value={createPreviewTransforms.zoom}
                              onChange={(e) => setCreatePreviewTransforms((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                              className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          {/* ROTATION */}
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                Rotación: {createPreviewTransforms.rotate}°
                              </span>
                              <button
                                type="button"
                                onClick={() => setCreatePreviewTransforms((prev) => ({ ...prev, rotate: 0 }))}
                                className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                              >
                                0°
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={createPreviewTransforms.rotate}
                              onChange={(e) => setCreatePreviewTransforms((prev) => ({ ...prev, rotate: Number(e.target.value) }))}
                              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                          </div>

                          {/* TEST SAMPLE GRAPHIC URL */}
                          <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                            <label className={`text-[10px] uppercase font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                              Imagen de Muestra para Probar Estampa:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={createCustomSampleImage || ''}
                                onChange={(e) => setCreateCustomSampleImage(e.target.value || null)}
                                placeholder="https://..."
                                className={inputClass}
                              />
                              <label className={`px-2.5 py-2 rounded-lg text-xs font-semibold uppercase cursor-pointer shrink-0 transition-colors flex items-center gap-1 border ${
                                isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-800 border-gray-300'
                              }`}>
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const res = ev.target?.result as string;
                                        if (res) setCreateCustomSampleImage(res);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: VARIATION LAYER SPECIFIC CALIBRATION */}
                      {(createTransformTargetMode === 'choice' || createTransformTargetMode === 'group') && (() => {
                        const targetGroup = newTemplateGroups.find((g) => g.key === createSelectedAttributeKey) || newTemplateGroups[0];
                        const targetChoice = targetGroup?.choices.find((c) => c.id === createSelectedChoiceId) || targetGroup?.choices[0];
                        const currentTf = createTransformTargetMode === 'choice' && targetChoice
                          ? (targetChoice.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 })
                          : (targetGroup?.transform || { posX: 0, posY: 0, zoom: 100, rotate: 0 });

                        return (
                          <div className={`p-4 rounded-xl border space-y-3 ${
                            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                              <span className="text-xs font-black uppercase text-amber-500">
                                CALIBRAR CAPA DE VARIACIÓN / DIJE
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                X: {currentTf.posX}px | Y: {currentTf.posY}px | Zoom: {currentTf.zoom}%
                              </span>
                            </div>

                            {/* SELECTOR OF ATTRIBUTE AND CHOICE */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Atributo a Calibrar:</label>
                                <select
                                  value={targetGroup?.key || ''}
                                  onChange={(e) => {
                                    const key = e.target.value;
                                    setCreateSelectedAttributeKey(key);
                                    const foundGrp = newTemplateGroups.find((g) => g.key === key);
                                    if (foundGrp && foundGrp.choices.length > 0) {
                                      setCreateSelectedChoiceId(foundGrp.choices[0].id);
                                    }
                                  }}
                                  className={`${inputClass} uppercase cursor-pointer text-[11px]`}
                                >
                                  {newTemplateGroups.map((g) => (
                                    <option key={g.key} value={g.key}>
                                      {g.label} ({g.choices.length} var.)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Variación:</label>
                                <select
                                  value={targetChoice?.id || ''}
                                  onChange={(e) => setCreateSelectedChoiceId(e.target.value)}
                                  className={`${inputClass} uppercase cursor-pointer text-[11px]`}
                                >
                                  {targetGroup?.choices.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} {c.imageUrl ? '[Capa]' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* TARGET MODE PILL */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400">Aplicar a:</span>
                              <button
                                type="button"
                                onClick={() => setCreateTransformTargetMode('choice')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer ${
                                  createTransformTargetMode === 'choice'
                                    ? (isDarkMode ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-gray-900 text-white border-gray-900')
                                    : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-300')
                                }`}
                              >
                                Variación Específica
                              </button>
                              <button
                                type="button"
                                onClick={() => setCreateTransformTargetMode('group')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer ${
                                  createTransformTargetMode === 'group'
                                    ? (isDarkMode ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-gray-900 text-white border-gray-900')
                                    : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-300')
                                }`}
                              >
                                Todo el Atributo
                              </button>
                            </div>

                            {/* POSITION X */}
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                  Posición Horizontal (X): {currentTf.posX}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                      handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { posX: 0 });
                                    } else if (targetGroup) {
                                      handleUpdateCreateGroupTransform(targetGroup.key, { posX: 0 });
                                    }
                                  }}
                                  className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                                >
                                  Centrar (0px)
                                </button>
                              </div>
                              <input
                                type="range"
                                min="-150"
                                max="150"
                                value={currentTf.posX}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                    handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { posX: val });
                                  } else if (targetGroup) {
                                    handleUpdateCreateGroupTransform(targetGroup.key, { posX: val });
                                  }
                                }}
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>

                            {/* POSITION Y */}
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                  Posición Vertical (Y): {currentTf.posY}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                      handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { posY: 0 });
                                    } else if (targetGroup) {
                                      handleUpdateCreateGroupTransform(targetGroup.key, { posY: 0 });
                                    }
                                  }}
                                  className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                                >
                                  Centrar (0px)
                                </button>
                              </div>
                              <input
                                type="range"
                                min="-150"
                                max="150"
                                value={currentTf.posY}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                    handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { posY: val });
                                  } else if (targetGroup) {
                                    handleUpdateCreateGroupTransform(targetGroup.key, { posY: val });
                                  }
                                }}
                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>

                            {/* ZOOM */}
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                  Escala / Zoom: {currentTf.zoom}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                      handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { zoom: 100 });
                                    } else if (targetGroup) {
                                      handleUpdateCreateGroupTransform(targetGroup.key, { zoom: 100 });
                                    }
                                  }}
                                  className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                                >
                                  100%
                                </button>
                              </div>
                              <input
                                type="range"
                                min="20"
                                max="250"
                                value={currentTf.zoom}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                    handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { zoom: val });
                                  } else if (targetGroup) {
                                    handleUpdateCreateGroupTransform(targetGroup.key, { zoom: val });
                                  }
                                }}
                                className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>

                            {/* ROTATION */}
                            <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-0.5">
                                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                  Rotación: {currentTf.rotate}°
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                      handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { rotate: 0 });
                                    } else if (targetGroup) {
                                      handleUpdateCreateGroupTransform(targetGroup.key, { rotate: 0 });
                                    }
                                  }}
                                  className="text-[9px] text-amber-500 hover:underline cursor-pointer"
                                >
                                  0°
                                </button>
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={currentTf.rotate}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (targetGroup && targetChoice && createTransformTargetMode === 'choice') {
                                    handleUpdateCreateChoiceTransform(targetGroup.key, targetChoice.id, { rotate: val });
                                  } else if (targetGroup) {
                                    handleUpdateCreateGroupTransform(targetGroup.key, { rotate: val });
                                  }
                                }}
                                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* LIVE VARIATION TESTER */}
                      <div className={`p-4 rounded-xl border space-y-2.5 ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                      }`}>
                        <span className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                          Probar Variaciones en Vivo:
                        </span>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {newTemplateGroups.map((grp) => (
                            <div key={grp.key} className="flex items-center justify-between gap-2 text-xs">
                              <label className={`text-[10px] uppercase font-semibold truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                {grp.label}:
                              </label>
                              <select
                                value={createPreviewOptions[grp.key] || grp.choices[0]?.name || ''}
                                onChange={(e) => setCreatePreviewOptions({ ...createPreviewOptions, [grp.key]: e.target.value })}
                                className={`${inputClass} max-w-48 py-1 px-2 text-[10px] font-bold uppercase cursor-pointer`}
                              >
                                {grp.choices.map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name} {c.priceDelta ? `(+$${c.priceDelta})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 -mx-6 -mb-6 mt-6 ${
                isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                  }`}
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  {createActiveTab !== 'info' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createActiveTab === 'preview') setCreateActiveTab('options');
                        else if (createActiveTab === 'options') setCreateActiveTab('info');
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                      }`}
                    >
                      Paso Anterior
                    </button>
                  )}

                  {createActiveTab !== 'preview' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createActiveTab === 'info') setCreateActiveTab('options');
                        else if (createActiveTab === 'options') setCreateActiveTab('preview');
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-2xs'
                      }`}
                    >
                      Siguiente Paso
                    </button>
                  )}

                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${
                      isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" /> Crear Plantilla Custom
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ELIMINAR PLANTILLA CUSTOM"
        message={`¿Estás seguro de que deseas eliminar permanentemente la plantilla "${deletingCategory?.name || ''}"?`}
        description="Esta plantilla se removerá del Taller Custom del panel de administración y dejará de estar disponible en el catálogo de personalización de los clientes."
        confirmText="Eliminar Plantilla"
        isDarkMode={isDarkMode}
      />

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        title={validationModal.title}
        message={validationModal.message}
        onClose={() => setValidationModal((prev) => ({ ...prev, isOpen: false }))}
        isDarkMode={isDarkMode}
      />

    </div>
  );
};
