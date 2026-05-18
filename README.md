# StayNest

Stayhub is a full-stack stay listing app built with Express, EJS, MongoDB, Mongoose, and Passport. Users can sign up, log in, create listings, edit their own listings, and leave reviews on stays.

## What Improved

- Session and database config now come from environment variables instead of hardcoded values.
- Authentication now supports email/password, Google OAuth, and phone-number OTP flows.
- Review deletion is restricted to the review author.
- Redirect-after-login flow is cleaned up so old redirect URLs do not linger in session.
- Listing, review, and signup payloads now have stronger server-side validation.
- Listing creation redirects directly to the new listing page.
- Project scripts and ignore rules are cleaner for daily development.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```powershell
$env:MONGO_URL="mongodb://127.0.0.1:27017/staynest"
$env:SESSION_SECRET="replace-this-with-a-long-random-string"
$env:JWT_SECRET="replace-this-with-another-long-random-string"
$env:JWT_EXPIRES_IN="7d"
$env:PORT="3000"
$env:APP_BASE_URL="http://localhost:3000"
```

Copy `.env.example` to `.env` if you prefer file-based local configuration.

3. Start the app:

```bash
npm start
```

For auto-reload in development:

```bash
npm run dev
```

## Scripts

- `npm start` starts the server.
- `npm run dev` starts the server in watch mode.
- `npm run check` runs a syntax check on `app.js`.

## Main Features

- User signup, login, and logout with multiple authentication methods
- JWT API login, signup, bearer-token authentication, and role-based authorization helpers
- Google OAuth sign-in and sign-up
- Phone-number OTP login and signup with Twilio Verify
- Listing creation, editing, viewing, and deletion
- Host onboarding flow with direct listing creation entry point
- Listing galleries with up to 5 photos
- Stay booking flow and user dashboard
- Review creation and deletion
- Ownership-based authorization for listings and reviews
- Flash messages for success and error states

## Environment Variables

- `MONGO_URL`: MongoDB connection string
- `SESSION_SECRET`: session signing secret
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration time such as `7d`, `12h`, or `30m`
- `PORT`: server port
- `NODE_ENV`: set to `production` in production deployments
- `APP_BASE_URL`: app origin used for OAuth callback generation
- `GOOGLE_CLIENT_ID`: Google OAuth client id
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: optional custom Google callback URL
- `TWILIO_ACCOUNT_SID`: Twilio account sid for phone verification
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_VERIFY_SERVICE_SID`: Twilio Verify service sid
- `SMTP_HOST`: SMTP server host for password reset emails
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: set to `true` for SSL SMTP transports
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password or app password
- `EMAIL_FROM`: sender email address shown in reset emails

## JWT API

JWT auth is available alongside the existing browser session auth.

- `POST /api/auth/signup` with `username`, `email`, and `password` creates a user and returns a bearer token.
- `POST /api/auth/login` with `username` and `password` returns a bearer token.
- `GET /api/auth/me` returns the current user when called with `Authorization: Bearer <token>`.
- `GET /api/auth/admin` is an example protected route that requires the user role to be `admin`.

Existing protected actions that use `isLoggedIn` also accept a bearer token now, so API clients can authenticate without a session cookie.

## Provider Setup

### Google OAuth

1. Create OAuth credentials in Google Cloud Console.
2. Add `http://localhost:3000/auth/google/callback` as an authorized redirect URI for local development.
3. Put the Google client id and secret into your environment variables.

### Phone OTP

1. Create a Twilio Verify service.
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` to your environment.
3. In development, if Twilio is not configured, the app falls back to a dev OTP code and shows it in flash messages and server logs.

### Password Reset Email

1. Add your SMTP credentials to `.env`.
2. For Gmail, use:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

3. Restart the app after saving `.env`.

## Useful Routes

- `/listings`: browse all stays
- `/listings/new`: create a new stay
- `/host`: host onboarding page
- `/dashboard`: user dashboard for listings and bookings
- `/auth?mode=signup`: create an account
- `/auth?mode=login`: log in
