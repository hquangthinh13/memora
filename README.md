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
