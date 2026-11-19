import { NextResponse,type NextRequest } from "next/server";
import { roomConcepts } from "@/lib/room-concepts";

/**
 * Next 16 streaming can emit a 200 "soft 404" after a dynamic page starts
 * rendering. Reject invalid /rooms/:slug before the App Router streams,
 * preserving a correct HTTP 404 for SEO and automated monitoring.
 *
 * This proxy does not fetch CMS data or intercept owner/admin requests.
 */
const knownSlugs=new Set(roomConcepts.map(room=>room.slug));
export function proxy(request:NextRequest){
  const match=request.nextUrl.pathname.match(/^\/(en|ar)\/rooms\/([^/]+)\/?$/);
  if(!match||knownSlugs.has(match[2]))return NextResponse.next();
  const locale=match[1];
  const ar=locale==="ar";
  const title=ar?"الصفحة غير موجودة":"Page not found";
  const headline=ar?"الرابط ده مش متاح.":"This page isn't here.";
  const message=ar?"تقدر ترجع للصفحة الرئيسية أو تستكشف تصورات الغرف.":
    "Return to the homepage or explore the room concepts.";
  const home=ar?"العودة للرئيسية":"Back to homepage";
  const rooms=ar?"استكشف الغرف":"Explore room concepts";
  const doc=`<!doctype html><html lang="${locale}" dir="${ar?"rtl":"ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>404 · OPAL LEGACY</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100svh;background:#19392b;color:#faf5e9;
font-family:Arial,Tahoma,sans-serif}.opal-recovery{min-height:100svh;display:flex;flex-direction:column}
.opal-recovery-top{display:flex;justify-content:space-between;gap:15px;align-items:center;
padding:27px clamp(20px,5vw,65px);border-bottom:1px solid #ffffff35}
.opal-recovery-brand{font-family:Georgia,serif;letter-spacing:.08em;font-size:25px}
.opal-recovery-top small{font-size:10px;letter-spacing:.1em;color:#cdb997}
.opal-recovery-body{flex:1;display:flex;flex-direction:column;align-items:flex-start;
justify-content:center;padding:65px clamp(20px,6vw,100px)}
.opal-recovery-index{letter-spacing:.15em;font-size:11px;font-weight:700;color:#cdb997}
h1{font-family:Georgia,Tahoma,serif;font-size:clamp(48px,8vw,100px);line-height:1.16;
font-weight:400;max-width:900px;letter-spacing:-.04em;margin:23px 0}
.opal-recovery-body>p:not(.opal-recovery-index){font-size:16px;line-height:1.8;
color:#d9ded4;max-width:540px}
.opal-recovery-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:36px}
.opal-recovery-actions a{color:#214133;background:#f5ead9;padding:15px 23px;
min-height:50px;display:inline-flex;align-items:center;text-decoration:none;font-size:13px;font-weight:700}
.opal-recovery-actions a.is-secondary{background:transparent;color:#fff;border:1px solid #d9c8ad}
a:focus-visible{outline:3px solid #e8c48d;outline-offset:3px}
.opal-recovery-foot{padding:25px clamp(20px,5vw,65px);border-top:1px solid #ffffff30;
color:#cbd7c9;font-size:12px}html[dir=rtl] h1{font-family:Tahoma,Arial,sans-serif;letter-spacing:0}
@media(max-width:600px){.opal-recovery-actions{width:100%;flex-direction:column}
.opal-recovery-actions a{width:100%;justify-content:center}}
</style></head><body><main class="opal-recovery">
<header class="opal-recovery-top"><strong class="opal-recovery-brand">OPAL LEGACY</strong><small>LUXOR · EGYPT</small></header>
<div class="opal-recovery-body"><p class="opal-recovery-index">404 / ${title}</p>
<h1>${headline}</h1><p>${message}</p>
<nav class="opal-recovery-actions" aria-label="${title}">
<a href="/${locale}">${home}</a>
<a href="/${locale}/rooms" class="is-secondary">${rooms}</a></nav></div>
<footer class="opal-recovery-foot">OPAL LEGACY · LUXOR</footer></main></body></html>`;
  return new NextResponse(doc,{status:404,headers:{
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"public, max-age=120",
    "X-Robots-Tag":"noindex, nofollow",
    "X-Content-Type-Options":"nosniff"
  }});
}
export const config={matcher:["/en/rooms/:path*","/ar/rooms/:path*"]};
