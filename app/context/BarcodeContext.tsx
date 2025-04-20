import React, { createContext, useContext, useState } from 'react';

type Barcode = string;

interface BarcodeContextType {
  barcode: Barcode | null;
  setBarcode: (barcode: string) => Promise<void>;
  removeBarcode: () => Promise<void>;
}

const BarcodeContext = createContext<BarcodeContextType | undefined>(undefined);

export function BarcodeProvider({ children }: { children: React.ReactNode }) {
  const [barcode, setBarcodeState] = useState<Barcode | null>(null);

  const setBarcode = async (data: string) => {
    setBarcodeState(data);
  };

  const removeBarcode = async () => {
    setBarcodeState(null);
  };

  return (
    <BarcodeContext.Provider value={{ barcode, setBarcode, removeBarcode }}>
      {children}
    </BarcodeContext.Provider>
  );
}

export const useBarcode = () => {
  const context = useContext(BarcodeContext);
  if (context === undefined) {
    throw new Error('useBarcode must be used within a BarcodeProvider');
  }
  return context;
};

export default BarcodeProvider; 