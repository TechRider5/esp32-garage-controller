# ESP32 Garage Controller - Web App

A Next.js web application for controlling an ESP32 garage door controller with Firebase authentication and real-time database integration.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google accounts
- **Admin Panel** - Approve/revoke user access (`/admin`)
- **Real-time Controls** - Send door commands to ESP32 via Firebase RTDB
- **User Management** - Request access workflow for new users
- **IoT API** - Secure endpoint for ESP32 authentication (`/api/iot-token`)

## Setup

### Environment Variables

Create a `.env.local` file with your Firebase configuration:

```bash
# Firebase Client Config (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-only secrets
IOT_API_KEY=your_iot_device_key
FIREBASE_ADMIN_SDK_KEY={"type":"service_account",...}
```

### Development

1. Install dependencies: `npm install`
2. Create `.env.local` with your Firebase config
3. Run development server: `npm run dev`
4. Visit `http://localhost:3000`

### Deployment

1. Set environment variables in Vercel Project Settings
2. Deploy to Vercel (connected to this repo)
3. Update ESP32 firmware to point to your Vercel domain

## API Routes

- `GET /` - Main garage controller interface
- `GET /admin` - Admin panel (ethanh6305@gmail.com only)
- `POST /api/iot-token` - ESP32 authentication endpoint

## Firebase Setup

1. Enable Authentication with Google provider
2. Add authorized domains: `your-domain.vercel.app`
3. Set up Realtime Database with appropriate security rules
4. Generate service account key for server-side operations

## Related

- **Firmware**: ESP32 code is in a separate repository (`garageController_Firmware`)
- **Architecture**: Web app ↔ Firebase RTDB ↔ ESP32 device
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
