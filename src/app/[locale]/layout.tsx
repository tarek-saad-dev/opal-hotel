import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale } from "@/lib/hotel-content";
import { LocaleDocumentSync } from "@/components/LocaleDocumentSync";
import { CmsProvider } from "@/components/CmsProvider";
import { readPublished } from "@/lib/cms-store";

export const dynamic="force-dynamic";
type Props = { children: ReactNode; params: Promise<{ locale: string }> };
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const published=await readPublished();
  return <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><CmsProvider value={published}><LocaleDocumentSync locale={locale}>{children}</LocaleDocumentSync></CmsProvider></div>;
}
