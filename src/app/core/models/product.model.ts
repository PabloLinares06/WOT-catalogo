export interface Product {
  id: string;
  reference: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  category: string;        // nombre de la categoría (compatibilidad con templates)
  categoryId?: string;     // id de la categoría (retornado por el backend)
  isActive: boolean;
  stock?: number;
  hasObservation?: boolean;
  bulkMinQty?: number;   // cantidad mínima para activar precio mayorista
  bulkPrice?: number;    // precio por unidad al por mayor
  order?: number;        // orden manual dentro de la categoría (Módulo Drag & Drop)
}

export interface CartItem {
  product: Product;
  quantity: number;
  observation?: string;
}
