import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isLocale } from "@/lib/hotel-content";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>;
}
