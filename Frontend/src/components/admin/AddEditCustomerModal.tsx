import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Users, AlertTriangle, MapPin, Plus, Trash2, Phone, FileText } from 'lucide-react';
import type { AdminCustomer, CustomerAddress } from '../../types/types';
export type { AdminCustomer, CustomerAddress };

interface AddEditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: AdminCustomer) => void;
  customerToEdit?: AdminCustomer | null;
  isDarkMode?: boolean;
}

export const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
  isDarkMode = false,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CLIENTE');
  const [points, setPoints] = useState<number | ''>(100);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  
  // Lista de domicilios asociados
  const [addressesList, setAddressesList] = useState<CustomerAddress[]>([]);
  
  // Campos para agregar nuevo domicilio
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newZip, setNewZip] = useState('');

  const [validationModalMsg, setValidationModalMsg] = useState<string | null>(null);

  useEffect(() => {
    setValidationModalMsg(null);
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setEmail(customerToEdit.email || '');
      setPhone(customerToEdit.phone || '');
      setRole(customerToEdit.role || 'CLIENTE');
      setPoints(customerToEdit.points ?? 100);
      setAddress(customerToEdit.address || '');
      setCity(customerToEdit.city || '');
      setProvince(customerToEdit.province || '');
      setPostalCode(customerToEdit.postalCode || '');
      setNotes(customerToEdit.notes || '');
      setAddressesList(customerToEdit.addresses || [
        ...(customerToEdit.address ? [{
          id: 'addr-1',
          street: customerToEdit.address,
          city: customerToEdit.city || 'CABA',
          province: customerToEdit.province || 'Ciudad Autónoma de Buenos Aires',
          postalCode: customerToEdit.postalCode || '1000',
          isDefault: true,
        }] : [])
      ]);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('CLIENTE');
      setPoints(100);
      setAddress('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setNotes('');
      setAddressesList([]);
    }
    setNewStreet('');
    setNewCity('');
    setNewProvince('');
    setNewZip('');
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddAddress = () => {
    if (!newStreet.trim()) {
      setValidationModalMsg('POR FAVOR, INGRESA AL MENOS LA CALLE Y ALTURA DEL NUEVO DOMICILIO.');
      return;
    }
    const newAddr: CustomerAddress = {
      id: `addr-${Date.now()}`,
      street: newStreet.trim(),
      city: newCity.trim() || 'CABA',
      province: newProvince.trim() || 'Buenos Aires',
      postalCode: newZip.trim() || '1000',
      isDefault: addressesList.length === 0,
    };

    const updated = [...addressesList, newAddr];
    setAddressesList(updated);
    if (!address) {
      setAddress(newAddr.street);
      setCity(newAddr.city);
      setProvince(newAddr.province);
      setPostalCode(newAddr.postalCode);
    }

    setNewStreet('');
    setNewCity('');
    setNewProvince('');
    setNewZip('');
    setValidationModalMsg(null);
  };

  const handleRemoveAddress = (id: string) => {
    setAddressesList(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationModalMsg(null);
    if (!name.trim() || !email.trim()) {
      setValidationModalMsg('POR FAVOR, COMPLETA TODOS LOS CAMPOS OBLIGATORIOS (*).');
      return;
    }

    if (email.trim() && (!email.includes('@') || !email.includes('.'))) {
      setValidationModalMsg('POR FAVOR, INGRESA UN CORREO ELECTRÓNICO VÁLIDO (DEBE CONTENER "@" Y UN DOMINIO).');
      return;
    }

    const customerData: AdminCustomer = {
      id: customerToEdit ? customerToEdit.id : `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      ordersCount: customerToEdit ? customerToEdit.ordersCount : 0,
      totalSpent: customerToEdit ? customerToEdit.totalSpent : 0,
      points: points ? Number(points) : 0,
      joinedDate: customerToEdit ? customerToEdit.joinedDate : new Date().toISOString().split('T')[0],
      address: address.trim() || (addressesList[0]?.street) || undefined,
      city: city.trim() || (addressesList[0]?.city) || undefined,
      province: province.trim() || (addressesList[0]?.province) || undefined,
      postalCode: postalCode.trim() || (addressesList[0]?.postalCode) || undefined,
      notes: notes.trim() || undefined,
      addresses: addressesList,
    };

    onSave(customerData);
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in font-sans ${
        isDarkMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-xs'
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl my-auto rounded-2xl border-4 border-black shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="bg-brand-yellow text-black p-3.5 sm:p-5 border-b-4 border-black shrink-0 shadow-brutal-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-brand-yellow flex items-center justify-center border-2 border-black shadow-brutal-xs shrink-0">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight font-display text-black">
                {customerToEdit ? 'EDITAR FICHA DE CLIENTE' : 'REGISTRAR NUEVO CLIENTE'}
              </h2>
              <p className="text-[11px] font-black text-black/80 uppercase tracking-wide">
                BASE DE CLIENTES • BUTTONCAT STUDIO ADMIN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-black text-white hover:bg-brand-pink border-2 border-black p-2 font-black uppercase text-xs flex items-center gap-2 transition-all shadow-brutal-xs cursor-pointer shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* FORM */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-bold max-h-[80vh] overflow-y-auto">
          
          {/* UNIFIED ERROR MESSAGE BANNER */}
          {validationModalMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 border ${
              isDarkMode ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{validationModalMsg}</span>
            </div>
          )}

          {/* DATOS PERSONALES PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                NOMBRE Y APELLIDO *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Luciana Gomez"
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                }`}
              />
            </div>

            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                CORREO ELECTRÓNICO *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                }`}
              />
            </div>

            <div>
              <label className={`font-extrabold uppercase mb-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Phone className="w-3.5 h-3.5 text-blue-500" /> TELÉFONO DE CONTACTO
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 9876-5432"
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                }`}
              />
            </div>

            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                ROL / RANGO DE CLIENTE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-800 shadow-xs'
                }`}
              >
                <option value="CLIENTE">CLIENTE ESTÁNDAR</option>
                <option value="CLIENTE VIP">CLIENTE VIP</option>
              </select>
            </div>

            <div>
              <label className={`block font-extrabold uppercase mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                PUNTOS ACUMULADOS
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="100"
                className={`w-full rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none border transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
                }`}
              />
            </div>
          </div>

          {/* SECCIÓN DOMICILIOS DEL CLIENTE */}
          <div className={`p-4 border rounded-xl space-y-3 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-black uppercase flex items-center gap-1.5 ${
                isDarkMode ? 'text-emerald-400' : 'text-gray-900'
              }`}>
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> DOMICILIOS Y DIRECCIONES VINCULADAS ({addressesList.length})
              </span>
            </div>

            {/* LISTA DE DOMICILIOS EXISTENTES */}
            {addressesList.length > 0 && (
              <div className="space-y-2">
                {addressesList.map((addr) => (
                  <div key={addr.id} className={`p-3 border rounded-lg flex items-center justify-between gap-3 text-xs ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200 shadow-xs'
                  }`}>
                    <div className="space-y-0.5">
                      <span className={`font-bold block ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        {addr.street} {addr.isDefault && <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded ml-1">PRINCIPAL</span>}
                      </span>
                      <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {addr.city}, {addr.province} (CP {addr.postalCode})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddress(addr.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                      title="Eliminar domicilio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* FORMULARIO RÁPIDO PARA AGREGAR NUEVO DOMICILIO */}
            <div className={`p-3 border rounded-lg space-y-2.5 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-gray-300 shadow-xs'
            }`}>
              <span className={`text-[11px] font-extrabold uppercase block ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                + AGREGAR UN NUEVO DOMICILIO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Calle y Número (Ej: Av. Corrientes 1234, 4B)"
                  className={`w-full rounded-md p-2 text-xs font-medium focus:outline-none border ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ciudad / Localidad (Ej: Palermo / CABA)"
                  className={`w-full rounded-md p-2 text-xs font-medium focus:outline-none border ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <input
                  type="text"
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  placeholder="Provincia (Ej: Buenos Aires)"
                  className={`w-full rounded-md p-2 text-xs font-medium focus:outline-none border ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newZip}
                    onChange={(e) => setNewZip(e.target.value)}
                    placeholder="Código Postal (Ej: C1043)"
                    className={`w-full rounded-md p-2 text-xs font-medium focus:outline-none border ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase cursor-pointer shrink-0 border transition-all ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> VINCULAR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES / NOTAS INTERNAS */}
          <div>
            <label className={`font-extrabold uppercase mb-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <FileText className="w-3.5 h-3.5 text-amber-500" /> NOTAS U OBSERVACIONES INTERNAS
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas de preferencias del cliente, empaque especial, talle habitual..."
              className={`w-full rounded-lg p-2.5 text-xs font-medium focus:outline-none border transition-colors ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-slate-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-800 shadow-xs'
              }`}
            />
          </div>

          {/* ACTIONS FOOTER */}
          <div className={`px-6 py-4 flex items-center justify-between border-t-4 border-black -mx-6 -mb-6 mt-6 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-yellow-50 border-black'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-brutal-xs transition-all cursor-pointer ${
                isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-yellow text-black hover:bg-brand-pink hover:text-white border-2 border-black font-black text-xs uppercase shadow-brutal-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {customerToEdit ? (
                <>
                  <Save className="w-4 h-4" /> GUARDAR CAMBIOS
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> CREAR CLIENTE
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
