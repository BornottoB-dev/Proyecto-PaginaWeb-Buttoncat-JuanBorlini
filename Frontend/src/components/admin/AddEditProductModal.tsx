import React, { useState, useEffect } from 'react';
import { 
  Save, 
  PlusCircle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  Package, 
  Image as ImageIcon,
  SlidersHorizontal,
  RefreshCw,
  Upload,
  Trash2,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import type { Product, ProductVibe, CategoryItem, BadgeItem, ProductVariationGroup } from '../../types/types';
import { uploadApi } from '../../services/api';
import { 
  getDefaultVariationsForCategory, 
  calculateTotalProductStock,
  getNextAutoNumericSku,
  getNextAutoNumericId,
  getSpanishFormattedDate
} from '../../types/types';
import { ProductVariationsMatrixModal } from './ProductVariationsMatrixModal';
import { ValidationModal } from '../ui/ValidationModal';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  existingProducts?: Product[];
  categories: CategoryItem[];
  tags?: BadgeItem[];
  isDarkMode?: boolean;
  onOpenVariationsMatrix?: (product: Product) => void;
}

const ALL_VIBES: ProductVibe[] = ['GOTH', 'Y2K', 'KAWAII', 'PUNK', 'ROCK', 'NEÓN'];

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  existingProducts = [],
  categories,
  tags,
  isDarkMode = true,
  onOpenVariationsMatrix,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [stock, setStock] = useState<number>(15);
  const [isUnique, setIsUnique] = useState<boolean>(false);
  const [hasVariations, setHasVariations] = useState<boolean>(false);
  const [isRewardOnly, setIsRewardOnly] = useState<boolean>(false);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [badgeBg, setBadgeBg] = useState('bg-brand-orange text-white');
  const [selectedVibes, setSelectedVibes] = useState<ProductVibe[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Variaciones y Matriz
  const [variations, setVariations] = useState<ProductVariationGroup[]>([]);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Atributos adicionales de producto
  const [sku, setSku] = useState('');
  const [dateAdded, setDateAdded] = useState('');
  const [salesChannel, setSalesChannel] = useState<'AMBOS' | 'SOLO_WEB' | 'SOLO_LOCAL'>('AMBOS');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [material, setMaterial] = useState('');

  useEffect(() => {
    setErrorMessage(null);
    setStep(1);
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice || '');
      
      const loadedImages = (productToEdit.images && productToEdit.images.length > 0)
        ? [...productToEdit.images]
        : (productToEdit.image ? [productToEdit.image] : []);
      setImages(loadedImages);
      setImage(productToEdit.image || loadedImages[0] || '');
      setVariantImages(productToEdit.variantImages ? { ...productToEdit.variantImages } : {});

      const editIsUnique = !!productToEdit.isUnique;
      setIsUnique(editIsUnique);

      const editHasVariations = !editIsUnique && (
        productToEdit.hasVariations !== undefined 
          ? productToEdit.hasVariations 
          : (productToEdit.variations !== undefined && productToEdit.variations.length > 0 && productToEdit.variations.some((v) => v.options && v.options.length > 0))
      );
      setHasVariations(editHasVariations);

      setStock(productToEdit.stock !== undefined ? productToEdit.stock : 10);
      setIsRewardOnly(Boolean(productToEdit.isRewardOnly || productToEdit.hiddenFromCatalog));
      setDescription(productToEdit.description);
      setBadge(productToEdit.badge || '');
      setBadgeId(productToEdit.badgeId || '');
      setBadgeBg(productToEdit.badgeBg || 'bg-brand-orange text-white');
      setSelectedVibes(productToEdit.vibe || []);
      
      const initialVars = (productToEdit.variations !== undefined)
        ? productToEdit.variations
        : (editHasVariations ? getDefaultVariationsForCategory(productToEdit.category, categories) : []);
      setVariations(initialVars);
      setVariantStocks(productToEdit.variantStocks ? { ...productToEdit.variantStocks } : {});

      setSku(productToEdit.sku || getNextAutoNumericSku(existingProducts));
      setDateAdded(getSpanishFormattedDate(productToEdit.dateAdded));
      setSalesChannel(productToEdit.salesChannel || 'AMBOS');
      setCostPrice(productToEdit.costPrice || '');
      setMaterial(productToEdit.material || '');
    } else {
      const defaultCat = categories[0]?.name || 'STICKERS';
      setName('');
      setCategory(defaultCat);
      setPrice('');
      setOriginalPrice('');
      setImages([]);
      setImage('');
      setVariantImages({});
      setStock(15);
      setIsUnique(false);
      setHasVariations(false);
      setIsRewardOnly(false);
      setDescription('');
      setBadge('');
      setBadgeId('');
      setBadgeBg('bg-brand-orange text-white');
      setSelectedVibes(['KAWAII']);
      setVariations([]);
      setVariantStocks({});
      setSku(getNextAutoNumericSku(existingProducts));
      setDateAdded(getSpanishFormattedDate());
      setSalesChannel('AMBOS');
      setCostPrice('');
      setMaterial('');
    }
  }, [productToEdit, isOpen, categories, existingProducts]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const readPromises = fileList.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Formato no soportado'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((newImgUrls) => {
      setImages((prev) => {
        const updated = [...prev, ...newImgUrls];
        if (!image && updated.length > 0) {
          setImage(updated[0]);
        }
        return updated;
      });
      setErrorMessage(null);
    }).catch((err) => {
      console.error('Error leyendo archivos de imagen:', err);
      setErrorMessage('Error al leer uno o más archivos de imagen.');
    });
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    const readPromises = fileList.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Formato no soportado'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((newImgUrls) => {
      setImages((prev) => {
        const updated = [...prev, ...newImgUrls];
        if (!image && updated.length > 0) {
          setImage(updated[0]);
        }
        return updated;
      });
      setErrorMessage(null);
    }).catch((err) => {
      console.error('Error leyendo archivos de imagen:', err);
      setErrorMessage('Error al procesar los archivos arrastrados.');
    });
  };

  const handleAddImageUrl = () => {
    const clean = customUrlInput.trim();
    if (!clean) return;
    setImages((prev) => {
      const updated = [...prev, clean];
      if (!image) {
        setImage(clean);
      }
      return updated;
    });
    setCustomUrlInput('');
    setErrorMessage(null);
  };

  const handleSetCover = (imgUrl: string) => {
    setImage(imgUrl);
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setImages((prev) => {
      const targetImg = prev[idxToRemove];
      const updated = prev.filter((_, i) => i !== idxToRemove);
      if (image === targetImg) {
        setImage(updated[0] || '');
      }
      return updated;
    });
  };

  const handleMoveImage = (idx: number, direction: 'left' | 'right') => {
    setImages((prev) => {
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, title: 'DATOS Y PRECIOS', icon: Package },
    { num: 2, title: 'MULTIMEDIA Y ESTILOS', icon: ImageIcon },
  ];

  const maxStep = stepsList.length;

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    if (step === 1) {
      if (!name.trim()) {
        setErrorMessage('El nombre del producto es obligatorio (Paso 1).');
        return;
      }
      if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
        setErrorMessage('Debes ingresar un precio público válido (Paso 1).');
        return;
      }
      setStep(2);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    setStep(1);
  };

  const handleVibeToggle = (vibe: ProductVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim().toUpperCase();
    if (!cleanName) {
      setErrorMessage('El nombre del producto es obligatorio (Paso 1).');
      setStep(1);
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      setErrorMessage('Debes ingresar un precio público válido (Paso 1).');
      setStep(1);
      return;
    }

    const rawImages = images.length > 0 ? images : (image.trim() ? [image.trim()] : []);
    const rawCover = image.trim() || rawImages[0] || '';
    if (!rawCover) {
      setErrorMessage('Es obligatorio cargar al menos una foto (formato archivo o URL) en el Paso 2.');
      setStep(2);
      return;
    }

    // Subir imagenes principales a Cloudinary si estan en Base64
    let finalImages = [...rawImages];
    if (rawImages.some((img) => img.startsWith('data:'))) {
      setIsUploading(true);
      try {
        const uploadPromises = rawImages.map(async (img) => {
          if (img.startsWith('data:')) {
            const res = await uploadApi.uploadImage(img, 'buttoncat/products');
            return res.success && res.data?.url ? res.data.url : img;
          }
          return img;
        });
        finalImages = await Promise.all(uploadPromises);
      } catch (err) {
        setErrorMessage('Error al subir una o más imágenes a Cloudinary.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    const finalCover = finalImages[0] || '';

    // Subir imagenes de variantes a Cloudinary si estan en Base64
    let finalVariantImages = { ...variantImages };
    const variantKeys = Object.keys(finalVariantImages);
    if (variantKeys.some((k) => finalVariantImages[k].startsWith('data:'))) {
      setIsUploading(true);
      try {
        for (const k of variantKeys) {
          if (finalVariantImages[k].startsWith('data:')) {
            const res = await uploadApi.uploadImage(finalVariantImages[k], 'buttoncat/products/variants');
            if (res.success && res.data?.url) {
              finalVariantImages[k] = res.data.url;
            }
          }
        }
      } catch (err) {
        setErrorMessage('Error al subir imágenes de variantes a Cloudinary.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const finalHasVariations = !isUnique && (hasVariations || variations.length > 0);
    const tempProdForStock: Product = {
      id: productToEdit ? productToEdit.id : 'temp',
      name: cleanName,
      category: category.trim().toUpperCase(),
      vibe: selectedVibes,
      price: Number(price),
      image: finalCover,
      images: finalImages,
      description: '',
      isCustomizable: false,
      stock: Number(stock) || 0,
      hasVariations: finalHasVariations,
      variations: finalHasVariations ? variations : [],
      variantStocks: finalHasVariations ? variantStocks : undefined,
    };
    const calculatedStock = isUnique ? 1 : (!finalHasVariations ? (Number(stock) || 0) : calculateTotalProductStock(tempProdForStock));

    const isDiscounted = originalPrice ? Number(originalPrice) > Number(price) : false;
    const offerTag = tags?.find((t) => t.name.toUpperCase().includes('OFERTA'));
    const finalBadgeId = badgeId || (isDiscounted && !badge.trim() ? offerTag?.id : undefined);

    const newProduct: Product = {
      id: productToEdit ? productToEdit.id : getNextAutoNumericId('prod-', existingProducts),
      name: cleanName,
      category: category.trim().toUpperCase(),
      vibe: selectedVibes.length > 0 ? selectedVibes : ['KAWAII'],
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: finalCover,
      images: finalImages,
      variantImages: finalHasVariations ? (Object.keys(finalVariantImages).length > 0 ? finalVariantImages : undefined) : undefined,
      badge: badge.trim() ? badge.trim().toUpperCase() : undefined,
      badgeId: finalBadgeId,
      badgeBg: badge.trim() ? badgeBg : undefined,
      description: description.trim() || 'Producto exclusivo de la colección Buttoncat Studio.',
      isCustomizable: false,
      stock: calculatedStock,
      isUnique,
      hasVariations: finalHasVariations,
      hiddenFromCatalog: isRewardOnly,
      isRewardOnly,
      rating: productToEdit?.rating || 5.0,
      variations: finalHasVariations ? variations : [],
      variantStocks: finalHasVariations ? (Object.keys(variantStocks).length > 0 ? variantStocks : undefined) : undefined,
      sku: sku.trim() || undefined,
      dateAdded: dateAdded || getSpanishFormattedDate(),
      salesChannel,
      costPrice: costPrice ? Number(costPrice) : undefined,
      material: material.trim() || undefined,
    };

    onSave(newProduct);
    onClose();
  };

  const currentProductForMatrix: Product = {
    id: productToEdit ? productToEdit.id : 'temp-id',
    name: name.trim().toUpperCase() || 'NUEVO PRODUCTO',
    category: category || 'STICKERS',
    price: Number(price) || 0,
    image: image.trim() || images[0] || 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600',
    images: images.length > 0 ? images : undefined,
    variantImages,
    stock: Number(stock) || 10,
    vibe: selectedVibes,
    description: description,
    hasVariations: !isUnique && hasVariations,
    variations,
    variantStocks,
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
          isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
        }`}
      >
        <div 
          className={`w-full max-w-4xl my-auto rounded-2xl border shadow-2xl overflow-hidden font-sans transition-colors flex flex-col max-h-[90vh] ${
            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-900 border-gray-200 shadow-2xs'
              }`}>
                <Package className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className={`text-base font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                  {productToEdit ? `Editar Producto: ${productToEdit.name}` : 'Crear Nuevo Producto'}
                </h2>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Ficha técnica, inventario y catálogo • Buttoncat Studio Admin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
              }`}
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEPPER STEP TRACKER BAR (TABS ELEGANTES Y PROFESIONALES) */}
          <div className={`flex border-b px-6 pt-2.5 gap-2 shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            {stepsList.map((stepObj) => {
              const isActive = step === stepObj.num;
              const IconComponent = stepObj.icon;
              return (
                <button
                  key={stepObj.num}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMessage(null);
                    setStep(stepObj.num as any);
                  }}
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

          {/* MAIN FORM */}
          <form id="product-editor-form" noValidate onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 font-sans space-y-6">
            
            {/* PASO 1: DATOS Y PRECIOS */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className={`p-5 rounded-xl border space-y-4 ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-3 ${
                    isDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <Package className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wide ${
                        isDarkMode ? 'text-slate-200' : 'text-gray-800'
                      }`}>
                        Información Principal y Clasificación
                      </h3>
                      <p className={`text-[10px] font-medium ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}>
                        Código, nombre, categoría y valores monetarios base
                      </p>
                    </div>
                  </div>

                  {/* NOMBRE Y CATEGORÍA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admin-prod-name" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Nombre del Producto <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="admin-prod-name"
                        name="productName"
                        aria-label="Nombre del Producto"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Peluche Osito Dark Unicornio"
                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium uppercase border focus:outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-900 shadow-2xs'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-prod-category" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Categoría del Catálogo <span className="text-red-500 font-bold">*</span>
                      </label>
                      <select
                        id="admin-prod-category"
                        name="productCategory"
                        aria-label="Categoría del Catálogo"
                        value={category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCategory(newCat);
                          if (hasVariations) {
                            setVariations(getDefaultVariationsForCategory(newCat, categories));
                          }
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium uppercase border focus:outline-none transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                        }`}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PRECIOS Y CANAL DE DISPONIBILIDAD */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label htmlFor="admin-prod-price" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Precio Público ($) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="admin-prod-price"
                        name="productPrice"
                        aria-label="Precio Público"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="15000"
                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-900 shadow-2xs'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-prod-original-price" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Precio Anterior / Oferta ($)
                      </label>
                      <input
                        id="admin-prod-original-price"
                        name="productOriginalPrice"
                        aria-label="Precio Anterior"
                        type="number"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Opcional (Tachado)"
                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-900 shadow-2xs'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-prod-sales-channel" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Canal / Disponibilidad
                      </label>
                      <select
                        id="admin-prod-sales-channel"
                        name="salesChannel"
                        aria-label="Canal o Disponibilidad del producto"
                        value={salesChannel}
                        onChange={(e) => setSalesChannel(e.target.value as any)}
                        className={`w-full rounded-lg px-3 py-2 text-xs font-medium uppercase border focus:outline-none transition-colors cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-gray-900 shadow-2xs'
                        }`}
                      >
                        <option value="AMBOS">WEB Y LOCAL FÍSICO</option>
                        <option value="SOLO_WEB">SOLO EN TIENDA WEB</option>
                        <option value="SOLO_LOCAL">SOLO EN LOCAL FÍSICO</option>
                      </select>
                    </div>
                  </div>

                  {/* SECCIÓN: MODALIDAD DE STOCK & VARIACIONES */}
                  <div className={`p-4 rounded-xl border space-y-3 mt-2 ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2.5 ${
                      isDarkMode ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <h4 className={`text-xs font-bold uppercase tracking-wide ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-800'
                        }`}>
                          Gestión de Stock y Tipología
                        </h4>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {isUnique ? 'Pieza Única' : hasVariations ? 'Matriz de Variantes' : 'Producto Estándar'}
                      </span>
                    </div>

                    {/* CHECKBOX 1: PRODUCTO DE STOCK ÚNICO */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      isUnique 
                        ? (isDarkMode ? 'bg-purple-950/30 border-purple-800/60' : 'bg-purple-50/60 border-purple-200')
                        : (isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40' : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/60')
                    }`}>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="isUniqueCheckbox"
                          checked={isUnique}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsUnique(checked);
                            if (checked) {
                              setHasVariations(false);
                              setStock(1);
                              setVariations([]);
                              setVariantStocks({});
                              if (!badge) {
                                setBadge('PIEZA ÚNICA');
                                setBadgeBg('bg-purple-600 text-white');
                              }
                            } else {
                              setStock(15);
                            }
                          }}
                          className="w-4 h-4 accent-gray-900 dark:accent-slate-100 cursor-pointer"
                        />
                        <div>
                          <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            Producto de stock único / Pieza única
                          </span>
                          <span className={`text-[10px] font-medium block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Solo 1 unidad irrepetible (ej. Peluche artesanal o pintura). El stock se fija automáticamente en 1 unidad.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* CHECKBOX 2: PRODUCTO CON VARIACIONES */}
                    {!isUnique && (
                      <div className={`p-3 rounded-xl border transition-all ${
                        hasVariations 
                          ? (isDarkMode ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50/60 border-blue-200')
                          : (isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/40' : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/60')
                      }`}>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            id="hasVariationsCheckbox"
                            checked={hasVariations}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setHasVariations(checked);
                              if (checked) {
                                if (variations.length === 0) {
                                  setVariations(getDefaultVariationsForCategory(category, categories));
                                }
                              } else {
                                setVariations([]);
                                setVariantStocks({});
                              }
                            }}
                            className="w-4 h-4 accent-gray-900 dark:accent-slate-100 cursor-pointer"
                          />
                          <div>
                            <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                              ¿Este producto tiene variaciones? (Talles, Colores, Medidas, etc.)
                            </span>
                            <span className={`text-[10px] font-medium block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              Habilita la matriz de variantes con control de stock e imágenes por combinación.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* CASO A: PRODUCTO ESTÁNDAR (SIN VARIACIONES Y NO ÚNICO) */}
                    {!isUnique && !hasVariations && (
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-gray-50/80 border-gray-200'
                      }`}>
                        <label htmlFor="product-stock-input" className={`block text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                          Stock disponible (unidades físicas) <span className="text-red-500 font-bold">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStock((prev) => Math.max(0, (Number(prev) || 0) - 1))}
                            className={`w-9 h-9 rounded-lg border font-bold text-sm flex items-center justify-center cursor-pointer transition-colors ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100 shadow-2xs'
                            }`}
                            title="Restar 1 unidad"
                          >
                            -
                          </button>
                          <input
                            id="product-stock-input"
                            name="stock"
                            aria-label="Stock disponible"
                            type="number"
                            min="0"
                            step="1"
                            value={stock}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              setStock(isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            placeholder="Ej: 25"
                            className={`w-32 rounded-lg px-3 py-1.5 text-xs font-bold text-center border focus:outline-none transition-colors ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900 shadow-2xs'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setStock((prev) => (Number(prev) || 0) + 1)}
                            className={`w-9 h-9 rounded-lg border font-bold text-sm flex items-center justify-center cursor-pointer transition-colors ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100 shadow-2xs'
                            }`}
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>
                          <span className={`text-xs font-semibold uppercase px-2 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            unidades
                          </span>
                        </div>
                        <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                          Stock directo: ingresa o modifica libremente la cantidad de unidades físicas disponibles.
                        </p>
                      </div>
                    )}

                    {/* CASO B: PRODUCTO CON VARIACIONES -> MATRIZ Y STOCK CALCULADO */}
                    {!isUnique && hasVariations && (
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-blue-50/50 border-blue-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                              Stock calculado por combinaciones de matriz
                            </span>
                            <div className={`text-lg font-bold font-mono ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                              {calculateTotalProductStock(currentProductForMatrix)}{' '}
                              <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>unidades totales</span>
                            </div>
                            <p className={`text-[11px] font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              {variations.length > 0
                                ? `Grupos activos (${variations.length}): ${variations.map((v) => v.name).join(', ')}`
                                : 'Sin grupos de variantes definidos aún.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenVariationsMatrix && productToEdit) {
                                onOpenVariationsMatrix(currentProductForMatrix);
                              } else {
                                setIsMatrixModalOpen(true);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                              isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 hover:bg-black'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Configurar Matriz y Fotos
                          </button>
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-blue-200'}`}>
                          <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Variantes sugeridas para {category}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVariations(getDefaultVariationsForCategory(category, categories))}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Cargar sugeridas
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CASO C: PIEZA ÚNICA */}
                    {isUnique && (
                      <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                        isDarkMode ? 'bg-purple-950/20 border-purple-800/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
                      }`}>
                        <Sparkles className="w-4 h-4 shrink-0 text-purple-500" />
                        <span className="text-xs font-semibold">
                          Stock fijado en 1 unidad irrepetible. Al concretarse la venta pasará automáticamente a agotado.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CHECKBOX OCULTAR DEL CATÁLOGO / SOLO PREMIOS */}
                  <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                  }`}>
                    <input
                      type="checkbox"
                      id="isRewardOnlyCheckbox"
                      checked={isRewardOnly}
                      onChange={(e) => {
                        setIsRewardOnly(e.target.checked);
                      }}
                      className="w-4 h-4 accent-gray-900 dark:accent-slate-100 cursor-pointer"
                    />
                    <label htmlFor="isRewardOnlyCheckbox" className={`text-xs font-semibold cursor-pointer select-none ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Ocultar del catálogo (Producto oculto para canjes de premios del club)
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* PASO 2: MULTIMEDIA, ETIQUETAS Y ESTILOS */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* IMAGEN Y MATERIAL */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-3 ${
                    isDarkMode ? 'border-slate-800' : 'border-gray-200'
                  }`}>
                    <ImageIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wide ${
                        isDarkMode ? 'text-slate-200' : 'text-gray-800'
                      }`}>
                        Multimedia y Etiquetas
                      </h3>
                      <p className={`text-[10px] font-medium ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-500'
                      }`}>
                        Galería de imágenes, etiquetas promocionales, estilos y ficha técnica
                      </p>
                    </div>
                  </div>

                  {/* CARGA DE MÚLTIPLES FOTOS (ARCHIVOS + DRAG & DROP + URL) */}
                  <div className="space-y-3">
                    <input
                      type="file"
                      id="productImageFilesInput"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {/* ZONA DE ARRASTRE Y SOLTAR (DRAG & DROP) */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none ${
                        isDragging
                          ? (isDarkMode ? 'border-slate-300 bg-slate-800/50' : 'border-gray-900 bg-gray-100')
                          : (isDarkMode ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/40' : 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/60')
                      }`}
                      onClick={() => document.getElementById('productImageFilesInput')?.click()}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                      <p className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        Arrastra tus fotos aquí o haz clic para seleccionar archivos
                      </p>
                      <p className={`text-[11px] font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Soporta múltiples archivos JPG, PNG, WEBP simultáneamente. Se guardarán en la galería del producto.
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('productImageFilesInput')?.click();
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" /> Subir fotos (Archivos)
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUrlInput((prev) => !prev);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                          }`}
                        >
                          {showUrlInput ? 'Cerrar URL' : '+ Agregar por URL'}
                        </button>
                      </div>
                    </div>

                    {/* INPUT SECUNDARIO OPCIONAL DE URL */}
                    {showUrlInput && (
                      <div className={`p-3 rounded-xl border space-y-2 ${
                        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <label htmlFor="product-custom-url-input" className={`block text-[11px] font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Agregar foto vía URL web:
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="product-custom-url-input"
                            name="customUrl"
                            aria-label="Agregar foto vía URL web"
                            type="url"
                            value={customUrlInput}
                            onChange={(e) => setCustomUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImageUrl();
                              }
                            }}
                            placeholder="https://images.unsplash.com/..."
                            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium border focus:outline-none transition-colors ${
                              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleAddImageUrl}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer ${
                              isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                            }`}
                          >
                            Añadir
                          </button>
                        </div>
                      </div>
                    )}

                    {/* GALERÍA DE FOTOS CARGADAS */}
                    {images.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase flex items-center gap-2 ${
                            isDarkMode ? 'text-slate-200' : 'text-gray-800'
                          }`}>
                            <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                            Galería del Producto ({images.length} foto{images.length > 1 ? 's' : ''})
                          </span>
                          <span className={`text-[10px] font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Haz clic en "Portada" para elegir la foto principal
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {images.map((imgUrl, idx) => {
                            const isCover = (image === imgUrl) || (!image && idx === 0);
                            return (
                              <div
                                key={idx}
                                className={`group relative rounded-xl border overflow-hidden transition-all ${
                                  isCover 
                                    ? (isDarkMode ? 'border-slate-200 ring-2 ring-slate-400' : 'border-gray-900 ring-2 ring-gray-900') 
                                    : (isDarkMode ? 'border-slate-800 hover:border-slate-700' : 'border-gray-200 hover:border-gray-300')
                                }`}
                              >
                                <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                                  <img
                                    src={imgUrl}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {isCover && (
                                    <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                      isDarkMode ? 'bg-slate-900/90 text-slate-100 border border-slate-700' : 'bg-gray-900/90 text-white'
                                    }`}>
                                      <Star className="w-3 h-3 fill-current" /> Portada
                                    </div>
                                  )}
                                </div>

                                <div className={`p-2 border-t flex items-center justify-between gap-1 ${
                                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                                }`}>
                                  {!isCover ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetCover(imgUrl)}
                                      className={`px-2 py-1 rounded text-[10px] font-semibold uppercase border transition-colors cursor-pointer flex items-center gap-1 ${
                                        isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                      }`}
                                      title="Fijar como portada principal"
                                    >
                                      <Star className="w-3 h-3" /> Portada
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1 px-1">
                                      <Check className="w-3 h-3" /> Principal
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveImage(idx, 'left')}
                                        className={`p-1 rounded border transition-colors cursor-pointer ${
                                          isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                        title="Mover a la izquierda"
                                      >
                                        <ChevronLeft className="w-3 h-3" />
                                      </button>
                                    )}
                                    {idx < images.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveImage(idx, 'right')}
                                        className={`p-1 rounded border transition-colors cursor-pointer ${
                                          isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                        }`}
                                        title="Mover a la derecha"
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(idx)}
                                      className="p-1 rounded border transition-colors cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900"
                                      title="Eliminar esta foto"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg border text-xs font-medium ${
                        isDarkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        * No has subido ninguna foto todavía. Arrastra archivos arriba o haz clic en Subir Fotos.
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="product-material-input" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Material / Composición del Producto
                    </label>
                    <input
                      id="product-material-input"
                      name="material"
                      aria-label="Material o composición del producto"
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Ej: Felpa hipoalergénica lavable, Algodón 100%, Vinilo mate 3M"
                      className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* BADGES & VIBES */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50/70 border-gray-200'
                }`}>
                  
                  {/* BADGE TABULADO */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                        Etiqueta Seleccionada (Badge Sello)
                      </label>
                      {badge && (
                        <button
                          type="button"
                          onClick={() => {
                            setBadge('');
                            setBadgeId('');
                          }}
                          className="text-[10px] font-bold uppercase text-red-600 hover:underline cursor-pointer"
                        >
                          ✕ Quitar Etiqueta
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {tags && tags.length > 0 ? (
                        tags.map((tagObj) => {
                          const isSelected = badgeId === tagObj.id || badge.trim().toUpperCase() === tagObj.name.toUpperCase();
                          return (
                            <button
                              key={tagObj.id}
                              type="button"
                              onClick={() => {
                                setBadge(tagObj.name);
                                setBadgeId(tagObj.id);
                                if (tagObj.badgeBg) {
                                  setBadgeBg(tagObj.badgeBg);
                                }
                              }}
                              className={`p-2 rounded-lg border text-center font-bold text-xs uppercase transition-all cursor-pointer ${
                                isSelected
                                  ? (isDarkMode ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-xs' : 'bg-gray-900 text-white border-gray-900 shadow-xs')
                                  : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100')
                              }`}
                            >
                              {tagObj.name}
                            </button>
                          );
                        })
                      ) : (
                        <div className={`col-span-full p-3 rounded-lg border text-xs font-medium text-center ${
                          isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}>
                          No hay etiquetas creadas en el sistema. Puedes crearlas en la pestaña "Estilos y Etiquetas".
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label htmlFor="product-badge-text-input" className={`block text-[10px] font-semibold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Texto personalizado de badge:
                        </label>
                        <input
                          id="product-badge-text-input"
                          name="badgeText"
                          aria-label="Texto personalizado de badge"
                          type="text"
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          placeholder="Ej: -20%, RE-STOCK..."
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium uppercase border focus:outline-none transition-colors ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="product-badge-color-select" className={`block text-[10px] font-semibold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Color del badge:
                        </label>
                        <select
                          id="product-badge-color-select"
                          name="badgeBgColor"
                          aria-label="Color del badge"
                          value={badgeBg}
                          onChange={(e) => setBadgeBg(e.target.value)}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium uppercase border focus:outline-none transition-colors cursor-pointer ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="bg-brand-orange text-white">NARANJA BRAND</option>
                          <option value="bg-brand-pink text-white">ROSA BRAND</option>
                          <option value="bg-brand-yellow text-black">AMARILLO BRAND</option>
                          <option value="bg-brand-cyan text-black">CYAN BRAND</option>
                          <option value="bg-brand-purple text-white">PÚRPURA BRAND</option>
                          <option value="bg-black text-white">NEGRO DARK</option>
                        </select>
                      </div>
                    </div>

                    {badge && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold uppercase">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Vista previa:</span>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase shadow-2xs ${badgeBg}`}>
                          {badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* VIBES / ESTILOS */}
                  <div>
                    <label className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Estilos Vinculados (Vibes)
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ALL_VIBES.map((vibe) => {
                        const isSelected = selectedVibes.includes(vibe);
                        return (
                          <button
                            type="button"
                            key={vibe}
                            onClick={() => handleVibeToggle(vibe)}
                            className={`px-3 py-1.5 rounded-lg border font-bold text-xs uppercase transition-all cursor-pointer ${
                              isSelected
                                ? (isDarkMode ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-xs' : 'bg-gray-900 text-white border-gray-900 shadow-xs')
                                : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100')
                            }`}
                          >
                            {isSelected ? `✓ ${vibe}` : vibe}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DESCRIPCIÓN */}
                  <div>
                    <label htmlFor="product-description-textarea" className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
                      isDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Descripción Detallada del Producto
                    </label>
                    <textarea
                      id="product-description-textarea"
                      name="description"
                      aria-label="Descripción detallada del producto"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles sobre materiales, tamaños, confección o acabados..."
                      className={`w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors resize-none ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                </div>

              </div>
            )}

          </form>

          {/* STEPPER FOOTER NAVIGATION BUTTONS */}
          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                }`}
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {step < maxStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="product-editor-form"
                  disabled={isUploading}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                    isUploading ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Subiendo a Cloudinary...
                    </>
                  ) : productToEdit ? (
                    <>
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" /> Crear Producto
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SUB-MODAL DEDICADO DE VARIACIONES Y MATRIZ DE STOCK */}
      <ProductVariationsMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        onSave={(updatedProduct) => {
          setHasVariations(true);
          setVariations(updatedProduct.variations || []);
          setVariantStocks(updatedProduct.variantStocks || {});
          if (updatedProduct.variantImages) {
            setVariantImages(updatedProduct.variantImages);
          }
          setStock(updatedProduct.stock);
        }}
        product={currentProductForMatrix}
        categories={categories}
        isDarkMode={isDarkMode}
      />

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="AVISO DE VALIDACIÓN"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
