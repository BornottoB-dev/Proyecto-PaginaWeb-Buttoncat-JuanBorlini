import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Search, Tag, Check, X, Phone, Mail, FileText, RotateCcw } from 'lucide-react';
import { expensesApi } from '../../services/api';

export interface SupplierRecord {
  idProveedor: number;
  razonSocial: string;
  cuit?: string | null;
  telefono?: string | null;
  correo?: string | null;
  activo: boolean;
  _count?: { gastos: number };
}

export interface ExpenseCategoryRecord {
  idCategoriaGasto: number;
  nombreCategoria: string;
  descripcion?: string | null;
  activo: boolean;
}

interface AdminSuppliersAndCategoriesManagerProps {
  suppliers: SupplierRecord[];
  onSuppliersChange: (suppliers: SupplierRecord[]) => void;
  expenseCategories: ExpenseCategoryRecord[];
  onExpenseCategoriesChange: (categories: ExpenseCategoryRecord[]) => void;
  activeSubSection: 'suppliers' | 'categories';
  isDarkMode?: boolean;
}

export const AdminSuppliersAndCategoriesManager: React.FC<AdminSuppliersAndCategoriesManagerProps> = ({
  suppliers,
  onSuppliersChange,
  expenseCategories,
  onExpenseCategoriesChange,
  activeSubSection,
  isDarkMode = false,
}) => {
  // Supplier state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [supplierActivo, setSupplierActivo] = useState(true);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  // Expense Category state
  const [categorySearch, setCategorySearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryRecord | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [descripcionCategoria, setDescripcionCategoria] = useState('');
  const [categoryActivo, setCategoryActivo] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setRazonSocial('');
    setCuit('');
    setTelefono('');
    setCorreo('');
    setSupplierActivo(true);
    setSupplierError(null);
  };

  const handleEditSupplierClick = (sup: SupplierRecord) => {
    setEditingSupplier(sup);
    setRazonSocial(sup.razonSocial || '');
    setCuit(sup.cuit || '');
    setTelefono(sup.telefono || '');
    setCorreo(sup.correo || '');
    setSupplierActivo(sup.activo !== false);
    setSupplierError(null);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierError(null);
    if (!razonSocial.trim()) {
      setSupplierError('Ingresa la Razón Social del proveedor.');
      return;
    }

    setIsSavingSupplier(true);
    try {
      if (editingSupplier) {
        const res = await expensesApi.updateSupplier(editingSupplier.idProveedor, {
          razonSocial: razonSocial.trim(),
          cuit: cuit.trim() || undefined,
          telefono: telefono.trim() || undefined,
          correo: correo.trim() || undefined,
          activo: supplierActivo,
        });
        if (res.success && res.data) {
          onSuppliersChange(
            suppliers.map((s) =>
              s.idProveedor === editingSupplier.idProveedor ? { ...s, ...res.data } : s
            )
          );
          resetSupplierForm();
        } else {
          setSupplierError(res.error || 'No se pudo actualizar el proveedor.');
        }
      } else {
        const res = await expensesApi.createSupplier({
          razonSocial: razonSocial.trim(),
          cuit: cuit.trim() || undefined,
          telefono: telefono.trim() || undefined,
          correo: correo.trim() || undefined,
        });
        if (res.success && res.data) {
          onSuppliersChange([res.data, ...suppliers]);
          resetSupplierForm();
        } else {
          setSupplierError(res.error || 'No se pudo registrar el proveedor.');
        }
      }
    } catch (err) {
      console.error('[SaveSupplier Error]:', err);
      setSupplierError('Error de conexión al guardar proveedor.');
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleToggleSupplierActive = async (sup: SupplierRecord) => {
    try {
      if (sup.activo) {
        const res = await expensesApi.deleteSupplier(sup.idProveedor);
        if (res.success) {
          onSuppliersChange(
            suppliers.map((s) => (s.idProveedor === sup.idProveedor ? { ...s, activo: false } : s))
          );
        }
      } else {
        const res = await expensesApi.updateSupplier(sup.idProveedor, { activo: true });
        if (res.success && res.data) {
          onSuppliersChange(
            suppliers.map((s) => (s.idProveedor === sup.idProveedor ? { ...s, ...res.data } : s))
          );
        }
      }
    } catch (err) {
      console.error('[ToggleSupplierActive Error]:', err);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNombreCategoria('');
    setDescripcionCategoria('');
    setCategoryActivo(true);
    setCategoryError(null);
  };

  const handleEditCategoryClick = (cat: ExpenseCategoryRecord) => {
    setEditingCategory(cat);
    setNombreCategoria(cat.nombreCategoria || '');
    setDescripcionCategoria(cat.descripcion || '');
    setCategoryActivo(cat.activo !== false);
    setCategoryError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!nombreCategoria.trim()) {
      setCategoryError('Ingresa el nombre de la categoría de gasto.');
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await expensesApi.updateExpenseCategory(editingCategory.idCategoriaGasto, {
          nombreCategoria: nombreCategoria.trim(),
          descripcion: descripcionCategoria.trim() || undefined,
          activo: categoryActivo,
        });
        if (res.success && res.data) {
          onExpenseCategoriesChange(
            expenseCategories.map((c) =>
              c.idCategoriaGasto === editingCategory.idCategoriaGasto ? { ...c, ...res.data } : c
            )
          );
          resetCategoryForm();
        } else {
          setCategoryError(res.error || 'No se pudo actualizar la categoría de gasto.');
        }
      } else {
        const res = await expensesApi.createExpenseCategory({
          nombreCategoria: nombreCategoria.trim(),
          descripcion: descripcionCategoria.trim() || undefined,
        });
        if (res.success && res.data) {
          onExpenseCategoriesChange([...expenseCategories, res.data]);
          resetCategoryForm();
        } else {
          setCategoryError(res.error || 'No se pudo crear la categoría de gasto.');
        }
      }
    } catch (err) {
      console.error('[SaveExpenseCategory Error]:', err);
      setCategoryError('Error de conexión al guardar categoría de gasto.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleToggleCategoryActive = async (cat: ExpenseCategoryRecord) => {
    try {
      if (cat.activo) {
        const res = await expensesApi.deleteExpenseCategory(cat.idCategoriaGasto);
        if (res.success) {
          onExpenseCategoriesChange(
            expenseCategories.map((c) =>
              c.idCategoriaGasto === cat.idCategoriaGasto ? { ...c, activo: false } : c
            )
          );
        }
      } else {
        const res = await expensesApi.updateExpenseCategory(cat.idCategoriaGasto, { activo: true });
        if (res.success && res.data) {
          onExpenseCategoriesChange(
            expenseCategories.map((c) =>
              c.idCategoriaGasto === cat.idCategoriaGasto ? { ...c, ...res.data } : c
            )
          );
        }
      }
    } catch (err) {
      console.error('[ToggleExpenseCategoryActive Error]:', err);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!supplierSearch.trim()) return true;
    const q = supplierSearch.toLowerCase();
    return (
      s.razonSocial?.toLowerCase().includes(q) ||
      s.cuit?.toLowerCase().includes(q) ||
      s.correo?.toLowerCase().includes(q) ||
      s.telefono?.toLowerCase().includes(q) ||
      String(s.idProveedor).includes(q)
    );
  });

  const filteredCategories = expenseCategories.filter((c) => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.toLowerCase();
    return (
      c.nombreCategoria?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q) ||
      String(c.idCategoriaGasto).includes(q)
    );
  });

  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none ${
    isDarkMode
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900'
  }`;

  if (activeSubSection === 'suppliers') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORMULARIO ALTA / EDICIÓN DE PROVEEDOR (4 COLS) */}
        <form
          onSubmit={handleSaveSupplier}
          className={`lg:col-span-4 border p-5 rounded-xl space-y-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50/70 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-inherit">
            <h3 className="text-sm font-black uppercase flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {editingSupplier ? `Editar Proveedor #${editingSupplier.idProveedor}` : 'Nuevo Proveedor'}
            </h3>
            {editingSupplier && (
              <button
                type="button"
                onClick={resetSupplierForm}
                className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>

          {supplierError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
              {supplierError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Razón Social / Nombre *</label>
            <input
              type="text"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Ej: Textil Quilmes S.R.L."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">CUIT</label>
            <input
              type="text"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              placeholder="Ej: 30-71234567-9"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 11-4455-6677"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ventas@proveedor.com"
                className={inputClass}
              />
            </div>
          </div>

          {editingSupplier && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase">Estado del Proveedor</span>
              <button
                type="button"
                onClick={() => setSupplierActivo(!supplierActivo)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  supplierActivo
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-500 border-red-500/30'
                }`}
              >
                {supplierActivo ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSavingSupplier}
            className={`w-full py-2.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-slate-100 text-slate-900 hover:bg-white'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {editingSupplier ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
          </button>
        </form>

        {/* TABLA DE PROVEEDORES REGISTRADOS (8 COLS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase">
                DIRECTORIO DE PROVEEDORES ({filteredSuppliers.length} DE {suppliers.length})
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Tabla maestra `proveedores` en PostgreSQL vinculada a los gastos operativos
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Buscar por razón social, CUIT..."
                className={`${inputClass} pr-8`}
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div
            className={`border rounded-xl overflow-hidden ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
            }`}
          >
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead
                className={`uppercase text-[10px] font-black border-b ${
                  isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <tr>
                  <th className="p-3 w-16">ID</th>
                  <th className="p-3">RAZÓN SOCIAL & CUIT</th>
                  <th className="p-3">CONTACTO</th>
                  <th className="p-3 text-center">ESTADO</th>
                  <th className="p-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      No hay proveedores registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup.idProveedor} className={isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'}>
                      <td className="p-3 font-mono font-bold text-amber-500">#{sup.idProveedor}</td>
                      <td className="p-3">
                        <p className="font-bold">{sup.razonSocial}</p>
                        <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {sup.cuit ? `CUIT: ${sup.cuit}` : 'Sin CUIT registrado'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5 text-[11px]">
                          {sup.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {sup.telefono}
                            </span>
                          )}
                          {sup.correo && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {sup.correo}
                            </span>
                          )}
                          {!sup.telefono && !sup.correo && (
                            <span className="text-slate-400 italic">Sin datos de contacto</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sup.activo !== false
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-500 border-red-500/30'
                          }`}
                        >
                          {sup.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditSupplierClick(sup)}
                            className="p-1.5 rounded hover:bg-slate-800/50 text-blue-500 cursor-pointer"
                            title="Editar proveedor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSupplierActive(sup)}
                            className={`p-1.5 rounded cursor-pointer ${
                              sup.activo !== false ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                            title={sup.activo !== false ? 'Desactivar proveedor' : 'Reactivar proveedor'}
                          >
                            {sup.activo !== false ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* FORMULARIO ALTA / EDICIÓN DE CATEGORÍA DE GASTO (4 COLS) */}
      <form
        onSubmit={handleSaveCategory}
        className={`lg:col-span-4 border p-5 rounded-xl space-y-4 ${
          isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-gray-200 bg-gray-50/70 text-gray-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <h3 className="text-sm font-black uppercase flex items-center gap-2">
            <Tag className="w-4 h-4" />
            {editingCategory ? `Editar Categoría #${editingCategory.idCategoriaGasto}` : 'Nueva Categoría de Gasto'}
          </h3>
          {editingCategory && (
            <button
              type="button"
              onClick={resetCategoryForm}
              className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>

        {categoryError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
            {categoryError}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase mb-1">Nombre del Rubro / Categoría *</label>
          <input
            type="text"
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            placeholder="Ej: INSUMOS TEXTILES, PACKAGING, LOGÍSTICA..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase mb-1">Descripción</label>
          <textarea
            rows={3}
            value={descripcionCategoria}
            onChange={(e) => setDescripcionCategoria(e.target.value)}
            placeholder="Detalle de qué gastos agrupa esta categoría..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {editingCategory && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold uppercase">Estado de la Categoría</span>
            <button
              type="button"
              onClick={() => setCategoryActivo(!categoryActivo)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                categoryActivo
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-500 border-red-500/30'
              }`}
            >
              {categoryActivo ? 'ACTIVA' : 'INACTIVA'}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isSavingCategory}
          className={`w-full py-2.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            isDarkMode
              ? 'bg-slate-100 text-slate-900 hover:bg-white'
              : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {editingCategory ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingCategory ? 'Guardar Cambios' : 'Crear Categoría de Gasto'}
        </button>
      </form>

      {/* TABLA DE CATEGORÍAS DE GASTO (8 COLS) */}
      <div className="lg:col-span-8 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase">
              CATEGORÍAS DE GASTO ({filteredCategories.length} DE {expenseCategories.length})
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Tabla maestra `categorias_gasto` en PostgreSQL para clasificar egresos
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar categoría de gasto..."
              className={`${inputClass} pr-8`}
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        <div
          className={`border rounded-xl overflow-hidden ${
            isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-white'
          }`}
        >
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead
              className={`uppercase text-[10px] font-black border-b ${
                isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <tr>
                <th className="p-3 w-16">ID</th>
                <th className="p-3">CATEGORÍA</th>
                <th className="p-3">DESCRIPCIÓN</th>
                <th className="p-3 text-center">ESTADO</th>
                <th className="p-3 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    No hay categorías de gasto registradas todavía.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.idCategoriaGasto} className={isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'}>
                    <td className="p-3 font-mono font-bold text-amber-500">#{cat.idCategoriaGasto}</td>
                    <td className="p-3 font-bold uppercase">{cat.nombreCategoria}</td>
                    <td className="p-3 text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 shrink-0" />
                        {cat.descripcion || 'Sin descripción'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          cat.activo !== false
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-500 border-red-500/30'
                        }`}
                      >
                        {cat.activo !== false ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditCategoryClick(cat)}
                          className="p-1.5 rounded hover:bg-slate-800/50 text-blue-500 cursor-pointer"
                          title="Editar categoría"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`p-1.5 rounded cursor-pointer ${
                            cat.activo !== false ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={cat.activo !== false ? 'Desactivar categoría' : 'Reactivar categoría'}
                        >
                          {cat.activo !== false ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

