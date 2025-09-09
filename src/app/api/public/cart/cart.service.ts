import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Cart, CartItem } from '../../../types/api.types';
import { AddCartItemDto, UpdateCartItemDto } from '../../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class PublicCartService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * POST /cart - Create a new cart
   */
  createCart(): Observable<{ id: string }> {
    return this.apiHttp.post<{ id: string }>('cart', {});
  }

  /**
   * GET /cart/{cartId} - Get cart details
   */
  getCart(cartId: string): Observable<Cart & { items: CartItem[] }> {
    return this.apiHttp.get<Cart & { items: CartItem[] }>(`cart/${cartId}`);
  }

  /**
   * POST /cart/{cartId}/items - Add item to cart (flexible: productId | productSlug | variantId + selectedOptions)
   */
  addItem(cartId: string, dto: AddCartItemDto): Observable<CartItem> {
    return this.apiHttp.post<CartItem>(`cart/${cartId}/items`, dto);
  }

  /**
   * PATCH /cart/{cartId}/items/{itemId} - Update cart item quantity
   */
  updateItem(cartId: string, itemId: number, dto: UpdateCartItemDto): Observable<CartItem> {
    return this.apiHttp.patch<CartItem>(`cart/${cartId}/items/${itemId}`, dto);
  }

  /**
   * DELETE /cart/{cartId}/items/{itemId} - Remove item from cart
   */
  removeItem(cartId: string, itemId: number): Observable<void> {
    return this.apiHttp.delete<void>(`cart/${cartId}/items/${itemId}`);
  }

  /**
   * DELETE /cart/{cartId}/items - Clear all items from cart
   */
  clearCart(cartId: string): Observable<void> {
    return this.apiHttp.delete<void>(`cart/${cartId}/items`);
  }
}
