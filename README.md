# Memora

Memora is an Expo React Native app built with TypeScript, Expo Router, and npm.

## Run the App

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

You can then open the app in Expo Go, an emulator, or a development build.

## Supabase Auth

Required Supabase environment variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dee339rpr
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### Email OTP Signup

Email signup is the primary auth flow. OAuth/social login UI is temporarily
disabled while the email OTP flow is being stabilized; the OAuth service code is
kept so it can be re-enabled later without rebuilding the integration.

Signup is a three-step flow:

1. User enters email.
2. The app sends an OTP using:

```ts
supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
  },
});
```

3. The app routes to `/verify-otp` and verifies the 6-digit code with:

```ts
supabase.auth.verifyOtp({
  email,
  token: code,
  type: "email",
});
```

4. OTP verification creates a Supabase session, but signup is not complete yet.
5. The app routes to `/setup-password`.
6. User sets and confirms a password.
7. The app saves the password with `supabase.auth.updateUser({ password })`,
   marks account setup as complete, then routes into the authenticated app.

Supabase Dashboard setup:

- Authentication > Email Templates > Magic Link: include the OTP token in the
  email body.

```html
<p>Your Memora confirmation code is: {{ .Token }}</p>
```

- Do not rely on `{{ .ConfirmationURL }}` for OTP signup in the mobile app.
  Users can open email on any device, read the code, then enter it in Memora.
- `supabase.auth.signUp(email, password)` is a separate password signup flow. It
  uses the Confirm signup template and sends a confirmation link unless email
  confirmations are disabled.
- Existing password login remains separate on the Login screen.

### Google OAuth Redirects

The app uses Expo deep linking with the native scheme `memora` for Google OAuth.
Native development/production builds send this Supabase OAuth `redirectTo`
value:

```text
memora://auth/callback
```

Expo Go cannot receive `memora://` links because the Expo Go app does not
register this project's custom scheme. When running Google OAuth in Expo Go, the
app uses the `exp://.../--/auth/callback` URL produced by `makeRedirectUri()`
without a custom scheme. Do not use a localhost redirect for Expo React Native
auth flows.

Supabase Dashboard setup:

- Authentication > Providers > Google: enable Google and add the Google Client
  ID and Client Secret.
- Authentication > URL Configuration > Redirect URLs: add `memora://**`.
- If testing in Expo Go, also add the exact `exp://.../--/auth/callback`
  redirect URL printed/used by Expo for your current dev server. This URL can
  change when the dev server host or port changes.
- Site URL can stay on your hosted web URL for production, but native OAuth
  return URLs should use the `memora` app scheme.

Google Cloud Console setup:

- Authorized redirect URI must be the Supabase callback URL:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

For this project:

```text
https://zqrtzryfqgijiklxhstp.supabase.co/auth/v1/callback
```

Development and production:

- Development native builds use `memora://**` for Google OAuth.
- Expo Go uses an `exp://.../--/auth/callback` URL, which can change when the
  dev server host changes, for Google OAuth only. If the browser stays on a
  blank Supabase page after Google succeeds, the current app likely cannot open
  the redirect URL being returned.
- Production native builds also use `memora://**` unless the app scheme changes.
- If a production web app is added later, add that HTTPS domain separately in
  Supabase Redirect URLs and do not reuse localhost for production OAuth.

## Styling

NativeWind is configured for TailwindCSS-style utility classes in React Native.
The main styling setup lives in `tailwind.config.js`, `babel.config.js`,
`metro.config.js`, `global.css`, and `nativewind-env.d.ts`.

## App Navigation

Authenticated app screens use Expo Router tabs:

- Home: dashboard, progress summary, quick actions, and recent decks.
- Rooms: create a live study room, join by room code, and view open rooms.
- My Library: owned, shared, collaborative, public, and saved-readable decks.
- My Profile: profile summary, friends count, published decks, saved decks, and collaborative decks.

Auth screens stay outside the tab layout. Deck detail, deck edit/create, card
edit/create, study, and room play/result routes are hidden from the tab bar and
opened from the main tabs.

## Database Model

The app uses `public.users` as the profile table. The latest migration adds:

- `decks.cover_image_url`, while keeping existing `cover_url` compatible.
- `decks.cover_image_public_id`, used to clean up Cloudinary assets securely.
- `friendships` for pending/accepted/rejected/blocked friend relationships.
- `deck_collaborators` for deck roles: owner, editor, and viewer.
- `saved_decks` for user-saved readable decks.

RLS keeps the MVP permission model simple:

- users can see friendships where they are requester or addressee
- users can create/cancel their own friend requests
- deck owners can invite/remove collaborators
- accepted collaborators can read decks and cards
- editors can create/update/delete cards
- only deck owners can update/delete deck records
- joinable waiting rooms are readable so users can resolve a room code before
  joining

Run migrations locally or apply the migration to the connected Supabase project,
then regenerate `src/types/database.ts` from Supabase types or update it to match
the migration.

## Current MVP Limits

- OAuth/social login UI is intentionally hidden while email OTP auth is primary.
- Invite friends and friend discovery have schema support, but only lightweight UI
  entry points are present.
- Realtime room play remains client-authoritative for now.
- Streak and accuracy are placeholders until richer study analytics are added.

## Cloudinary Deck Covers

Deck cover images are uploaded to Cloudinary from the Expo app with an unsigned
upload preset. The app stores both Cloudinary values on the deck:

- `cover_image_url`: the `secure_url` used by Home, My Library, and Deck Detail.
- `cover_image_public_id`: the Cloudinary `public_id` used for secure deletion.

Client-side uploads use only public Expo env vars. Do not add Cloudinary API
secrets to `.env`, `.env.example`, or any `EXPO_PUBLIC_` variable.

### Unsigned Upload Preset

In Cloudinary Dashboard:

1. Open Settings > Upload.
2. Create an unsigned upload preset.
3. Restrict it to image formats only.
4. Set a max file size if available.
5. Use the folder `memora/deck`.
6. Copy the preset name into `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

Deck cover uploads also send `folder: "memora/deck"` in the request, so uploaded
assets stay organized under:

```text
memora/deck
```

### Secure Deletion

Image deletion is handled by the Supabase Edge Function
`delete-cloudinary-image`. Configure these function secrets in Supabase, not in
the Expo app:

```bash
CLOUDINARY_CLOUD_NAME=dee339rpr
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

The Edge Function requires an authenticated user, checks that the user owns the
deck or has accepted owner/editor collaborator access, then deletes the
Cloudinary `public_id`.

Deploy the function after logging in with the Supabase CLI:

```bash
supabase login
supabase functions deploy delete-cloudinary-image --project-ref zqrtzryfqgijiklxhstp
```

Set the required secrets:

```bash
supabase secrets set CLOUDINARY_CLOUD_NAME=dee339rpr --project-ref zqrtzryfqgijiklxhstp
supabase secrets set CLOUDINARY_API_KEY=your_cloudinary_api_key --project-ref zqrtzryfqgijiklxhstp
supabase secrets set CLOUDINARY_API_SECRET=your_cloudinary_api_secret --project-ref zqrtzryfqgijiklxhstp
```

For production, prefer moving uploads to a signed backend path or Supabase Edge
Function as well, so upload constraints can be enforced server-side.
