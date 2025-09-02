// src/app/shared/icons.ts
import { provideIcons } from '@ng-icons/core';
import { NgIconComponent } from '@ng-icons/core';

// // Lucide (outline, crisp)
// import {
//   lucideShoppingCart, lucideSearch, lucideChevronRight, lucideTrash2,
//   lucidePackage, lucideCheckCircle2, lucideXCircle, lucideBanknote
// } from '@ng-icons/lucide';

// // Heroicons (nice fills for states if you want)
// import { heroCheckCircleSolid, heroXCircleSolid } from '@ng-icons/heroicons';

// // Simple Icons (brands)
// import { siWhatsapp, siInstagram } from '@ng-icons/simple-icons';

export const ICON_PROVIDERS = [
  provideIcons({
    // lucideShoppingCart, lucideSearch, lucideChevronRight, lucideTrash2,
    // lucidePackage, lucideCheckCircle2, lucideXCircle, lucideBanknote,
    // heroCheckCircleSolid, heroXCircleSolid,
    // siWhatsapp, siInstagram,
  }),
];

// Re-export to use in components’ `imports`
export { NgIconComponent };
