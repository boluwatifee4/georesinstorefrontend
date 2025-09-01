// DTOs for API requests/responses

// Category DTOs
export interface CreateCategoryDto {
  name: string;
  slug: string;
  active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  active?: boolean;
}

// Product DTOs
export interface CreateProductDto {
  title: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductDto {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

// Product Media DTOs
export interface AddMediaDto {
  url: string;
  alt?: string;
  position?: number;
  isPrimary?: boolean;
}

// Option Group DTOs
export interface CreateOptionGroupDto {
  name: string;
}

export interface CreateOptionDto {
  value: string;
}

// Variant DTOs
export interface UpdateVariantDto {
  sku?: string;
  price?: string;
  inventory?: number;
  isActive?: boolean;
  imageUrl?: string;
}

// Delivery Zone DTOs
export interface CreateDeliveryZoneDto {
  name: string;
  matcher: 'CITY' | 'STATE' | 'CUSTOM';
  value: string;
  fee: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateDeliveryZoneDto {
  name?: string;
  matcher?: 'CITY' | 'STATE' | 'CUSTOM';
  value?: string;
  fee?: string;
  priority?: number;
  isActive?: boolean;
}

// Cart DTOs
export interface AddCartItemDto {
  variantId: number;
  qty: number;
}

export interface UpdateCartItemDto {
  qty: number;
}

// Order DTOs
export interface SaveOrderDto {
  cartId: string;
  locationLabel?: string;
}

export interface DeclarePaymentDto {
  cartId: string;
  buyerName: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  locationLabel?: string;
}

export interface RejectOrderDto {
  reason: string;
}

// Delivery DTOs
export interface DeliveryQuoteDto {
  locationLabel: string;
}

export interface DeliveryQuoteResponse {
  fee?: string;
  zoneName?: string;
  needsManualQuote?: boolean;
  whatsappLink?: string;
}

// App Config DTOs
export interface UpdateConfigDto {
  bankName?: string;
  accountNumber?: string;
  whatsappLink?: string;
  checkoutNote?: string;
}

// Common response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
