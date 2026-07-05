import { useState, useMemo, useEffect } from 'react';
import type { Product, Category, CategoryType } from '../types';
import api from '../../../api';

const INITIAL_PRODUCTS: Product[] = [
  // COFFEE
  {
    id: 'c1',
    name: 'Espresso',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1510707577719-09411968651c?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c2',
    name: 'Cappuccino',
    price: 33000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c3',
    name: 'Latte',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c4',
    name: 'Americano',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1551046713-2470f3f201e7?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c5',
    name: 'Mocha',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c6',
    name: 'Iced Coffee Milk',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c7',
    name: 'Cold Brew',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c8',
    name: 'Flat White',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c9',
    name: 'Caramel Macchiato',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c10',
    name: 'Salted Caramel',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c11',
    name: 'Hazelnut Latte',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  {
    id: 'c12',
    name: 'Pour Over',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    category: 'coffee',
    available: true,
    stockCount: 50,
  },
  // TEA
  {
    id: 't1',
    name: 'Peach Oolong Tea',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    category: 'tea',
    available: true,
    stockCount: 20,
  },
  {
    id: 't2',
    name: 'Matcha Latte',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
    category: 'tea',
    available: true,
    stockCount: 20,
  },
  {
    id: 't3',
    name: 'Earl Grey Milk Tea',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
    category: 'tea',
    available: true,
    stockCount: 20,
  },
  {
    id: 't4',
    name: 'Jasmine Green Tea',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&auto=format&fit=crop&q=80',
    category: 'tea',
    available: true,
    stockCount: 20,
  },
  // SNACK
  {
    id: 's1',
    name: 'Butter Croissant',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
    category: 'snack',
    available: true,
    stockCount: 10,
  },
  {
    id: 's2',
    name: 'Chocolate Muffin',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&auto=format&fit=crop&q=80',
    category: 'snack',
    available: true,
    stockCount: 10,
  },
  {
    id: 's3',
    name: 'Cinnamon Roll',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    category: 'snack',
    available: true,
    stockCount: 0,
    needRestock: true,
  },
  {
    id: 's4',
    name: 'Cheese Danish',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=400&auto=format&fit=crop&q=80',
    category: 'snack',
    available: true,
    stockCount: 10,
  },
  // MAKANAN BERAT
  {
    id: 'm1',
    name: 'Nasi Goreng Spesial',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop&q=80',
    category: 'main_course',
    available: true,
    stockCount: 15,
  },
  {
    id: 'm2',
    name: 'Mie Goreng Ayam',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
    category: 'main_course',
    available: true,
    stockCount: 15,
  },
  {
    id: 'm3',
    name: 'Pasta Carbonara',
    price: 100000,
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&auto=format&fit=crop&q=80',
    category: 'main_course',
    available: true,
    stockCount: 10,
  },
  {
    id: 'm4',
    name: 'Grilled Chicken Rice',
    price: 90000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    category: 'main_course',
    available: true,
    stockCount: 10,
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'coffee', name: 'Coffee', itemCount: 12, available: true },
  { id: 'tea', name: 'Tea', itemCount: 4, available: true },
  { id: 'snack', name: 'Snack', itemCount: 4, available: true, needRestock: true },
  { id: 'main_course', name: 'Main Course', itemCount: 4, available: true },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('coffee');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProductsAndCategories = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);

      if (productsRes.data.success) {
        setProducts(productsRes.data.data.map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
          available: p.available,
          stockCount: p.stockCount,
          needRestock: p.stockCount <= 2
        })));
      }

      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          itemCount: c.itemCount,
          available: c.available,
          needRestock: c.needRestock
        })));
      }
    } catch (error) {
      console.error('Failed to fetch products/categories', error);
      // Fallback to initial if fetch fails
      setProducts(INITIAL_PRODUCTS);
      setCategories(INITIAL_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = searchQuery ? true : product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addProduct = async (product: Omit<Product, 'id' | 'needRestock'>, imageFile?: File | null) => {
    setSubmitting(true);
    try {
      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('name', product.name);
        formData.append('price', String(product.price));
        formData.append('category', product.category);
        formData.append('available', String(product.available));
        formData.append('stockCount', String(product.stockCount));
        response = await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/products', product);
      }
      if (response.data.success) {
        await fetchProductsAndCategories();
      }
    } catch (error) {
      console.error('Failed to add product', error);
    } finally {
      setSubmitting(false);
    }
  };

  const editProduct = async (updatedProduct: Product, imageFile?: File | null) => {
    setSubmitting(true);
    try {
      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('name', updatedProduct.name);
        formData.append('price', String(updatedProduct.price));
        formData.append('category', updatedProduct.category);
        formData.append('available', String(updatedProduct.available));
        formData.append('stockCount', String(updatedProduct.stockCount));
        response = await api.put(`/products/${updatedProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.put(`/products/${updatedProduct.id}`, updatedProduct);
      }
      if (response.data.success) {
        await fetchProductsAndCategories();
      }
    } catch (error) {
      console.error('Failed to edit product', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await api.delete(`/products/${id}`);
      if (response.data.success) {
        await fetchProductsAndCategories();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const updateStock = async (productId: string, quantity: number) => {
    try {
      // Optimistic update
      setProducts((prev) => {
        return prev.map((product) => {
          if (product.id === productId) {
            const newStock = Math.max(0, product.stockCount - quantity);
            return {
              ...product,
              stockCount: newStock,
              needRestock: newStock <= 2,
            };
          }
          return product;
        });
      });
      // Currently backend doesn't have an endpoint specifically for updating stock,
      // it would be handled through completing a transaction.
      // Alternatively, we could fetch product, update stock, and call PUT /products/:id
      const productToUpdate = products.find(p => p.id === productId);
      if (productToUpdate) {
        const newStock = Math.max(0, productToUpdate.stockCount - quantity);
        await api.put(`/products/${productId}`, { ...productToUpdate, stockCount: newStock });
        await fetchProductsAndCategories();
      }
    } catch (error) {
      console.error('Failed to update stock', error);
      // Revert if error
      await fetchProductsAndCategories();
    }
  };

  return {
    products,
    categories,
    loading,
    submitting,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    updateStock,
    addProduct,
    editProduct,
    deleteProduct,
  };
}
