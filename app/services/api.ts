import axios, { AxiosError } from 'axios';
import { EventRegister } from 'react-native-event-listeners';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.wholesale-supplier.uk';

interface Order {
  entity_id: number;
  increment_id: string;
  created_at: string;
  status: string;
  grand_total: number;
  customer_name: string;
}

interface OrderDetails extends Order {
  customer_id: number;
  customer_firstname: string;
  customer_lastname: string;
  customer_email: string;
  items: {
    name: string;
    sku: string;
    qty_ordered: number;
    price: number;
  }[];
  shipping_address: {
    street: string[];
    city: string;
    region: string;
    postcode: string;
    country_id: string;
  };
  payment: any;
}

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
}

interface ProductDetails extends Product {
  weight: number;
  created_at: string;
  updated_at: string;
  custom_attributes: {
    attribute_code: string;
    value: string;
  }[];
  media_gallery_entries: {
    id: number;
    media_type: string;
    label: string;
    position: number;
    disabled: boolean;
    file: string;
  }[];
}

interface Customer {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  created_at: string;
  group_id: number;
  store_id: number;
  website_id: number;
  addresses: {
    id: number;
    customer_id: number;
    region: {
      region_code: string;
      region: string;
      region_id: number;
    };
    region_id: number;
    country_id: string;
    street: string[];
    company: string;
    telephone: string;
    fax: string;
    postcode: string;
    city: string;
    firstname: string;
    lastname: string;
    middlename: string;
    prefix: string;
    suffix: string;
    vat_id: string;
    default_shipping: boolean;
    default_billing: boolean;
  }[];
}

interface CustomerDetails extends Customer {
  custom_attributes: {
    attribute_code: string;
    value: string;
  }[];
}

interface Category {
  id: number;
  parent_id: number;
  name: string;
  is_active: boolean;
  position: number;
  level: number;
  product_count: number;
  children_data: Category[];
}

interface CategoryDetails extends Category {
  created_at: string;
  updated_at: string;
  path: string;
  product_count: number;
  available_sort_by: string[];
  include_in_menu: boolean;
  custom_attributes: {
    attribute_code: string;
    value: string;
  }[];
}

interface DashboardStats {
  total_orders: number;
  total_customers: number;
  total_products: number;
}

interface ProductFilters {
  status?: 1 | 2 | null;
  search?: string;
}

interface CreateProductData {
  product: {
    name: string,
    price: number,
    sku: string,
    status: 1 | 2 | null,
    weight: number,
    custom_attributes: [
      {
        attribute_code: string,
        value: string
      }
    ],
  };
}

export interface UpdateProductData {
  product: {
    name: string;
    price: number;
    status: 1 | 2 | null;
    weight: number;
    custom_attributes: {
      attribute_code: string;
      value: string;
    }[];
  };
}

// Add this function to handle auth errors
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    // Emit an event that will be caught by the auth context
    EventRegister.emit('logout');
    throw new Error('Your session has expired. Please login again.');
  }
  throw error;
};

const api = {
  login: async (username: string, password: string): Promise<string> => {
    try {
      const response = await axios.post(`${BASE_URL}/rest/V1/integration/admin/token`, {
        username,
        password,
      });

      if (!response.data) {
        throw new Error('No token received from server');
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Invalid credentials');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while trying to log in.');
      }
    }
  },

  getOrders: async (token: string, page: number = 1, pageSize: number = 20): Promise<{
    items: Order[];
    total_count: number;
    current_page: number;
    total_pages: number;
  }> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          searchCriteria: {
            currentPage: page,
            pageSize: pageSize,
            sortOrders: [
              {
                field: 'created_at',
                direction: 'DESC'
              }
            ]
          }
        }
      });
      return {
        items: response.data.items,
        total_count: response.data.total_count,
        current_page: page,
        total_pages: Math.ceil(response.data.total_count / pageSize)
      };
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch orders');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching orders.');
      }
    }
  },

  getOrderDetails: async (token: string, orderId: string): Promise<OrderDetails> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch order details');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching order details.');
      }
    }
  },

  getProducts: async (token: string, page: number = 1, pageSize: number = 20, filters?: ProductFilters): Promise<{
    items: Product[];
    total_count: number;
    current_page: number;
    total_pages: number;
  }> => {
    try {
      const searchCriteria: any = {
        currentPage: page,
        pageSize: pageSize,
        sortOrders: [
          {
            field: 'created_at',
            direction: 'DESC'
          }
        ]
      };

      // Add filters if provided
      if (filters) {
        if (filters.status) {
          searchCriteria.filterGroups = [{
            filters: [{
              field: 'status',
              value: filters.status,
              conditionType: 'eq'
            }]
          }];
        }

        if (filters.search) {
          const index = searchCriteria.filterGroups ? 1 : 0;
          searchCriteria.filterGroups = searchCriteria.filterGroups || [];

          searchCriteria.filterGroups.push({ filters: [] });
          searchCriteria.filterGroups[index].filters.push({
            field: 'name',
            value: `%${filters.search}%`,
            conditionType: 'like'
          });

          searchCriteria.filterGroups[index].filters.push({
            field: 'sku',
            value: `%${filters.search}%`,
            conditionType: 'like'
          });

          searchCriteria.filterGroups[index].filters.push({
            field: 'description',
            value: `%${filters.search}%`,
            conditionType: 'like'
          });

          searchCriteria.filterGroups[index].filters.push({
            field: 'eancode',
            value: `%${filters.search}%`,
            conditionType: 'like'
          });
        }
      }

      const response = await axios.get(`${BASE_URL}/rest/V1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          searchCriteria
        }
      });
      return {
        items: response.data.items,
        total_count: response.data.total_count,
        current_page: page,
        total_pages: Math.ceil(response.data.total_count / pageSize)
      };
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch products');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching products.');
      }
    }
  },

  getProductDetails: async (token: string, sku: string): Promise<ProductDetails> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/products/${sku}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch product details');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching product details.');
      }
    }
  },

  getCustomers: async (token: string, page: number = 1, pageSize: number = 20): Promise<{
    items: Customer[];
    total_count: number;
    current_page: number;
    total_pages: number;
  }> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/customers/search`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          searchCriteria: {
            currentPage: page,
            pageSize: pageSize,
            sortOrders: [
              {
                field: 'created_at',
                direction: 'DESC'
              }
            ]
          }
        }
      });
      return {
        items: response.data.items,
        total_count: response.data.total_count,
        current_page: page,
        total_pages: Math.ceil(response.data.total_count / pageSize)
      };
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch customers');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching customers.');
      }
    }
  },

  getCustomerDetails: async (token: string, customerId: string): Promise<CustomerDetails> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch customer details');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching customer details.');
      }
    }
  },

  getCategories: async (token: string, page: number = 1, pageSize: number = 20): Promise<{
    items: Category[];
    total_count: number;
    current_page: number;
    total_pages: number;
  }> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          searchCriteria: {
            currentPage: page,
            pageSize: pageSize,
            sortOrders: [
              {
                field: 'position',
                direction: 'ASC'
              }
            ]
          }
        }
      });
      return {
        items: response.data.children_data,
        total_count: response.data.total_count || 0,
        current_page: page,
        total_pages: Math.ceil((response.data.total_count || 0) / pageSize)
      };
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch categories');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching categories.');
      }
    }
  },

  getCategoryDetails: async (token: string, categoryId: string): Promise<CategoryDetails> => {
    try {
      const response = await axios.get(`${BASE_URL}/rest/V1/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch category details');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while fetching category details.');
      }
    }
  },

  async getStats(token: string): Promise<DashboardStats> {
    try {
      // const response = await fetch(`${BASE_URL}/rest/V1/dashboard/stats`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      const data: DashboardStats = {
        total_orders: 0,
        total_customers: 0,
        total_products: 0,
      };

      data.total_orders = await this.getOrders(token, 1, 1).then((res) => res.total_count);
      data.total_customers = await this.getCustomers(token, 1, 1).then((res) => res.total_count);
      data.total_products = await this.getProducts(token, 1, 1).then((res) => res.total_count);

      return data;
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to fetch dashboard stats');
      // }

      //const data = await response.json();
      //return data;
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('No response from server. Please check your connection.');
      }
      throw error;
    }
  },

  createProduct: async (token: string, productData: CreateProductData): Promise<Product> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/rest/V1/products`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create product');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while creating the product.');
      }
    }
  },

  uploadProductImage: async (token: string, sku: string, imageData: string, position: number = 0, type: string = 'image/jpeg'): Promise<any> => {
    try {
      const response = await axios.post(
        `${BASE_URL}/rest/V1/products/${sku}/media`,
        {
          entry: {
            media_type: 'image',
            label: 'Product Image',
            position: position,
            disabled: false,
            types: ['image', 'small_image', 'thumbnail'],
            content: {
              base64_encoded_data: imageData,
              type: type,
              name: `product_${position}.jpg`
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to upload image');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while uploading the image.');
      }
    }
  },

  deleteProduct: async (token: string, sku: string): Promise<void> => {
    try {
      await axios.delete(
        `${BASE_URL}/rest/V1/products/${sku}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete product');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while deleting the product.');
      }
    }
  },

  deleteProductImage: async (token: string, sku: string, imageId: number): Promise<void> => {
    try {
      await axios.delete(
        `${BASE_URL}/rest/V1/products/${sku}/media/${imageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error: any) {
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete product image');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while deleting the product image.');
      }
    }
  },

  updateProduct: async (token: string, sku: string, productData: UpdateProductData): Promise<Product> => {
    try {
      console.log(productData);
      const response = await axios.put(
        `${BASE_URL}/rest/V1/products/${sku}`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.log(error);
      handleAuthError(error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update product');
      } else if (error.request) {
        throw new Error('No response from server. Please check your internet connection.');
      } else {
        throw new Error('An error occurred while updating the product.');
      }
    }
  },

  deleteCategory: async (id: number): Promise<void> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  },
};

export default api; 