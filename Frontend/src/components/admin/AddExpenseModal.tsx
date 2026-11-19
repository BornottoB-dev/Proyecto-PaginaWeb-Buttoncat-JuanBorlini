import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, DollarSign, Upload, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { ValidationModal } from '../ui/ValidationModal';
import { uploadApi } from '../../services/api';

export interface AdminExpense {
  id: string;
  supplierId?: number;
  supplier: string;
  categoryId?: number;
  category: string;
  description: string;
  amount: number;
  paymentMethodId?: number;
  paymentMethod: string;
  receiptUrl?: string;
  date: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: AdminExpense) => void;
  expenseToEdit?: AdminExpense | null;
  suppliers?: Array<{ idProveedor: number; razonSocial: string; cuit?: string; activo?: boolean }>;
  expenseCategories?: Array<{ idCategoriaGasto: number; nombreCategoria: string; descripcion?: string; activo?: boolean }>;
  paymentMethods?: Array<{ idMetodoPago: number; nombreMetodoPago: string; activo?: boolean }>;
  isDarkMode?: boolean;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  suppliers = [],
  expenseCategories = [],
  paymentMethods = [],
  isDarkMode = false,
}) => {
  const activeSuppliers = suppliers.filter((s) => s.activo !== false);
  const activeCategories = expenseCategories.filter((c) => c.activo !== false);
  const activePaymentMethods = paymentMethods.filter((m) => m.activo !== false);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('INSUMOS');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('DIGITAL');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
    if (expenseToEdit) {
      const matchedSup = activeSuppliers.find(
        (s) =>
          (expenseToEdit.supplierId && s.idProveedor === expenseToEdit.supplierId) ||
          s.razonSocial.toUpperCase() === expenseToEdit.supplier.toUpperCase()
      );
      if (matchedSup) {
        setSelectedSupplierId(String(matchedSup.idProveedor));
        setSupplier(matchedSup.razonSocial);
      } else {
        setSelectedSupplierId('NEW');
        setSupplier(expenseToEdit.supplier);
      }
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount);
      setPaymentMethod(expenseToEdit.paymentMethod || 'DIGITAL');
      setReceiptUrl(expenseToEdit.receiptUrl || '');
    } else {
      if (activeSuppliers.length > 0) {
        setSelectedSupplierId(String(activeSuppliers[0].idProveedor));
        setSupplier(activeSuppliers[0].razonSocial);
      } else {
        setSelectedSupplierId('NEW');
        setSupplier('');
      }
      setCategory(activeCategories.length > 0 ? activeCategories[0].nombreCategoria : 'INSUMOS');
      setDescription('');
      setAmount('');
      setPaymentMethod(activePaymentMethods.length > 0 ? activePaymentMethods[0].nombreMetodoPago : 'DIGITAL');
      setReceiptUrl('');
    }
  }, [expenseToEdit, isOpen, suppliers.length, expenseCategories.length, paymentMethods.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationModalMsg(null);
    if (!supplier.trim() || !description.trim() || !amount) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
      return;
    }

    const matchedSup =
      selectedSupplierId !== 'NEW'
        ? activeSuppliers.find((s) => String(s.idProveedor) === selectedSupplierId)
        : activeSuppliers.find((s) => s.razonSocial.toUpperCase() === supplier.trim().toUpperCase());

    const matchedCat = activeCategories.find(
      (c) => c.nombreCategoria.toUpperCase() === category.toUpperCase()
    );

    const matchedMethod = activePaymentMethods.find(
      (m) => m.nombreMetodoPago.toUpperCase() === paymentMethod.toUpperCase()
    );

    const expenseData: AdminExpense = {
      id: expenseToEdit ? expenseToEdit.id : 'NEW',
      supplierId: matchedSup?.idProveedor,
      supplier: matchedSup ? matchedSup.razonSocial : supplier.trim(),
      categoryId: matchedCat?.idCategoriaGasto,
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethodId: matchedMethod?.idMetodoPago,
      paymentMethod,
      receiptUrl: receiptUrl.trim() || undefined,
      date: expenseToEdit ? expenseToEdit.date : new Date().toLocaleDateString('es-AR'),
    };

    onSave(expenseData);
    onClose();
  };

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
        className={`w-full max-w-lg my-auto rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col ${
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
              <DollarSign className="w-5 h-5 text-gray-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className={`text-base font-bold uppercase tracking-wide ${
                isDarkMode ? 'text-slate-100' : 'text-gray-900'
              }`}>
                {expenseToEdit ? `EDITAR GASTO #${expenseToEdit.id}` : 'REGISTRAR NUEVO GASTO'}
              </h2>
              <p className={`text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Gestión Financiera de Proveedores y Servicios
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
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-expense-supplier-select" className={labelClass}>
              PROVEEDOR REGISTRADO *
            </label>
            <select
              id="admin-expense-supplier-select"
              name="selectedSupplierId"
              aria-label="Seleccionar Proveedor Registrado"
              value={selectedSupplierId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSupplierId(val);
                if (val === 'NEW') {
                  setSupplier('');
                } else {
                  const found = activeSuppliers.find((s) => String(s.idProveedor) === val);
                  if (found) setSupplier(found.razonSocial);
                }
              }}
              className={`${inputClass} cursor-pointer`}
            >
              {activeSuppliers.map((s) => (
                <option key={s.idProveedor} value={String(s.idProveedor)}>
                  [#{s.idProveedor}] {s.razonSocial}{s.cuit ? ` (CUIT: ${s.cuit})` : ''}
                </option>
              ))}
              <option value="NEW">+ Ingresar Nuevo Proveedor Manualmente</option>
            </select>

            {selectedSupplierId === 'NEW' && (
              <input
                id="admin-expense-supplier"
                name="expenseSupplier"
                aria-label="Razón Social del nuevo proveedor"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ej: Distribuidora Textil Quilmes (se registrará en Proveedores)"
                className={inputClass}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-expense-category" className={labelClass}>
                CATEGORÍA DE GASTO
              </label>
              <select
                id="admin-expense-category"
                name="expenseCategory"
                aria-label="Categoría de Gasto"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {activeCategories.length > 0 ? (
                  activeCategories.map((c) => (
                    <option key={c.idCategoriaGasto} value={c.nombreCategoria}>
                      {c.nombreCategoria.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="INSUMOS">INSUMOS / MATERIA PRIMA</option>
                    <option value="PACKAGING">PACKAGING Y CAJAS</option>
                    <option value="LOGISTICA">LOGÍSTICA / ENVÍOS</option>
                    <option value="SERVICIOS">SERVICIOS DE TALLER</option>
                    <option value="MAQUINARIA">MANTENIMIENTO / MAQUINARIA</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="admin-expense-payment-method" className={labelClass}>
                MÉTODO DE PAGO
              </label>
              <select
                id="admin-expense-payment-method"
                name="expensePaymentMethod"
                aria-label="Método de Pago"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {activePaymentMethods.length > 0 ? (
                  activePaymentMethods.map((m) => (
                    <option key={m.idMetodoPago} value={m.nombreMetodoPago}>
                      {m.nombreMetodoPago.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="DIGITAL">DINERO DIGITAL</option>
                    <option value="EFECTIVO">DINERO FÍSICO / EFECTIVO</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="admin-expense-amount" className={labelClass}>
              MONTO TOTAL ($ ARS) *
            </label>
            <input
              id="admin-expense-amount"
              name="expenseAmount"
              aria-label="Monto Total ARS"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="35000.00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="admin-expense-description" className={labelClass}>
              CONCEPTO / DETALLE DEL GASTO *
            </label>
            <textarea
              id="admin-expense-description"
              name="expenseDescription"
              aria-label="Concepto o Detalle del Gasto"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de 50m de tela algodón peinado negro..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>COMPROBANTE / FACTURA (OPCIONAL)</label>
            <div className="flex items-center gap-2">
              <label
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0 ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
              >
                {isUploadingReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> {receiptUrl ? 'Cambiar Comprobante' : 'Adjuntar Comprobante'}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={isUploadingReceipt}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploadingReceipt(true);
                    try {
                      const uploaded = await uploadApi.uploadImageWithFallback(file, 'buttoncat/expenses');
                      if (uploaded) setReceiptUrl(uploaded);
                    } finally {
                      setIsUploadingReceipt(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              {receiptUrl && (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-500 hover:underline truncate inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Ver comprobante
                  </a>
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Quitar comprobante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`px-6 py-4 flex items-center justify-between border-t shrink-0 -mx-6 -mb-6 mt-6 ${
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
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-100 text-slate-900 hover:bg-white'
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {expenseToEdit ? (
                <>
                  <Save className="w-4 h-4" /> Guardar Cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Registrar Gasto
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!validationModalMsg}
        title="CAMPO OBLIGATORIO REQUERIDO"
        message={validationModalMsg || ''}
        onClose={() => setValidationModalMsg(null)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
