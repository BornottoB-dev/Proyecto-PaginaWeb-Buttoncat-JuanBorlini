import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Award, Upload, Trash2, Loader2 } from 'lucide-react';
import type { RewardItem, RewardCategory, RewardCategoryItem, Product } from '../../types/types';
import { handleProductImageError } from '../../types/types';
import { ValidationModal } from '../ui/ValidationModal';
import { uploadApi } from '../../services/api';

interface AddRewardAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardItem) => void;
  rewardToEdit?: RewardItem | null;
  isDarkMode?: boolean;
  products?: Product[];
  rewardCategories?: RewardCategoryItem[];
}

export const AddRewardAdminModal: React.FC<AddRewardAdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rewardToEdit,
  isDarkMode = true,
  products = [],
  rewardCategories = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState<number | ''>(200);
  const [category, setCategory] = useState<RewardCategory>('VOUCHER');
  const [discountValue, setDiscountValue] = useState('$2.000 OFF');
  const [image, setImage] = useState('');
  const [codePrefix, setCodePrefix] = useState('BTC-REWARD');
  const [productId, setProductId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isProductCategory = (catName: string) => {
    const upper = (catName || '').toUpperCase();
    return upper === 'PRODUCTO' || upper.includes('PRODUCTO') || upper.includes('MERCHANDISING') || upper.includes('REGALO');
  };

  useEffect(() => {
    setErrorMessage(null);
    setIsDragging(false);
    setShowUrlInput(false);
    if (rewardToEdit) {
      setTitle(rewardToEdit.title);
      setDescription(rewardToEdit.description);
      setPointsCost(rewardToEdit.pointsCost);
      setCategory(rewardToEdit.category);
      setDiscountValue(rewardToEdit.discountValue);
      setImage(rewardToEdit.image || '');
      setCodePrefix(rewardToEdit.codePrefix);
      setProductId(rewardToEdit.productId || '');
    } else {
      setTitle('');
      setDescription('');
      setPointsCost(200);
      const defaultCat = (rewardCategories && rewardCategories.length > 0 ? rewardCategories[0].name : 'VOUCHER') as RewardCategory;
      setCategory(defaultCat);
      setDiscountValue(isProductCategory(defaultCat) ? 'PRODUCTO FÍSICO ($0)' : '$2.000 OFF');
      setImage('');
      setCodePrefix('BTC-REWARD');
      setProductId('');
    }
  }, [rewardToEdit, isOpen, rewardCategories]);

  const handleCategoryChange = (newCat: RewardCategory) => {
    setCategory(newCat);
    if (!isProductCategory(newCat)) {
      setProductId('');
      if (discountValue === 'PRODUCTO FÍSICO ($0)') {
        setDiscountValue('$2.000 OFF');
      }
    } else {
      setDiscountValue('PRODUCTO FÍSICO ($0)');
    }
  };

  const handleProductSelect = (selectedId: string) => {
    setProductId(selectedId);
    if (!selectedId) return;
    const prod = products.find((p) => p.id === selectedId);
    if (prod) {
      if (!title.trim() || title === 'VOUCHER DE COMPRA $2.000 ARS') {
        setTitle(prod.name.toUpperCase());
      }
      if (!isProductCategory(category)) {
        const prodCat = rewardCategories.find((rc) => isProductCategory(rc.name));
        setCategory((prodCat ? prodCat.name : 'PRODUCTO') as RewardCategory);
      }
      setDiscountValue('PRODUCTO FÍSICO ($0)');
      if (prod.image) {
        setImage(prod.image);
      }
      if (prod.description && (!description || description === 'Beneficio exclusivo canjeable con puntos acumulados.')) {
        setDescription(prod.description);
      }
      setCodePrefix(`BTC-PROD-${prod.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) {
      setErrorMessage('Por favor arrastra un archivo de imagen válido (JPG, PNG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al procesar la imagen arrastrada.');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('El título del premio es obligatorio (*).');
      return;
    }

    if ((category === 'PRODUCTO' || (category || '').toUpperCase().includes('PRODUCTO')) && !productId) {
      setErrorMessage('Debes seleccionar un producto del inventario para la categoría Producto Exclusivo (*).');
      return;
    }

    if (!discountValue.trim()) {
      setErrorMessage('El valor del beneficio es obligatorio (*).');
      return;
    }

    if (!pointsCost || Number(pointsCost) <= 0) {
      setErrorMessage('El costo en puntos debe ser mayor a 0 (*).');
      return;
    }

    const cleanImage = image.trim();
    if (!cleanImage) {
      setErrorMessage('La foto del voucher / premio es obligatoria (*). Carga una imagen para continuar.');
      return;
    }

    let finalImageUrl = cleanImage;
    if (cleanImage.startsWith('data:')) {
      setIsUploading(true);
      try {
        const uploadRes = await uploadApi.uploadImage(cleanImage, 'buttoncat/rewards');
        if (uploadRes.success && uploadRes.data?.url) {
          finalImageUrl = uploadRes.data.url;
        } else {
          setErrorMessage(uploadRes.error || 'Error al subir la imagen a Cloudinary.');
          setIsUploading(false);
          return;
        }
      } catch (err) {
        setErrorMessage('Fallo en la comunicación con el servidor al subir la imagen.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const matchedCategory = rewardCategories.find((rc) => rc.name === category);
    const rewardData: RewardItem = {
      id: rewardToEdit ? rewardToEdit.id : `reward-${Date.now()}`,
      title: title.trim().toUpperCase(),
      description: description.trim() || 'Beneficio exclusivo canjeable con puntos acumulados.',
      pointsCost: Number(pointsCost),
      category,
      categoryId: matchedCategory?.id,
      discountValue: discountValue.trim().toUpperCase(),
      image: finalImageUrl,
      codePrefix: codePrefix.trim().toUpperCase() || 'BTC-REWARD',
      productId: isProductCategory(category) ? (productId || undefined) : undefined,
    };

    onSave(rewardData);
    onClose();
  };

  const hiddenProducts = products.filter(
    (p) => p.hiddenFromCatalog || p.isRewardOnly || p.id === productId
  );

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`;
  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none transition-colors ${
    isDarkMode 
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 shadow-2xs'
  }`;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
    >
      <div 
        className={`w-full max-w-xl max-h-[90vh] my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
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
              <Award className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                {rewardToEdit ? 'EDITAR PREMIO' : 'NUEVO PREMIO / CUPÓN CANJEABLE'}
              </h2>
              <p className={`text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Club Cats & Sistema de Recompensas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* SCROLLABLE BODY */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label htmlFor="admin-reward-title" className={labelClass}>TÍTULO DEL PREMIO *</label>
              <input
                id="admin-reward-title"
                name="rewardTitle"
                aria-label="Título del Premio"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: VOUCHER DE COMPRA $2.000 ARS"
                className={`${inputClass} uppercase`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-reward-category" className={labelClass}>TIPO / CATEGORÍA</label>
                <select
                  id="admin-reward-category"
                  name="rewardCategory"
                  aria-label="Tipo o Categoría del Premio"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as RewardCategory)}
                  className={`${inputClass} uppercase cursor-pointer`}
                >
                  {rewardCategories && rewardCategories.length > 0 ? (
                    rewardCategories.map((rc) => (
                      <option key={rc.id} value={rc.name}>
                        {rc.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="VOUCHER">VOUCHER DE COMPRA</option>
                      <option value="DESCUENTO">DESCUENTO PORCENTUAL</option>
                      <option value="PRODUCTO">PRODUCTO EXCLUSIVO</option>
                      <option value="ENVIO">ENVÍO GRATIS</option>
                      <option value="REGALO">REGALO / CAJA SORPRESA</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="admin-reward-points" className={labelClass}>COSTO EN PUNTOS (PTS) *</label>
                <input
                  id="admin-reward-points"
                  name="rewardPoints"
                  aria-label="Costo en Puntos"
                  type="number"
                  min="10"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="200"
                  className={inputClass}
                />
              </div>
            </div>

            {/* VINCULAR PRODUCTO DEL INVENTARIO (SOLO VISIBLE CUANDO TIPO ES PRODUCTO EXCLUSIVO) */}
            {(isProductCategory(category) || Boolean(productId)) && (
              <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-purple-50/60 border-purple-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label htmlFor="admin-reward-product-id" className={`${labelClass} text-purple-700 dark:text-purple-300 font-bold`}>
                    VINCULAR PRODUCTO DEL INVENTARIO *
                  </label>
                  {productId && (
                    <button
                      type="button"
                      onClick={() => setProductId('')}
                      className="text-[10px] font-semibold text-red-500 hover:underline uppercase cursor-pointer"
                    >
                      ✕ Desvincular
                    </button>
                  )}
                </div>
                <select
                  id="admin-reward-product-id"
                  name="rewardProductId"
                  aria-label="Vincular Producto del Inventario"
                  value={productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className={`${inputClass} uppercase cursor-pointer text-xs`}
                >
                  <option value="">-- Seleccionar producto oculto del inventario * --</option>
                  {hiddenProducts.length === 0 ? (
                    <option value="" disabled>-- No hay productos ocultos en el inventario --</option>
                  ) : (
                    hiddenProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [OCULTO] {p.isUnique ? '[STOCK UNICO]' : ''} (STOCK: {p.stock})
                      </option>
                    ))
                  )}
                </select>
                <p className={`text-[11px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-purple-900/70'}`}>
                  Obligatorio para la categoría Producto Exclusivo. Se vinculará el canje al producto físico ($0) e importará su foto y ficha.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-reward-discount-val" className={labelClass}>VALOR DEL BENEFICIO *</label>
                <input
                  id="admin-reward-discount-val"
                  name="rewardDiscountValue"
                  aria-label="Valor del Beneficio"
                  type="text"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="Ej: $2.000 OFF, 15% OFF, GRATIS"
                  className={`${inputClass} uppercase`}
                />
              </div>

              <div>
                <label htmlFor="admin-reward-code-prefix" className={labelClass}>PREFIJO DE CÓDIGO</label>
                <input
                  id="admin-reward-code-prefix"
                  name="rewardCodePrefix"
                  aria-label="Prefijo de Código"
                  type="text"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value)}
                  placeholder="BTC-VOUCHER2000"
                  className={`${inputClass} uppercase`}
                />
              </div>
            </div>

            {/* FOTO / IMAGEN DEL VOUCHER / PREMIO (CARGA DE ARCHIVO LOCAL) */}
            <div className="space-y-2">
              <label className={labelClass}>
                FOTO / IMAGEN DEL PREMIO *
              </label>

              <input
                type="file"
                id="rewardImageFileInput"
                name="rewardImageFileInput"
                aria-label="Foto o imagen del premio"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {image ? (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50/80 border-gray-200'
                }`}>
                  <div className={`w-24 h-24 rounded-lg overflow-hidden border shrink-0 bg-white flex items-center justify-center ${
                    isDarkMode ? 'border-slate-700' : 'border-gray-300'
                  }`}>
                    <img
                      src={image}
                      alt="Vista previa premio"
                      onError={handleProductImageError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-left w-full overflow-hidden">
                    <div>
                      <span className={`text-xs font-bold uppercase block ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        Foto Cargada
                      </span>
                      <span className={`text-[11px] font-medium block truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {image.startsWith('data:') ? 'Imagen cargada desde archivo local' : image}
                      </span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('rewardImageFileInput')?.click()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('rewardImageFileInput')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none ${
                    isDragging
                      ? (isDarkMode ? 'border-slate-300 bg-slate-800/50' : 'border-gray-900 bg-gray-100')
                      : (isDarkMode ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/40' : 'border-gray-300 bg-gray-50/60 hover:bg-gray-100/60')
                  }`}
                >
                  <Upload className={`w-7 h-7 mx-auto mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                  <p className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                    Haz clic para subir una foto o arrástrala aquí
                  </p>
                  <p className={`text-[11px] font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Soporta archivos JPG, PNG, WEBP. Se mostrará en el catálogo de premios del club.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('rewardImageFileInput')?.click();
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" /> Subir foto (Archivo)
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
                      {showUrlInput ? 'Cerrar URL' : '+ Ingresar URL'}
                    </button>
                  </div>
                </div>
              )}

              {/* INPUT SECUNDARIO OPCIONAL DE URL */}
              {showUrlInput && (
                <div className={`p-3 rounded-xl border space-y-2 mt-2 ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <label htmlFor="admin-reward-url" className={labelClass}>URL DIRECTA DE LA IMAGEN</label>
                  <div className="flex gap-2">
                    <input
                      id="admin-reward-url"
                      name="rewardUrl"
                      aria-label="URL directa de la imagen"
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-colors cursor-pointer ${
                        isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Listo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="admin-reward-description" className={labelClass}>DESCRIPCIÓN</label>
              <textarea
                id="admin-reward-description"
                name="rewardDescription"
                aria-label="Descripción del premio"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles sobre el uso del cupón..."
                className={`${inputClass} resize-none`}
              />
            </div>

          </div>

          {/* FIXED PINNED FOOTER */}
          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isUploading ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDarkMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-white'
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Subiendo a Cloudinary...
                </>
              ) : rewardToEdit ? (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Crear Premio
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="CAMPO OBLIGATORIO REQUERIDO"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
