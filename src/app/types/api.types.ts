// Base types from Prisma schema
export interface Category {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  featured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMedia {
  id: number;
  productId: number;
  url: string;
  alt: string | null;
  position: number;
  isPrimary: boolean;
}

export interface OptionGroup {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: number;
  groupId: number;
  value: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: string; // Decimal as string
  inventory: number;
  isActive: boolean;
  imageUrl: string | null;
}

export interface DeliveryZone {
  id: number;
  name: string;
  matcher: 'CITY' | 'STATE' | 'CUSTOM';
  value: string;
  fee: string; // Decimal as string
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  cartId: string;
  variantId: number;
  qty: number;
  unitPriceSnap: string; // Decimal as string
  skuSnap: string;
  titleSnap: string;
}

export interface Order {
  id: number;
  orderCode: string;
  status: 'SAVED' | 'DECLARED_PAID' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED';
  cartId: string | null;
  buyerName: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  declaredAt: string | null;
  subTotal: string; // Decimal as string
  deliveryFee: string | null; // Decimal as string
  total: string; // Decimal as string
  locationLabel: string | null;
  deliveryZoneName: string | null;
  needsManualQuote: boolean;
  whatsappLink: string | null;
  manualQuote: boolean;
  bankName: string | null;
  accountNumber: string | null;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  id: number;
  bankName: string | null;
  accountNumber: string | null;
  whatsappLink: string | null;
  checkoutNote: string | null;
}

// Request DTOs
export interface OrderCreateRequest {
  cartId: string;
  locationLabel?: string;
}

export interface DeclarePaymentRequest {
  cartId: string;
  buyerName: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  locationLabel?: string;
}

export interface AddCartItemRequest {
  variantId: number;
  qty: number;
}

export interface UpdateCartItemRequest {
  qty: number;
}

export interface DeliveryQuoteRequest {
  locationLabel: string;
}
