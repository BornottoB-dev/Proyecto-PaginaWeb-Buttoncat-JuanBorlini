import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User as UserIcon, Sparkles, LogIn, UserPlus, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { User } from '../../types/types';
import { Button } from '../ui/Button';
import { ValidationModal } from '../ui/ValidationModal';
import { authApi } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

// STANDARD EMAIL REGEX VALIDATION (Requires format user@domain.tld with at least 2 characters TLD, rejecting invalid forms like demo@demo)
const isValidEmail = (email: string): boolean => {
  const cleanEmail = email.trim().toLowerCase();
  // Validates standard name@domain.tld structure with any valid 2+ character TLD (e.g. .com, .com.ar, .org, .tech)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleanEmail);
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Recover password state
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [previewEmailUrl, setPreviewEmailUrl] = useState<string | null>(null);
  
  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // RESET ALL FORM & MESSAGE STATES
  const resetModalState = () => {
    setActiveTab('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setForgotStep('request');
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setPreviewEmailUrl(null);
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setShowForgotPassword(false);
    setShowForgotConfirmPassword(false);
  };

  // Reset when modal opens/closes or switches tabs
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabSwitch = (tab: 'login' | 'register' | 'forgot') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (tab === 'forgot') {
      setForgotStep('request');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setPreviewEmailUrl(null);
    }
  };

  // INICIO DE SESIÓN HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, completa todos los campos obligatorios (*).');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.success && res.data) {
        localStorage.setItem('buttoncat_token', res.data.token);
        localStorage.setItem('buttoncat_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
        resetModalState();
        onClose();
      } else {
        setErrorMessage(res.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // REGISTRO DE CUENTA HANDLER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setErrorMessage('Por favor, completa todos los campos obligatorios (*).');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      if (res.success && res.data) {
        localStorage.setItem('buttoncat_token', res.data.token);
        localStorage.setItem('buttoncat_user', JSON.stringify(res.data.user));
        setSuccessMessage('¡Cuenta creada con éxito! Iniciando sesión...');
        setTimeout(() => {
          onLoginSuccess(res.data!.user);
          resetModalState();
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Error al crear la cuenta');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASO 1: SOLICITAR CORREO CON CÓDIGO DE CONFIRMACIÓN
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setPreviewEmailUrl(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Por favor, ingresa tu correo electrónico registrado (*).');
      return;
    }

    if (!isValidEmail(forgotEmail)) {
      setErrorMessage('El formato de correo electrónico no es válido. Debe incluir un dominio real (ejemplo: usuario@dominio.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.requestPasswordReset(forgotEmail.trim());
      if (res.success && res.data) {
        setForgotStep('verify');
        setSuccessMessage(`Enviamos un código de confirmación de 6 dígitos a ${res.data.email}.`);
        if (res.data.previewEmailUrl) {
          setPreviewEmailUrl(res.data.previewEmailUrl);
        }
      } else {
        setErrorMessage(res.error || 'No se pudo enviar el correo de confirmación.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASO 2: VALIDAR CÓDIGO Y ACTUALIZAR CONTRASEÑA
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!forgotEmail.trim() || !forgotCode.trim() || !forgotNewPassword.trim() || !forgotConfirmPassword.trim()) {
      setErrorMessage('Por favor, ingresa el código de confirmación de 6 dígitos y la nueva contraseña (*).');
      return;
    }

    if (forgotCode.trim().length !== 6) {
      setErrorMessage('El código de confirmación debe tener exactamente 6 dígitos.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword: forgotNewPassword,
      });

      if (res.success) {
        setLoginEmail(forgotEmail.trim());
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotStep('request');
        setPreviewEmailUrl(null);
        setActiveTab('login');
        setSuccessMessage('Código validado y contraseña actualizada con éxito. Ya puedes iniciar sesión.');
      } else {
        setErrorMessage(res.error || 'El código de confirmación es inválido o ha expirado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-9999 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm min-h-dvh animate-in fade-in duration-200"
    >
      
      {/* MODAL CONTAINER */}
      <div 
        className="relative w-full max-w-md bg-white border-3 sm:border-4 border-black shadow-brutal sm:shadow-brutal-xl overflow-hidden font-sans my-auto max-h-[92dvh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP BAR */}
        <div className="bg-brand-yellow border-b-3 sm:border-b-4 border-black p-3.5 sm:p-4 px-4 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0 stroke-[2.5]" />
            <h3 className="text-sm sm:text-base font-black uppercase text-black font-display tracking-tight truncate">
              ACCESO A BUTTONCAT
            </h3>
          </div>
          <button
            onClick={() => { resetModalState(); onClose(); }}
            className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center font-black text-black hover:bg-black hover:text-white transition-colors shadow-brutal-sm cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-3" />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex border-b-3 sm:border-b-4 border-black bg-gray-100 shrink-0">
          <button
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-2.5 sm:py-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-black border-b-3 sm:border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> INICIAR SESIÓN
          </button>
          <button
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 py-2.5 sm:py-3 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-black border-b-3 sm:border-b-4 border-black font-black'
                : 'text-gray-500 hover:text-black hover:bg-gray-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> REGISTRARSE
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-4 bg-[#FDFBF7] flex-1 overflow-y-auto overscroll-contain">
          
          {/* UNIFIED SUCCESS MESSAGE BANNER */}
          {successMessage && (
            <div className="bg-green-100 border-2 sm:border-3 border-black text-green-800 p-2.5 sm:p-3 text-xs font-black uppercase shadow-brutal-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form noValidate onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="auth-login-email" className="text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-login-email"
                    name="loginEmail"
                    aria-label="Correo electrónico para iniciar sesión"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-2 sm:border-3 border-black p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9 sm:pl-10"
                  />
                  <Mail className="w-4 h-4 text-black absolute left-3 top-3 sm:top-3.5 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-login-password" className="text-xs font-black uppercase text-black block">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[11px] font-black uppercase text-brand-purple hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="auth-login-password"
                    name="loginPassword"
                    aria-label="Contraseña para iniciar sesión"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 sm:border-3 border-black p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9 sm:pl-10 pr-10"
                  />
                  <Lock className="w-4 h-4 text-black absolute left-3 top-3 sm:top-3.5 stroke-[2.5]" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black cursor-pointer transition-colors"
                    title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              </div>

              <div className="pt-1 space-y-2.5">
                <Button variant="pink" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-3 font-black text-xs sm:text-sm">
                  {isSubmitting ? 'INGRESANDO...' : 'ENTRAR A MI CUENTA'}
                </Button>

                <div className="text-[10px] font-black uppercase text-gray-500 text-center">
                  ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form noValidate onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="auth-reg-name" className="text-xs font-black uppercase text-black block">
                  NOMBRE COMPLETO <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-reg-name"
                    name="regName"
                    aria-label="Nombre completo"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Camila Torres"
                    className="w-full border-2 sm:border-3 border-black p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9 sm:pl-10"
                  />
                  <UserIcon className="w-4 h-4 text-black absolute left-3 top-3 sm:top-3.5 stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="auth-reg-email" className="text-xs font-black uppercase text-black block">
                  EMAIL <span className="text-red-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    id="auth-reg-email"
                    name="regEmail"
                    aria-label="Correo electrónico de registro"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu.email@ejemplo.com"
                    className="w-full border-2 sm:border-3 border-black p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9 sm:pl-10"
                  />
                  <Mail className="w-4 h-4 text-black absolute left-3 top-3 sm:top-3.5 stroke-[2.5]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="auth-reg-password" className="text-[11px] font-black uppercase text-black block truncate">
                    CONTRASEÑA <span className="text-red-600 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-password"
                      name="regPassword"
                      aria-label="Contraseña de registro"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-2 sm:border-3 border-black p-2.5 pr-9 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black cursor-pointer transition-colors"
                      title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      aria-label={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-reg-confirm-password" className="text-[11px] font-black uppercase text-black block truncate">
                    CONFIRMAR <span className="text-red-600 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-confirm-password"
                      name="regConfirmPassword"
                      aria-label="Repetir contraseña de registro"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-2 sm:border-3 border-black p-2.5 pr-9 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black cursor-pointer transition-colors"
                      title={showRegConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                      aria-label={showRegConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1 space-y-2.5">
                <Button variant="yellow" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-3 font-black text-xs sm:text-sm">
                  {isSubmitting ? 'CREANDO CUENTA...' : 'CREAR MI CUENTA'}
                </Button>

                <div className="text-[10px] font-black uppercase text-gray-500 text-center">
                  ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD FORM (2-STEP EMAIL CONFIRMATION) */}
          {activeTab === 'forgot' && (
            forgotStep === 'request' ? (
              <form noValidate onSubmit={handleRequestResetCode} className="space-y-3.5">
                <div className="text-xs font-bold text-gray-700 leading-relaxed">
                  Ingresa tu correo electrónico registrado. Te enviaremos un correo con un código de confirmación de 6 dígitos para validar el cambio de contraseña.
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-forgot-email" className="text-xs font-black uppercase text-black block">
                    EMAIL REGISTRADO <span className="text-red-600 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="auth-forgot-email"
                      name="forgotEmail"
                      aria-label="Correo electrónico registrado para recuperar contraseña"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="tu.email@ejemplo.com"
                      className="w-full border-2 sm:border-3 border-black p-2.5 sm:p-3 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm pl-9 sm:pl-10"
                    />
                    <Mail className="w-4 h-4 text-black absolute left-3 top-3 sm:top-3.5 stroke-[2.5]" />
                  </div>
                </div>

                <div className="pt-1 space-y-2.5">
                  <Button variant="cyan" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-3 font-black text-xs sm:text-sm">
                    {isSubmitting ? 'ENVIANDO CORREO...' : 'ENVIAR CORREO DE CONFIRMACIÓN'}
                  </Button>

                  <div className="text-center pt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('login')}
                      className="text-xs font-black uppercase text-black hover:underline cursor-pointer inline-flex items-center gap-1.5 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver a Iniciar Sesión
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form noValidate onSubmit={handleForgotSubmit} className="space-y-3.5">
                <div className="bg-yellow-100 border-2 border-black p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase text-black truncate">
                      CORREO: {forgotEmail.trim()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('request');
                        setSuccessMessage(null);
                        setErrorMessage(null);
                      }}
                      className="text-[10px] font-black uppercase text-brand-purple underline shrink-0 cursor-pointer"
                    >
                      Cambiar / Reenviar
                    </button>
                  </div>
                  {previewEmailUrl && (
                    <a
                      href={previewEmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-black text-brand-yellow hover:bg-brand-pink hover:text-white border border-black py-1.5 px-2 text-[10px] font-black uppercase transition-colors"
                    >
                      ABRIR CORREO DE CONFIRMACIÓN RECIBIDO (BANDEJA SMTP)
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-forgot-code" className="text-xs font-black uppercase text-black block">
                    CÓDIGO DE CONFIRMACIÓN (6 DÍGITOS) <span className="text-red-600 font-black">*</span>
                  </label>
                  <input
                    id="auth-forgot-code"
                    name="forgotCode"
                    aria-label="Código de confirmación de 6 dígitos enviado por correo"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="Ej: 482915"
                    className="w-full border-2 sm:border-3 border-black p-2.5 text-center text-base font-black tracking-[0.35em] text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="auth-forgot-new-password" className="text-[11px] font-black uppercase text-black block truncate">
                      NUEVA CLAVE <span className="text-red-600 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-forgot-new-password"
                        name="forgotNewPassword"
                        aria-label="Nueva contraseña"
                        type={showForgotPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border-2 sm:border-3 border-black p-2.5 pr-9 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black cursor-pointer transition-colors"
                        title={showForgotPassword ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                        aria-label={showForgotPassword ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                      >
                        {showForgotPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="auth-forgot-confirm-password" className="text-[11px] font-black uppercase text-black block truncate">
                      CONFIRMAR <span className="text-red-600 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-forgot-confirm-password"
                        name="forgotConfirmPassword"
                        aria-label="Confirmar nueva contraseña"
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full border-2 sm:border-3 border-black p-2.5 pr-9 text-xs sm:text-sm font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-brutal-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-black cursor-pointer transition-colors"
                        title={showForgotConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                        aria-label={showForgotConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1 space-y-2.5">
                  <Button variant="cyan" size="md" fullWidth type="submit" disabled={isSubmitting} className="py-3 font-black text-xs sm:text-sm">
                    {isSubmitting ? 'VALIDANDO Y ACTUALIZANDO...' : 'VALIDAR CÓDIGO Y CAMBIAR CONTRASEÑA'}
                  </Button>

                  <div className="text-center pt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('login')}
                      className="text-xs font-black uppercase text-black hover:underline cursor-pointer inline-flex items-center gap-1.5 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver a Iniciar Sesión
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-500">
                      ( <span className="text-red-600">*</span> ) CAMPOS OBLIGATORIOS
                    </div>
                  </div>
                </div>
              </form>
            )
          )}

        </div>

      </div>

      {/* VALIDATION NOTICE MODAL */}
      <ValidationModal
        isOpen={!!errorMessage}
        title="AVISO DE ACCESO"
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />
    </div>,
    document.body
  );
};
