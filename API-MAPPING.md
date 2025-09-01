# API to Frontend Mapping

Maps backend endpoints to Angular feature folders and API client locations. This is scaffolding only—no components or code yet.

Public (Store)

- GET /health → core/http/ (health check util location)
- Categories → features/store/routes/childrenroutes/categories, api/public/categories
  - GET /categories
  - GET /categories/{slug}
- Products → features/store/routes/childrenroutes/products, api/public/products
  - GET /products
  - GET /products/{slug}
- Cart → features/store/routes/childrenroutes/cart, api/public/cart
  - POST /cart
  - GET /cart/{cartId}
  - POST /cart/{cartId}/items
  - PATCH /cart/{cartId}/items/{itemId}
  - DELETE /cart/{cartId}/items
  - DELETE /cart/{cartId}/items/{itemId}
- Delivery → features/store/routes/childrenroutes/delivery, api/public/delivery
  - POST /delivery/quote
- Orders → features/store/routes/childrenroutes/orders, api/public/orders
  - POST /orders/save
  - POST /orders/declare-payment
  - GET /orders/lookup/{orderCode}
  - GET /orders/{orderCode}

Admin

- Ping → core/http/ (admin health util location)
  - GET /admin/ping
- Categories → features/admin/routes/childrenroutes/categories, api/admin/categories
  - POST /admin/categories
  - GET /admin/categories
  - GET /admin/categories/{id}
  - PATCH /admin/categories/{id}
  - DELETE /admin/categories/{id}
- Products → features/admin/routes/childrenroutes/products, api/admin/products
  - POST /admin/products
  - GET /admin/products
  - GET /admin/products/{id}
  - PATCH /admin/products/{id}
  - DELETE /admin/products/{id}
  - POST /admin/products/{id}/media
  - DELETE /admin/products/{id}/media/{mediaId}
  - POST /admin/products/{id}/categories/{categoryId}
  - DELETE /admin/products/{id}/categories/{categoryId}
- Options & Variants → features/admin/routes/childrenroutes/{option-groups,variants}, api/admin/{option-groups,variants}
  - POST /admin/option-groups
  - GET /admin/option-groups
  - GET /admin/option-groups/{id}
  - POST /admin/option-groups/{groupId}/options
  - GET /admin/option-groups/{groupId}/options
  - DELETE /admin/options/{optionId}
  - POST /admin/products/{productId}/option-groups
  - DELETE /admin/products/{productId}/option-groups/{groupId}
  - POST /admin/products/{productId}/variants/generate
  - GET /admin/variants/{variantId}
  - PATCH /admin/variants/{variantId}
- Delivery Zones → features/admin/routes/childrenroutes/delivery-zones, api/admin/delivery-zones
  - POST /admin/delivery-zones
  - GET /admin/delivery-zones
  - GET /admin/delivery-zones/{id}
  - PATCH /admin/delivery-zones/{id}
  - DELETE /admin/delivery-zones/{id}
- Orders moderation → features/admin/routes/childrenroutes/orders, api/admin/orders
  - GET /admin/orders
  - GET /admin/orders/{id}
  - POST /admin/orders/{id}/under-review
  - POST /admin/orders/{id}/approve
  - POST /admin/orders/{id}/reject
- App Config → features/admin/routes/childrenroutes/config, api/admin/config
  - GET /admin/config
  - PATCH /admin/config

Notes

- Signals live under features/\*/state for each domain area.
- DTO mapping and fetch wrappers go in src/app/api; keep UI decoupled from transport shapes.
- SSR: use transfer cache and avoid direct window/document usage.
