"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Locale } from "@/lib/hotel-content";
import {
  type RangeDraft, addDays, addMonths, formatFull, formatLong, formatMonth, formatShort,
  monthGrid, monthOf, nightsCount, nightsLabel, pickDay, shiftMonthDay, toStamp, weekdayLabels,
} from "@/lib/date-range";

type Props = {
  locale: Locale;
  checkin: string;
  checkout: string;
  /** Earliest selectable day (today). Empty until the client knows the date. */
  min: string;
  onChange: (range: { checkin: string; checkout: string }) => void;
  /** "ribbon" = homepage booking bar, "page" = booking page step 1. */
  variant: "ribbon" | "page";
  labels: { checkin: string; checkout: string };
  /** ids for the two triggers (kept stable for tests and anchors). */
  ids?: { checkin: string; checkout: string };
  /** Render hidden inputs named checkin/checkout carrying the committed values. */
  named?: boolean;
};

const MAX_MONTHS_AHEAD = 18;

function CalendarIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.55"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="16" rx="1.5" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
  </svg>;
}

function Chevron({ back }: { back?: boolean }) {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"
    className={back ? "opal-dp-chevron is-back" : "opal-dp-chevron"}>
    <path d="m9 5 7 7-7 7" />
  </svg>;
}

export function DateRangePicker({ locale, checkin, checkout, min, onChange, variant, labels, ids, named }: Props) {
  const ar = locale === "ar";
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeDraft>({ checkin, checkout, picking: "checkin" });
  const [hover, setHover] = useState("");
  const [focusDay, setFocusDay] = useState("");
  const [month, setMonth] = useState("");
  const [compact, setCompact] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const checkinRef = useRef<HTMLButtonElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<"checkin" | "checkout">("checkin");

  const t = ar ? {
    title: "اختر تاريخ الوصول والمغادرة", pickIn: "اختر تاريخ الوصول", pickOut: "اختر الآن تاريخ المغادرة",
    prev: "الشهر السابق", next: "الشهر التالي", close: "إغلاق", done: "تم", clear: "مسح",
    checkinMark: "الوصول", checkoutMark: "المغادرة", unavailable: "غير متاح", choose: "اختر",
  } : {
    title: "Choose your check-in and check-out dates", pickIn: "Choose your check-in date", pickOut: "Now choose your check-out date",
    prev: "Previous month", next: "Next month", close: "Close", done: "Done", clear: "Clear",
    checkinMark: "check-in", checkoutMark: "check-out", unavailable: "unavailable", choose: "Choose",
  };

  const firstMonth = monthOf(min);
  const lastMonth = firstMonth ? addMonths(firstMonth, MAX_MONTHS_AHEAD) : "";
  const shownMonths = compact ? 1 : 2;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function openFor(field: "checkin" | "checkout") {
    returnTo.current = field;
    const start = field === "checkout" && checkout ? checkout : checkin || min;
    setDraft({ checkin, checkout, picking: field === "checkout" && checkin ? "checkout" : "checkin" });
    setHover("");
    setFocusDay(start);
    setMonth(monthOf(field === "checkout" && checkin ? checkin : start) || firstMonth);
    setOpen(true);
  }

  function close(commit: boolean) {
    if (commit && draft.checkin) {
      // A lone arrival becomes a one-night stay rather than being dropped.
      const out = draft.checkout && draft.checkout > draft.checkin ? draft.checkout : addDays(draft.checkin, 1);
      onChange({ checkin: draft.checkin, checkout: out });
    }
    setOpen(false);
    requestAnimationFrame(() =>
      (returnTo.current === "checkout" ? checkoutRef : checkinRef).current?.focus({ preventScroll: true }));
  }

  // Focus the active day whenever it changes while open.
  useEffect(() => {
    if (!open || !focusDay) return;
    const button = panelRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`);
    button?.focus({ preventScroll: true });
  }, [open, focusDay, month]);

  // Outside click closes and keeps what was chosen; Escape cancels.
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(true);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); close(false); return; }
      // The phone sheet is modal: keep Tab inside it.
      if (event.key !== "Tab" || !compact || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)"))
        .filter(item => item.tabIndex !== -1);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  });

  // The mobile sheet locks the page behind it.
  useEffect(() => {
    if (!open || !compact) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open, compact]);

  function choose(day: string) {
    const next = pickDay(draft, day);
    setDraft(next);
    setFocusDay(day);
    if (next.checkin && next.checkout && draft.picking === "checkout" && next.checkout === day) {
      onChange({ checkin: next.checkin, checkout: next.checkout });
      returnTo.current = "checkout";
      // Leave the finished range on screen for a moment before closing.
      window.setTimeout(() => {
        setOpen(false);
        requestAnimationFrame(() => checkoutRef.current?.focus({ preventScroll: true }));
      }, 260);
    }
  }

  function moveFocus(target: string) {
    if (toStamp(target) === null || (min && target < min)) return;
    if (lastMonth && monthOf(target) > lastMonth) return;
    setFocusDay(target);
    const visibleEnd = addMonths(month, shownMonths - 1);
    if (monthOf(target) < month) setMonth(monthOf(target));
    else if (monthOf(target) > visibleEnd) setMonth(addMonths(monthOf(target), -(shownMonths - 1)));
  }

  function onGridKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!focusDay) return;
    const dir = ar ? -1 : 1;
    const map: Record<string, number> = { ArrowRight: dir, ArrowLeft: -dir, ArrowDown: 7, ArrowUp: -7 };
    if (event.key in map) { event.preventDefault(); moveFocus(addDays(focusDay, map[event.key])); }
    else if (event.key === "PageDown") { event.preventDefault(); moveFocus(shiftMonthDay(focusDay, 1)); }
    else if (event.key === "PageUp") { event.preventDefault(); moveFocus(shiftMonthDay(focusDay, -1)); }
  }

  const previewEnd = draft.picking === "checkout" && draft.checkin && !draft.checkout && hover > draft.checkin ? hover : "";
  const rangeEnd = draft.checkout || previewEnd;
  const draftNights = nightsCount(draft.checkin, draft.checkout || previewEnd);
  const canPrev = !firstMonth || month > firstMonth;
  const canNext = !lastMonth || addMonths(month, shownMonths - 1) < lastMonth;
  const weekdays = weekdayLabels(locale);

  function dayState(day: string) {
    const disabled = Boolean(min && day < min);
    const isIn = day === draft.checkin;
    const isOut = day === draft.checkout || (!draft.checkout && day === previewEnd);
    const between = Boolean(draft.checkin && rangeEnd && day > draft.checkin && day < rangeEnd);
    return { disabled, isIn, isOut, between };
  }

  const triggers = (["checkin", "checkout"] as const).map(field => {
    const value = field === "checkin" ? checkin : checkout;
    const ref = field === "checkin" ? checkinRef : checkoutRef;
    const active = open && draft.picking === field;
    return variant === "ribbon"
      ? <button key={field} type="button" ref={ref} id={ids?.[field]}
          className={`premium-date-cell opal-dp-trigger${active ? " is-active" : ""}`}
          aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined}
          aria-label={`${labels[field]}: ${value ? formatFull(value, locale) : t.choose}`}
          onClick={() => open && draft.picking === field ? close(true) : openFor(field)}>
          <span className="premium-field-icon"><CalendarIcon /></span>
          <span className="premium-field-copy">
            <span className="premium-field-label">{labels[field]}</span>
            <strong>{value ? formatLong(value, locale) : "—"}</strong>
          </span>
        </button>
      : <div key={field} className="opal-dp-page-field">
          <span className="opal-dp-page-label" id={`${dialogId}-${field}-label`}>{labels[field]}</span>
          <button type="button" ref={ref} id={ids?.[field]}
            className={`opal-dp-page-trigger${active ? " is-active" : ""}`}
            aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined}
            aria-label={`${labels[field]}: ${value ? formatFull(value, locale) : t.choose}`}
            onClick={() => open && draft.picking === field ? close(true) : openFor(field)}>
            <span>{value ? formatLong(value, locale) : "—"}</span>
            <CalendarIcon />
          </button>
        </div>;
  });

  const backdrop = <div className="opal-dp-backdrop" aria-hidden="true" />;
  const panel = (
      <div ref={panelRef} id={dialogId} className="opal-dp-panel" role="dialog" aria-modal={compact || undefined}
        aria-label={t.title} dir={ar ? "rtl" : "ltr"} lang={locale}>
        <div className="opal-dp-head">
          <p className="opal-dp-prompt" aria-live="polite">{draft.picking === "checkout" ? t.pickOut : t.pickIn}</p>
          {compact && <button type="button" className="opal-dp-close" onClick={() => close(true)} aria-label={t.close}>×</button>}
        </div>
        <div className="opal-dp-months" onKeyDown={onGridKey}>
          <button type="button" className="opal-dp-nav is-prev" disabled={!canPrev}
            onClick={() => setMonth(m => addMonths(m, -1))} aria-label={t.prev}><Chevron back /></button>
          <button type="button" className="opal-dp-nav is-next" disabled={!canNext}
            onClick={() => setMonth(m => addMonths(m, 1))} aria-label={t.next}><Chevron /></button>
          {Array.from({ length: shownMonths }, (_, i) => addMonths(month, i)).map(m =>
            <div className="opal-dp-month" key={m}>
              <h3 className="opal-dp-month-title" id={`${dialogId}-${m}`}>{formatMonth(m, locale)}</h3>
              <table className="opal-dp-grid" role="grid" aria-labelledby={`${dialogId}-${m}`}>
                <thead><tr>{weekdays.map((w, i) => <th key={i} scope="col" abbr={w}>{w}</th>)}</tr></thead>
                <tbody>{monthGrid(m, locale).map((row, r) =>
                  <tr key={r}>{row.map((day, c) => {
                    if (!day) return <td key={c} className="opal-dp-empty" />;
                    const s = dayState(day);
                    const marks = [s.isIn && t.checkinMark, s.isOut && t.checkoutMark, s.disabled && t.unavailable].filter(Boolean).join("، ");
                    return <td key={c} className={[s.between && "is-between", s.isIn && "is-start",
                      s.isOut && "is-end", s.isIn && rangeEnd && "has-range"].filter(Boolean).join(" ") || undefined}>
                      <button type="button" data-day={day} disabled={s.disabled}
                        tabIndex={day === focusDay ? 0 : -1}
                        aria-pressed={s.isIn || s.isOut}
                        aria-label={`${formatFull(day, locale)}${marks ? ` (${marks})` : ""}`}
                        onClick={() => choose(day)}
                        onMouseEnter={() => setHover(day)} onFocus={() => setHover(day)}>
                        {Number(day.slice(8))}
                      </button>
                    </td>;
                  })}</tr>)}
                </tbody>
              </table>
            </div>)}
        </div>
        <div className="opal-dp-foot">
          <p className="opal-dp-summary" aria-live="polite">
            {draft.checkin
              ? <>{formatShort(draft.checkin, locale)} — {draft.checkout || previewEnd ? formatShort(draft.checkout || previewEnd, locale) : "…"}
                  {draftNights > 0 && <strong> · {nightsLabel(draftNights, locale)}</strong>}</>
              : t.pickIn}
          </p>
          <div className="opal-dp-actions">
            <button type="button" className="opal-dp-clear"
              onClick={() => { setDraft({ checkin: "", checkout: "", picking: "checkin" }); setHover(""); }}>{t.clear}</button>
            <button type="button" className="opal-dp-done" onClick={() => close(true)}
              disabled={!draft.checkin}>{t.done}</button>
          </div>
        </div>
      </div>
  );

  return <div ref={rootRef} className={`opal-dp opal-dp-${variant}${open ? " is-open" : ""}`}>
    {triggers}
    {named && <>
      <input type="hidden" name="checkin" value={checkin} />
      <input type="hidden" name="checkout" value={checkout} />
    </>}
    {open && (compact && typeof document !== "undefined"
      // On phones the sheet lives on <body> so no ancestor stacking context
      // (the booking ribbon, sticky header) can clip or cover it.
      ? createPortal(<>{backdrop}{panel}</>, document.body)
      : panel)}
  </div>;
}
