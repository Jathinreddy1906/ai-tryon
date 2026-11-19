# TRYVORA

**Your style. Your fit. Your try-on.**

TRYVORA is a fashion discovery and virtual try-on product in development. It currently includes a responsive Next.js public experience, a Supabase-backed fashion catalogue, and the first account/database foundation. AI try-on remains unavailable until a real inference service is selected, configured, and validated; the interface does not fabricate inference results.

## Current implementation

- Responsive landing, Discover, product details, About, Contact, and AI Studio-unavailable pages.
- Warm-neutral visual system with a persistent light/dark theme toggle.
- Supabase catalogue schema for categories and products, including publication status, tags, prices, sizes, colours, and sample-data labels.
- Catalogue search, category/designer/colour/maximum-price filters, sorting, pagination, product details, and similar-item suggestions.
- Clearly labelled illustrative sample mode when Supabase is not configured. When configured, only published database products are shown; catalogue/database errors are surfaced rather than silently replaced with sample listings.
- Zod-validated contact form. Set `NEXT_PUBLIC_CONTACT_EMAIL` to launch a prefilled message in the visitor's email application; without it, contact delivery stays disabled.
- Supabase SSR authentication foundation: password sign-in and signup, optional Google sign-in, email verification callback, password reset/update, protected account page, and sign-out.
- Private personal-photo management for signed-in accounts: JPG/PNG/WebP validation, crop/rotate controls, normalized JPEG processing, upload progress, replacement, deletion, and short-lived signed previews.
- Optional FastAPI/MediaPipe pose-readiness service foundation. It performs non-generative pose suitability checks only and is never a fabricated try-on result.
- Gated hosted AI try-on integration with FASHN Virtual Try-On v1.6: server-only provider credentials, adult/own-photo/third-party-processing attestations, live non-sample garment checks, per-user request limits, status polling, and ephemeral results.
- Supabase migrations for owner-scoped profiles/preferences, public read-only access to active categories and published products, private personal-photo storage, and owner-restricted try-on job/consent records.
- Optional SQL seed script for illustrative sample products, clearly marked as samples.
- Focused unit tests for catalogue search, filtering, and sorting.

Apply the migrations before using the live catalogue, account, photo, or try-on job data. Try-on remains disabled unless explicitly enabled and all service requirements are configured. Pose/body-suitability checks require the separately configured FastAPI/MediaPipe service. Persistent favourites and production contact-message delivery are not implemented.

## Technology

- Next.js App Router, React, TypeScript
- Tailwind CSS v4 and shadcn/ui (base-nova)
- Supabase Auth, PostgreSQL, and SSR helpers
- Python FastAPI and MediaPipe for optional pose readiness; FASHN API for gated hosted inference
- Lucide React, Framer Motion, React Hook Form, and Zod
- Vitest for focused unit tests

## Local development

Use Node.js 20.9 or newer.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set the following public project values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use the Supabase project's publishable key (or legacy anon key), never a `service_role` key in this browser-accessible app. `NEXT_PUBLIC_CONTACT_EMAIL` is optional and can remain blank.

### Supabase setup

1. Create a Supabase project and copy its project URL and publishable key into `.env.local`.
2. On a new project, apply [`supabase/migrations/20261118000100_profiles_and_preferences.sql`](./supabase/migrations/20261118000100_profiles_and_preferences.sql), [`supabase/migrations/20261118000200_fashion_catalogue.sql`](./supabase/migrations/20261118000200_fashion_catalogue.sql), [`supabase/migrations/20261118000300_person_photo_storage.sql`](./supabase/migrations/20261118000300_person_photo_storage.sql), [`supabase/migrations/20261119000400_try_on_jobs.sql`](./supabase/migrations/20261119000400_try_on_jobs.sql), and [`supabase/migrations/20261119000500_product_try_on_eligibility.sql`](./supabase/migrations/20261119000500_product_try_on_eligibility.sql) in order in the Supabase SQL Editor. If earlier migrations are already applied, apply only the remaining migrations.
3. To enable photo management, set `SUPABASE_SERVICE_ROLE_KEY` in the server's `.env.local` using the Supabase project's service role key. Keep it server-only: never add the `NEXT_PUBLIC_` prefix, expose it to browser code, or commit it. The photo feature remains unavailable until both the private bucket migration and this key are configured.
4. Optionally run [`supabase/seed.sql`](./supabase/seed.sql) to load clearly labelled illustrative categories and sample products.
5. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. For deployment, set `NEXT_PUBLIC_SITE_URL` to the deployed origin and add its `/auth/callback` URL as well.
6. Configure email confirmation and password recovery email delivery in Supabase Auth. The app expects the verification and recovery links to return through `/auth/callback`.
7. To enable Google sign-in, enable the Google provider under **Authentication → Providers** and configure its provider credentials. Use the Supabase project callback URL shown by the provider settings as the OAuth redirect URI in Google Cloud.
8. Restart the Next.js server after changing `.env.local`.

Photo management stores one private image per account. Uploads accept JPG, PNG, and WebP files up to 10 MB and 8192 pixels per side; the server verifies and converts them to metadata-stripped JPEGs no larger than 2048 pixels per side. Signed preview URLs expire after 10 minutes and refresh while the photo page is open. Users can replace or delete their photo from `/account/photos`. Pose suitability can be checked using the separate Phase 6 service; photo storage and pose checks do not run try-on inference. Photos are not used to train models.

### Hosted AI try-on (Phase 7)

The AI Studio uses FASHN Virtual Try-On v1.6, the provider's stable, lower-cost endpoint (one output credit per request; the integration uses performance mode and one JPEG output). It only accepts a published, non-sample catalogue product whose `try_on_eligible` flag has been explicitly set after confirming image rights, and the user's own private photo. FASHN credentials are server-only. Add `FASHN_API_KEY` and set `TRYVORA_AI_TRYON_ENABLED=true` only after configuring the migrations, photo storage, provider account/credits, and deployment settings. With the default `false` flag or no key, generation is unavailable and no image is sent externally.

Each generation requires the user to attest that they are at least 18, that the image is their own and they consent to its use, and that they consent to FASHN processing. The app sends the personal photo as base64 (so its private URL is not included in FASHN request history) and sends the selected public catalogue image URL. Results are returned as base64, held only in page memory, and not saved to TRYVORA storage. FASHN documents that request records (which may include the public garment URL and request parameters) are not automatically deleted, input processing copies have a one-day cleanup backstop, and base64 outputs expire after 60 minutes. Processing may involve its listed subprocessors in the US, EU, and global regions, including Southeast Asia. FASHN states that customer content is not used to train models unless separately opted in. Review the current [retention documentation](https://docs.fashn.ai/api-overview/data-retention-privacy), [subprocessor list](https://fashn.ai/legal/subprocessors), [DPA](https://fashn.ai/legal/dpa), and [terms](https://fashn.ai/legal/terms-of-service) before enabling the feature.

The backend permits one active job and a maximum of three requests per user in any 24-hour period. Results are explicitly estimates, not fit/size guarantees. User photo deletion does not delete provider request records; provider deletion requests must follow FASHN's documented process.

Products are not try-on eligible by default. After confirming that TRYVORA has the rights to submit a specific product image to FASHN, an administrator can enable an eligible published item:

```sql
update public.products
set try_on_eligible = true
where slug = '<approved-product-slug>'
  and publication_status = 'published'
  and is_sample = false;
```

### Pose-preparation service

Phase 6 provides a separately deployed FastAPI/MediaPipe pose-readiness foundation under [`python/pose-service/`](./python/pose-service). It accepts a validated private-photo JPEG, checks visible landmarks and basic framing, and returns a readiness assessment. It does not generate clothing, modify the garment in an image, or report a virtual try-on result.

```powershell
cd python/pose-service
py -m pip install -r requirements.txt
py scripts/download_pose_model.py
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Set `TRYVORA_POSE_SERVICE_URL=http://127.0.0.1:8001` and a long random `TRYVORA_POSE_SERVICE_KEY` in both the Next.js server environment and the FastAPI service environment. The service key is required and must remain server-only. The Next.js `/api/pose/readiness` route authenticates the signed-in user, retrieves only that user's private photo, and forwards it to the FastAPI service. If no compatible model or service is configured, the UI remains explicit and AI generation stays disabled.

Authentication routes: `/login`, `/signup`, `/forgot-password`, `/account`, and `/account/photos`. Without the Supabase URL and publishable/anon key, forms are disabled and the storefront uses labelled local sample data. Do not send project secrets through chat or commit them to the repository.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Sample imagery

The visual preview references images hosted by Unsplash at `images.unsplash.com`. Catalogue names, descriptions, prices, and testimonials are illustrative sample content, not live offers or customer reviews.

## Planned architecture

The current architecture uses a Vercel-hosted Next.js app, Supabase Auth/PostgreSQL/Storage, an optional separate FastAPI pose service, and a gated FASHN hosted inference API. Generation is disabled by default; deployment is not claimed complete. Before enabling for end users, configure and test migrations, account billing, secrets, product-image rights, data-protection obligations, provider terms, and output quality. Do not claim that generated previews guarantee fit or size.
