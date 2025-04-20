import { createContext, useContext, useState } from 'react';

interface Category {
  id: number;
  name: string;
  parent_id: number;
  level: number;
  product_count: number;
  children_data: Category[];
}

interface CategoryContextType {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  curCategory: Category | null;
  setCurCategory: (category: Category) => void;
  clearCurCategory: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [curCategory, setCurCategoryState] = useState<Category | null>(null);
  
  const setCategories = async (data: Category[]) => {
    setCategoriesState(data);
  };

  const setCurCategory = async (data: Category) => {
    setCurCategoryState(data);
  };

  const clearCurCategory = async () => {
    setCurCategoryState(null);
  };

  return (
    <CategoryContext.Provider value={{ categories, setCategories, curCategory, setCurCategory, clearCurCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

export default CategoryProvider;

