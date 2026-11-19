import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard, Plus, Edit, Trash2, Check, X, Search, RotateCcw } from 'lucide-react';
import { locationsApi, paymentsRewardsApi } from '../../services/api';

export interface ProvinciaRecord {
  idProvincia: number;
  provincia: string;
  _count?: { localidades: number };
}

export interface LocalidadRecord {
  idLocalidad: number;
  idProvincia: number;
  localidad: string;
  provincia?: { idProvincia: number; provincia: string };
}

export interface PaymentMethodRecord {
  idMetodoPago: number;
  nombreMetodoPago: string;
  porcentajeDescuento: number;
  datosBancarios?: string | null;
  activo: boolean;
}

interface AdminGeneralTablesManagerProps {
  activeSubSection: 'geography' | 'payments';
  paymentMethods: PaymentMethodRecord[];
  onPaymentMethodsChange: (methods: PaymentMethodRecord[]) => void;
  isDarkMode?: boolean;
}

export const AdminGeneralTablesManager: React.FC<AdminGeneralTablesManagerProps> = ({
  activeSubSection,
  paymentMethods,
  onPaymentMethodsChange,
  isDarkMode = false,
}) => {
  // Geography state
  const [provincias, setProvincias] = useState<ProvinciaRecord[]>([]);
  const [localidades, setLocalidades] = useState<LocalidadRecord[]>([]);
  const [selectedProvinciaFilter, setSelectedProvinciaFilter] = useState<number | 'ALL'>('ALL');
  const [geoSearch, setGeoSearch] = useState('');

  const [editingProvincia, setEditingProvincia] = useState<ProvinciaRecord | null>(null);
  const [provinciaName, setProvinciaName] = useState('');
  const [provinciaError, setProvinciaError] = useState<string | null>(null);

  const [editingLocalidad, setEditingLocalidad] = useState<LocalidadRecord | null>(null);
  const [localidadProvinciaId, setLocalidadProvinciaId] = useState<number | ''>('');
  const [localidadName, setLocalidadName] = useState('');
  const [localidadError, setLocalidadError] = useState<string | null>(null);

  // Payment methods state
  const [editingPayment, setEditingPayment] = useState<PaymentMethodRecord | null>(null);
  const [nombreMetodoPago, setNombreMetodoPago] = useState('');
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number | ''>(0);
  const [datosBancarios, setDatosBancarios] = useState('');
  const [paymentActivo, setPaymentActivo] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadGeography = async () => {
    const [provRes, locRes] = await Promise.all([
      locationsApi.getProvincias(),
      locationsApi.getLocalidades(),
    ]);
    if (provRes.success && provRes.data) {
      setProvincias(provRes.data);
      if (provRes.data.length > 0 && localidadProvinciaId === '') {
        setLocalidadProvinciaId(provRes.data[0].idProvincia);
      }
    }
    if (locRes.success && locRes.data) {
      setLocalidades(locRes.data);
    }
  };

  useEffect(() => {
    loadGeography();
  }, []);

  // --- Provincia Handlers ---
  const handleSaveProvincia = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvinciaError(null);
    if (!provinciaName.trim()) {
      setProvinciaError('Ingresa el nombre de la provincia.');
      return;
    }

    try {
      if (editingProvincia) {
        const res = await locationsApi.updateProvincia(editingProvincia.idProvincia, provinciaName.trim());
        if (res.success && res.data) {
          await loadGeography();
          setEditingProvincia(null);
          setProvinciaName('');
        } else {
          setProvinciaError(res.error || 'No se pudo actualizar la provincia.');
        }
      } else {
        const res = await locationsApi.createProvincia(provinciaName.trim());
        if (res.success && res.data) {
          await loadGeography();
          setProvinciaName('');
        } else {
          setProvinciaError(res.error || 'No se pudo crear la provincia.');
        }
      }
    } catch (err) {
      console.error('[SaveProvincia Error]:', err);
      setProvinciaError('Error al guardar provincia.');
    }
  };

  const handleDeleteProvincia = async (idProvincia: number) => {
    try {
      const res = await locationsApi.deleteProvincia(idProvincia);
      if (res.success) {
        await loadGeography();
        if (selectedProvinciaFilter === idProvincia) setSelectedProvinciaFilter('ALL');
      } else {
        setProvinciaError(res.error || 'No se puede eliminar una provincia con localidades asociadas.');
      }
    } catch (err) {
      console.error('[DeleteProvincia Error]:', err);
    }
  };

  // --- Localidad Handlers ---
  const handleSaveLocalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalidadError(null);
    const targetProvId = Number(localidadProvinciaId);
    if (!targetProvId || !localidadName.trim()) {
      setLocalidadError('Selecciona una provincia e ingresa el nombre de la localidad.');
      return;
    }

    try {
      if (editingLocalidad) {
        const res = await locationsApi.updateLocalidad(editingLocalidad.idLocalidad, {
          idProvincia: targetProvId,
          localidad: localidadName.trim(),
        });
        if (res.success && res.data) {
          await loadGeography();
          setEditingLocalidad(null);
          setLocalidadName('');
        } else {
          setLocalidadError(res.error || 'No se pudo actualizar la localidad.');
        }
      } else {
        const res = await locationsApi.createLocalidad(targetProvId, localidadName.trim());
        if (res.success && res.data) {
          await loadGeography();
          setLocalidadName('');
        } else {
          setLocalidadError(res.error || 'No se pudo crear la localidad.');
        }
      }
    } catch (err) {
      console.error('[SaveLocalidad Error]:', err);
      setLocalidadError('Error al guardar localidad.');
    }
  };

  const handleDeleteLocalidad = async (idLocalidad: number) => {
    try {
      const res = await locationsApi.deleteLocalidad(idLocalidad);
      if (res.success) {
        await loadGeography();
      } else {
        setLocalidadError(res.error || 'No se puede eliminar una localidad vinculada a domicilios.');
      }
    } catch (err) {
      console.error('[DeleteLocalidad Error]:', err);
    }
  };

  // --- Payment Method Handlers ---
  const resetPaymentForm = () => {
    setEditingPayment(null);
    setNombreMetodoPago('');
    setPorcentajeDescuento(0);
    setDatosBancarios('');
    setPaymentActivo(true);
    setPaymentError(null);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!nombreMetodoPago.trim()) {
      setPaymentError('Ingresa el nombre del método de pago.');
      return;
    }

    try {
      if (editingPayment) {
        const res = await paymentsRewardsApi.updatePaymentMethod(editingPayment.idMetodoPago, {
          nombreMetodoPago: nombreMetodoPago.trim(),
          porcentajeDescuento: Number(porcentajeDescuento) || 0,
          datosBancarios: datosBancarios.trim() || undefined,
          activo: paymentActivo,
        });
        if (res.success && res.data) {
          onPaymentMethodsChange(
            paymentMethods.map((m) =>
              m.idMetodoPago === editingPayment.idMetodoPago ? { ...m, ...res.data } : m
            )
          );
          resetPaymentForm();
        } else {
          setPaymentError(res.error || 'No se pudo actualizar el método de pago.');
        }
      } else {
        const res = await paymentsRewardsApi.createPaymentMethod({
          nombreMetodoPago: nombreMetodoPago.trim(),
          porcentajeDescuento: Number(porcentajeDescuento) || 0,
          datosBancarios: datosBancarios.trim() || undefined,
        });
        if (res.success && res.data) {
          onPaymentMethodsChange([...paymentMethods, res.data]);
          resetPaymentForm();
        } else {
          setPaymentError(res.error || 'No se pudo crear el método de pago.');
        }
      }
    } catch (err) {
      console.error('[SavePaymentMethod Error]:', err);
      setPaymentError('Error al guardar método de pago.');
    }
  };

  const handleTogglePaymentActive = async (method: PaymentMethodRecord) => {
    try {
      if (method.activo !== false) {
        const res = await paymentsRewardsApi.deletePaymentMethod(method.idMetodoPago);
        if (res.success) {
          onPaymentMethodsChange(
            paymentMethods.map((m) =>
              m.idMetodoPago === method.idMetodoPago ? { ...m, activo: false } : m
            )
          );
        }
      } else {
        const res = await paymentsRewardsApi.updatePaymentMethod(method.idMetodoPago, { activo: true });
        if (res.success && res.data) {
          onPaymentMethodsChange(
            paymentMethods.map((m) =>
              m.idMetodoPago === method.idMetodoPago ? { ...m, ...res.data } : m
            )
          );
        }
      }
    } catch (err) {
      console.error('[TogglePaymentActive Error]:', err);
    }
  };

  const inputClass = `w-full rounded-lg px-3 py-2 text-xs font-medium border focus:outline-none ${
    isDarkMode
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-slate-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900'
  }`;

  // 1. VISTA GEOGRAFÍA: PROVINCIAS Y LOCALIDADES
  if (activeSubSection === 'geography') {
    const filteredLocalidades = localidades.filter((loc) => {
      if (selectedProvinciaFilter !== 'ALL' && loc.idProvincia !== selectedProvinciaFilter) {
        return false;
      }
      if (!geoSearch.trim()) return true;
      const q = geoSearch.toLowerCase();
      return (
        loc.localidad.toLowerCase().includes(q) ||
        loc.provincia?.provincia?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: PROVINCIAS (5 COLS) */}
        <div
          className={`lg:col-span-5 border p-5 rounded-xl space-y-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="border-b pb-3 border-inherit">
            <h3 className="text-sm font-black uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4" /> TABLA DE PROVINCIAS ({provincias.length})
            </h3>
            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Tabla `provincias` utilizada en domicilios y logística
            </p>
          </div>

          <form onSubmit={handleSaveProvincia} className="space-y-2.5">
            {provinciaError && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                {provinciaError}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={provinciaName}
                onChange={(e) => setProvinciaName(e.target.value)}
                placeholder="Ej: Buenos Aires, Córdoba, Santa Fe..."
                className={inputClass}
              />
              <button
                type="submit"
                className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase shrink-0 flex items-center gap-1 cursor-pointer ${
                  isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {editingProvincia ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {editingProvincia ? 'Guardar' : 'Agregar'}
              </button>
              {editingProvincia && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProvincia(null);
                    setProvinciaName('');
                  }}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div
            className={`border rounded-xl overflow-hidden max-h-96 overflow-y-auto ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50/40'
            }`}
          >
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead
                className={`uppercase text-[10px] font-black border-b sticky top-0 ${
                  isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <tr>
                  <th className="p-2.5 w-14">ID</th>
                  <th className="p-2.5">PROVINCIA</th>
                  <th className="p-2.5 text-center">LOCALIDADES</th>
                  <th className="p-2.5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-200'}`}>
                {provincias.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                      No hay provincias cargadas.
                    </td>
                  </tr>
                ) : (
                  provincias.map((prov) => {
                    const isSelected = selectedProvinciaFilter === prov.idProvincia;
                    const locCount = localidades.filter((l) => l.idProvincia === prov.idProvincia).length;
                    return (
                      <tr
                        key={prov.idProvincia}
                        onClick={() => {
                          setSelectedProvinciaFilter(isSelected ? 'ALL' : prov.idProvincia);
                          setLocalidadProvinciaId(prov.idProvincia);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-emerald-950/30 text-emerald-300'
                              : 'bg-emerald-50 text-emerald-950'
                            : isDarkMode
                            ? 'hover:bg-slate-900'
                            : 'hover:bg-white'
                        }`}
                      >
                        <td className="p-2.5 font-mono font-bold text-amber-500">#{prov.idProvincia}</td>
                        <td className="p-2.5 font-bold">{prov.provincia}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-500/15">
                            {locCount} loc.
                          </span>
                        </td>
                        <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProvincia(prov);
                                setProvinciaName(prov.provincia);
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer"
                              title="Editar provincia"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProvincia(prov.idProvincia)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                              title="Eliminar provincia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: LOCALIDADES (7 COLS) */}
        <div
          className={`lg:col-span-7 border p-5 rounded-xl space-y-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-inherit">
            <div>
              <h3 className="text-sm font-black uppercase flex items-center gap-2">
                <MapPin className="w-4 h-4" /> TABLA DE LOCALIDADES ({filteredLocalidades.length} DE {localidades.length})
              </h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Tabla `localidades` vinculada por clave foránea a `provincias`
              </p>
            </div>
            {selectedProvinciaFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedProvinciaFilter('ALL')}
                className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
              >
                Ver todas las provincias
              </button>
            )}
          </div>

          <form onSubmit={handleSaveLocalidad} className="space-y-2.5">
            {localidadError && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                {localidadError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <select
                  value={localidadProvinciaId}
                  onChange={(e) => setLocalidadProvinciaId(e.target.value ? Number(e.target.value) : '')}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">-- Provincia --</option>
                  {provincias.map((p) => (
                    <option key={p.idProvincia} value={p.idProvincia}>
                      {p.provincia}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={localidadName}
                  onChange={(e) => setLocalidadName(e.target.value)}
                  placeholder="Nombre de localidad (ej: Quilmes, Palermo...)"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2 flex gap-1">
                <button
                  type="submit"
                  className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1 cursor-pointer ${
                    isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {editingLocalidad ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingLocalidad ? 'OK' : 'Crear'}
                </button>
                {editingLocalidad && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocalidad(null);
                      setLocalidadName('');
                    }}
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="relative">
            <input
              type="text"
              value={geoSearch}
              onChange={(e) => setGeoSearch(e.target.value)}
              placeholder="Filtrar localidad o provincia..."
              className={`${inputClass} pr-8`}
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
          </div>

          <div
            className={`border rounded-xl overflow-hidden max-h-80 overflow-y-auto ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50/40'
            }`}
          >
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead
                className={`uppercase text-[10px] font-black border-b sticky top-0 ${
                  isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <tr>
                  <th className="p-2.5 w-14">ID</th>
                  <th className="p-2.5">LOCALIDAD</th>
                  <th className="p-2.5">PROVINCIA</th>
                  <th className="p-2.5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-200'}`}>
                {filteredLocalidades.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 font-bold">
                      No hay localidades registradas para el filtro actual.
                    </td>
                  </tr>
                ) : (
                  filteredLocalidades.map((loc) => {
                    const provObj = provincias.find((p) => p.idProvincia === loc.idProvincia);
                    return (
                      <tr key={loc.idLocalidad} className={isDarkMode ? 'hover:bg-slate-900' : 'hover:bg-white'}>
                        <td className="p-2.5 font-mono font-bold text-amber-500">#{loc.idLocalidad}</td>
                        <td className="p-2.5 font-bold">{loc.localidad}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15">
                            {loc.provincia?.provincia || provObj?.provincia || `#${loc.idProvincia}`}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocalidad(loc);
                                setLocalidadProvinciaId(loc.idProvincia);
                                setLocalidadName(loc.localidad);
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer"
                              title="Editar localidad"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLocalidad(loc.idLocalidad)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                              title="Eliminar localidad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. VISTA MÉTODOS DE PAGO
  if (activeSubSection === 'payments') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* FORMULARIO MÉTODO DE PAGO (4 COLS) */}
        <form
          onSubmit={handleSavePaymentMethod}
          className={`lg:col-span-4 border p-5 rounded-xl space-y-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-inherit">
            <h3 className="text-sm font-black uppercase flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {editingPayment ? `Editar Método #${editingPayment.idMetodoPago}` : 'Nuevo Método de Pago'}
            </h3>
            {editingPayment && (
              <button
                type="button"
                onClick={resetPaymentForm}
                className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>

          {paymentError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
              {paymentError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Nombre del Método de Pago *</label>
            <input
              type="text"
              value={nombreMetodoPago}
              onChange={(e) => setNombreMetodoPago(e.target.value)}
              placeholder="Ej: Transferencia Bancaria, Mercado Pago, Efectivo..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Porcentaje de Descuento (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={porcentajeDescuento}
              onChange={(e) => setPorcentajeDescuento(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej: 10 (para 10% OFF en Checkout)"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase mb-1">Datos Bancarios / Alias / CBU</label>
            <textarea
              rows={3}
              value={datosBancarios}
              onChange={(e) => setDatosBancarios(e.target.value)}
              placeholder="Ej: Alias: BUTTONCAT.TIENDA | CBU: 00000031000..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {editingPayment && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold uppercase">Estado</span>
              <button
                type="button"
                onClick={() => setPaymentActivo(!paymentActivo)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  paymentActivo
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-500 border-red-500/30'
                }`}
              >
                {paymentActivo ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
              isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {editingPayment ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingPayment ? 'Guardar Cambios' : 'Crear Método de Pago'}
          </button>
        </form>

        {/* TABLA DE MÉTODOS DE PAGO (8 COLS) */}
        <div
          className={`lg:col-span-8 border p-5 rounded-xl space-y-4 ${
            isDarkMode ? 'border-slate-800 bg-slate-900/90 text-slate-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div className="border-b pb-3 border-inherit">
            <h3 className="text-sm font-black uppercase">
              MÉTODOS DE PAGO Y DESCUENTOS ({paymentMethods.length})
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Tabla maestra `metodos_pago` en PostgreSQL utilizada en Pedidos, Checkout y Gastos
            </p>
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
                  <th className="p-3">MÉTODO DE PAGO</th>
                  <th className="p-3 text-center">% DESCUENTO</th>
                  <th className="p-3">DATOS BANCARIOS / ALIAS</th>
                  <th className="p-3 text-center">ESTADO</th>
                  <th className="p-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {paymentMethods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      No hay métodos de pago registrados.
                    </td>
                  </tr>
                ) : (
                  paymentMethods.map((m) => (
                    <tr key={m.idMetodoPago} className={isDarkMode ? 'hover:bg-slate-900/60' : 'hover:bg-gray-50'}>
                      <td className="p-3 font-mono font-bold text-amber-500">#{m.idMetodoPago}</td>
                      <td className="p-3 font-bold uppercase">{m.nombreMetodoPago}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-500/15 text-emerald-500 font-bold">
                          {Number(m.porcentajeDescuento || 0)}% OFF
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-56 truncate">
                        {m.datosBancarios || 'No aplica'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            m.activo !== false
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-500 border-red-500/30'
                          }`}
                        >
                          {m.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(m);
                              setNombreMetodoPago(m.nombreMetodoPago);
                              setPorcentajeDescuento(Number(m.porcentajeDescuento || 0));
                              setDatosBancarios(m.datosBancarios || '');
                              setPaymentActivo(m.activo !== false);
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded cursor-pointer"
                            title="Editar método de pago"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentActive(m)}
                            className={`p-1.5 rounded cursor-pointer ${
                              m.activo !== false ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                            title={m.activo !== false ? 'Desactivar' : 'Reactivar'}
                          >
                            {m.activo !== false ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
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

  return null;
};

