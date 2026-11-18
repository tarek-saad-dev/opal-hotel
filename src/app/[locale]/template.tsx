import type { ReactNode } from "react";

export default function LocaleRouteTemplate({children}:{children:ReactNode}) {
  // App Router templates remount on navigation, allowing small route-level
  // transitions without changing the state of the surrounding locale layout.
  return <div className="opal-route-transition">{children}</div>;
}
