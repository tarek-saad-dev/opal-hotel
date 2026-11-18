"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/hotel-content";

/**
 * The Next root layout hosts the / → /en redirect and cannot receive a
 * dynamic [locale] param. Keep document-level assistive technology hints
 * accurate after client hydration / cross-locale navigation; our server
 * renders each translated page with its own localized lang+dir wrapper.
 */
export function LocaleDocumentSync({locale,children}:{locale:Locale;children:ReactNode}) {
  useEffect(()=>{
    document.documentElement.lang=locale;
    document.documentElement.dir=locale==="ar"?"rtl":"ltr";
  },[locale]);
  return <>{children}</>;
}
