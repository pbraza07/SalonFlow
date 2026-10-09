// Catalog only. Paid checkout and access grants must never use client-supplied plan labels.
export const PLANS = {
 free:{name:'Free',monthlyCents:0,bookableStaff:1},
 professional:{name:'Professional',monthlyCents:2499,bookableStaff:3},
 business:{name:'Business',monthlyCents:6999,bookableStaff:10}
} as const;
export const AI_ADDON_MONTHLY_CENTS=4900;
export const MARKETPLACE_REFERRAL_PERCENT=10;
export const MARKETPLACE_MIN_CENTS=200;
export const MARKETPLACE_MAX_CENTS=1500;
export function referralFeeCents(serviceSubtotalCents:number):number {
 if(!Number.isSafeInteger(serviceSubtotalCents)||serviceSubtotalCents<0)throw new Error('Invalid service subtotal.');
 if(serviceSubtotalCents===0)return 0;
 return Math.min(MARKETPLACE_MAX_CENTS,Math.max(MARKETPLACE_MIN_CENTS,Math.round(serviceSubtotalCents*MARKETPLACE_REFERRAL_PERCENT/100)));
}
// Tips, taxes, retail items and refunds must be excluded upstream.
// This calculation does not charge a business or assert a referral is eligible.
