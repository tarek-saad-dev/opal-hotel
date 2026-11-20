/**
 * Public website → backend API.
 *
 * Every guest-facing form (booking request, contact, review) goes through this
 * module. The backend is not part of this repository yet; see
 * docs/BACKEND_API.md for the contract it must implement.
 *
 * Configure the base URL with NEXT_PUBLIC_API_BASE_URL (for example
 * "https://api.opal-legacy.com/v1"). Without it, requests go to the same
 * origin under /api/v1, so the backend can also be mounted behind the same
 * domain by a reverse proxy.
 */
import type { Locale } from "@/lib/hotel-content";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15000;

export type BookingRequestPayload = {
  locale: Locale;
  checkin: string;          // YYYY-MM-DD
  checkout: string;         // YYYY-MM-DD
  adults: number;
  children: number;
  rooms: number;            // 1–2 (more → group booking via contact form)
  roomType: string;         // slug from src/lib/room-types.ts, or "" for no preference
  guest: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
  };
  arrivalTime: string;      // free text, optional ("" when not given)
  notes: string;            // optional
};

export type ContactMessagePayload = {
  locale: Locale;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
};
export const contactSubjects = ["booking_question","change_booking","cancel_booking","hotel_info","group_booking","other"] as const;
export type ContactSubject = typeof contactSubjects[number];

export type ReviewPayload = {
  locale: Locale;
  name: string;
  email: string;            // not published; lets the hotel verify the stay
  rating: number;           // 1–10
  visitMonth: string;       // YYYY-MM or ""
  story: string;            // overall impression
  pros: string;             // optional
  cons: string;             // optional
};

export type ApiErrorCode = "validation" | "rate_limited" | "server" | "network";
export type ApiResult =
  | { ok: true; reference: string | null }
  | { ok: false; error: ApiErrorCode; fields: Record<string, string> };

async function post(path: string, body: unknown): Promise<ApiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(API_BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
    if (response.ok) {
      return { ok: true, reference: typeof record.reference === "string" ? record.reference : null };
    }
    const fields = record.fields && typeof record.fields === "object"
      ? Object.fromEntries(Object.entries(record.fields as Record<string, unknown>)
          .filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    const error: ApiErrorCode = response.status === 422 || response.status === 400 ? "validation"
      : response.status === 429 ? "rate_limited" : "server";
    return { ok: false, error, fields };
  } catch {
    return { ok: false, error: "network", fields: {} };
  } finally {
    clearTimeout(timer);
  }
}

export const submitBookingRequest = (payload: BookingRequestPayload) => post("/booking-requests", payload);
export const submitContactMessage = (payload: ContactMessagePayload) => post("/contact-messages", payload);
export const submitReview = (payload: ReviewPayload) => post("/reviews", payload);

/** Guest-facing message for a failed submission. */
export function apiErrorMessage(error: ApiErrorCode, locale: Locale): string {
  const ar = locale === "ar";
  switch (error) {
    case "validation":
      return ar ? "من فضلك راجع البيانات المكتوبة وحاول مرة أخرى." : "Please check the details you entered and try again.";
    case "rate_limited":
      return ar ? "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل." : "Too many attempts. Please try again in a few minutes.";
    default:
      return ar ? "تعذّر الإرسال الآن. يُرجى المحاولة مرة أخرى بعد قليل." : "We couldn't send this right now. Please try again in a moment.";
  }
}
