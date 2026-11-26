import type { Accommodation,DayUse } from "@/lib/opal-api";
export type ProductKind="day_use"|"bubble_stay";
export type PoolsideProduct=DayUse|Accommodation;
export function productSlug(product:PoolsideProduct){return "slug" in product?product.slug:product.slug_en;}
export function productPath(locale:string,kind:ProductKind,slug:string){return "/"+locale+"/experiences/"+(kind==="day_use"?"day-use":"overnight")+"/"+encodeURIComponent(slug);}
export function bookingPath(locale:string,kind:ProductKind,slug:string){return "/"+locale+"/booking?"+new URLSearchParams({product:kind,slug});}
export function validProductSlug(slug:string){return /^[a-z0-9][a-z0-9-]{0,159}$/.test(slug);}
