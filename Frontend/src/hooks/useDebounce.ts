import { useState, useEffect } from 'react';

/**
 * Hook de debounce generico que retrasa la actualizacion de un valor
 * hasta que transcurran delayMs milisegundos sin nuevos cambios.
 * Si el valor es un string vacio, actualiza de inmediato para que el boton "Limpiar" sea instantaneo.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (typeof value === 'string' && value.trim() === '') {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook de busqueda con debounce que devuelve tanto el valor estabilizado
 * como un booleano isPending mientras el usuario sigue escribiendo.
 */
export function useDebouncedSearch(value: string, delayMs: number = 300): {
  debouncedValue: string;
  isPending: boolean;
} {
  const debouncedValue = useDebounce(value, delayMs);
  const isPending = value.trim() !== debouncedValue.trim();

  return { debouncedValue, isPending };
}
