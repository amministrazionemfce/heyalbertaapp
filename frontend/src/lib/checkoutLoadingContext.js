import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import BrandLoadingOverlay from '../components/BrandLoadingOverlay';

const CheckoutLoadingContext = createContext(null);

export function CheckoutLoadingProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('Taking you to secure checkout…');

  const startCheckoutLoading = useCallback((nextLabel) => {
    if (typeof nextLabel === 'string' && nextLabel.trim()) setLabel(nextLabel.trim());
    else setLabel('Taking you to secure checkout…');
    setOpen(true);
  }, []);

  const stopCheckoutLoading = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ startCheckoutLoading, stopCheckoutLoading }),
    [startCheckoutLoading, stopCheckoutLoading]
  );

  return (
    <CheckoutLoadingContext.Provider value={value}>
      {children}
      <BrandLoadingOverlay open={open} label={label} />
    </CheckoutLoadingContext.Provider>
  );
}

export function useCheckoutLoading() {
  const ctx = useContext(CheckoutLoadingContext);
  if (!ctx) {
    return {
      startCheckoutLoading: () => {},
      stopCheckoutLoading: () => {},
    };
  }
  return ctx;
}
