import React, { createContext, useContext, useState } from 'react';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: 1 | 2 | null;
  custom_attributes: {
    attribute_code: string;
    value: string;
  }[];
  media_gallery_entries?: {
    id: number;
    media_type: string;
    label: string;
    position: number;
    disabled: boolean;
    file: string;
  }[];
}

interface ProductDetails extends Product {
  weight: number;
  created_at: string;
  updated_at: string;
  custom_attributes: {
    attribute_code: string;
    value: string;
  }[];
}

interface FormData {
  sku: string,
  name: string,
  price: number,
  weight: number,
  description: string,
  eancode: string,
  status: 1 | 2 | null, // 1 for enabled
}

interface ProductContextType {
  curProduct: Product | null;
  setCurProduct: (product: Product) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  clearCurProduct: () => void;
  formData: FormData;
  setFormData: (formData: FormData) => void;
  mainImage: string | null;
  setMainImage: (image: string | null) => void;
  additionalImages: string[];
  setAdditionalImages: (images: string[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProductsState] = useState<Product[]>([]);
  const [curProduct, setCurProductState] = useState<Product | null>(null);
  const [formData, setFormDataState] = useState<FormData>({
    sku: '',
    name: '',
    price: 0,
    weight: 0,
    description: '',
    eancode: '',
    status: 1 as 1 | 2 | null, // 1 for enabled
  });
  const [mainImage, setMainImageState] = useState<string | null>(null);
  const [additionalImages, setAdditionalImagesState] = useState<string[]>([]);

  const setProducts = async (data: Product[]) => {
    setProductsState(data);
  };

  const setCurProduct = async (data: Product) => {
    setCurProductState(data);
  };

  const clearCurProduct = async () => {
    setCurProductState(null);
    setFormDataState({
      sku: '',
      name: '',
      price: 0,
      weight: 0,
      description: '',
      eancode: '',
      status: 1 as 1 | 2 | null,
    });
    setMainImageState(null);
    setAdditionalImagesState([]);
  };

  const setFormData = async (data: FormData) => {
    setFormDataState(data);
  };

  const setMainImage = async (image: string | null) => {
    setMainImageState(image);
  };

  const setAdditionalImages = async (images: string[]) => {
    setAdditionalImagesState(images);
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      setProducts, 
      curProduct, 
      setCurProduct, 
      clearCurProduct, 
      formData, 
      setFormData,
      mainImage,
      setMainImage,
      additionalImages,
      setAdditionalImages
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

export default ProductProvider; 