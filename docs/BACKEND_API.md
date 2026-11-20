# Backend API contract (public website)

The website calls the backend for three guest actions. All calls are made from
the browser by `src/lib/api-client.ts`.

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (build-time env var). When it is not
  set, the site calls the same origin under `/api/v1`.
- **Method / format:** `POST`, `Content-Type: application/json`, response JSON.
- **CORS:** if the API runs on another origin, allow the website origin for
  `POST` with the `Content-Type` header.
- **Timeout:** the site gives up after 15 s and shows a "try again" message.

## Responses

| Status | Meaning on the site |
| --- | --- |
| `2xx` | Success. Optional body `{ "reference": "OPL-2026-00123" }` is shown to the guest (booking). |
| `400` / `422` | Validation error. Optional body `{ "fields": { "email": "Invalid email" } }`. Guest sees "check the details". |
| `429` | Rate limited. Guest sees "too many attempts". |
| other / network error | Guest sees "couldn't send, try again". |

The site never shows a success message unless the API returns `2xx`.

## `POST /booking-requests`

A reservation **request**: the hotel confirms availability and price by email
afterwards. No payment is taken on the website.

```json
{
  "locale": "en",
  "checkin": "2026-12-20",
  "checkout": "2026-12-23",
  "adults": 2,
  "children": 1,
  "guest": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+20 100 000 0000",
    "country": "Egypt"
  },
  "arrivalTime": "11:00",
  "notes": "Cot please"
}
```

Validation the site already applies (the API must re-validate):
- `checkin` ≥ today (hotel local date), `checkout` > `checkin`, both `YYYY-MM-DD`
- `adults` 1–8, `children` 0–6
- `fullName` ≥ 2 chars (max 120), `email` valid (max 254), `phone` 7–20 chars of `+ ( ) digits space -`
- `country` ≤ 80, `arrivalTime` ≤ 40, `notes` ≤ 1000 (all optional, `""` when empty)

Suggested backend behaviour: store the request with status `new`, email the
hotel team, send the guest an acknowledgement email, return a `reference`.

## `POST /contact-messages`

```json
{ "locale": "ar", "name": "…", "email": "…", "subject": "…", "message": "…" }
```

Limits: `name` ≤ 100, `email` ≤ 254, `subject` ≤ 160, `message` ≤ 2000, all required.

## `POST /reviews`

```json
{ "locale": "en", "name": "…", "rating": 9, "visitMonth": "2026-10", "story": "…" }
```

- `rating` integer 1–10 (required), `visitMonth` `YYYY-MM` not in the future or `""`
- `name` ≤ 100, `story` ≤ 1200 (required)
- The site tells guests that reviews are checked before publishing, so new
  reviews should be stored as `pending` and published from the dashboard.

## Dashboard (suggested)

The dashboard should list booking requests (filter by status: new / confirmed /
declined), contact messages and pending reviews, with the ability to reply by
email and approve/reject reviews.
