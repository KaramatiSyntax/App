This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Payment Verification & Fraud Protection

### How Payment Screenshot Verification Works
1. User uploads a payment screenshot to add coins to their wallet.
2. The backend performs multiple checks:
   - **Rate limiting:** Max 5 attempts per minute per user.
   - **User status:** Checks for snoozed/blocked users.
   - **Image size:** Must be ≤ 4MB.
   - **EXIF/metadata:** Rejects images edited with apps like Photoshop, PicsArt, etc.
   - **OCR (Tesseract.js):** Extracts visible text from the screenshot. If text contains suspicious words ("PicsArt", "Adobe", etc.), the upload is rejected.
   - **AI Verification:** Uses Gemini AI to extract payment details and check for:
     - Recipient name (must be "Vinayak Kumar Shukla")
     - Transaction ID, amount, date, time, UPI ID
     - Image quality and confidence score
   - **Duplicate detection:** Rejects screenshots already used for a verified payment.
   - **Strict field checks:** All required fields must be present and readable.
   - **Date check:** Screenshot date must match today.
   - **Low confidence or unreadable details:** Rejected.
   - **Suspicious attempts:** All failed/suspicious attempts are logged with username/email/reason.

### Admin Tools
- **Transition Log Dashboard:**
  - View, filter, and search all payment verification attempts.
  - Mark logs as "Done" to hide them from the main list and move them to a special "Done Logs" tab.
  - View detailed info, reject, or snooze users directly from the dashboard.
- **Suspicious User Log:**
  - All users who repeatedly submit invalid screenshots or perform suspicious activity are logged in `suspicious-users-log.txt` (username, email, reason, timestamp).

### Security & Best Practices
- All sensitive logs are stored server-side and not exposed to the public.
- Admins should regularly review both the transition log and suspicious user log for fraud patterns.
- The system is designed to be strict but fair, with manual review options for edge cases.

---

# Local Authentication System

## Features
- Register with unique username, email, and strong password
- Login with username or email and password
- Passwords are hashed (bcrypt)
- Secure cookie-based session
- User info stored in MongoDB

## User Document Example
```json
{
  "_id": "...",
  "username": "uniqueuser",
  "email": "user@example.com",
  "password": "$2a$10$...", // hashed
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "/no-profile.jpeg",
  "coins": 0,
  "isVerified": false,
  "role": "user",
  "lastLogin": "2024-06-01T12:00:00.000Z",
  "createdAt": "2024-06-01T12:00:00.000Z",
  "updatedAt": "2024-06-01T12:00:00.000Z"
}
```

## API Endpoints

### Register
- **POST** `/api/users`
- Body: `{ "username": "uniqueuser", "email": "user@example.com", "password": "StrongPass123!", "firstName": "John", "lastName": "Doe" }`
- Password must be at least 8 chars,include uppercase, lowercase, number, and special character.
- Returns: user document (without password) 

### Login
- **PUT** `/api/users`
- Body: `{ "identifier": "uniqueuser" | "user@example.com", "password": "StrongPass123!" }`
- On success, sets a secure cookie and returns user document (without password)

### Get Current User
- **GET** `/api/users/me`
- Returns: user document (without password) if authenticated

### Get User by ID/Username/Email
- **GET** `/api/users?id=...` or `/api/users?username=...` or `/api/users?email=...`
- Returns: user document (without password)

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## Authentication Flow
1. User registers with username, email, and password
2. User logs in with username or email and password
3. On login, a secure cookie is set
4. Authenticated requests use the cookie to identify the user

## Migration Notes
- All Clerk logic and dependencies have been removed
- User model now requires username, email, and password (hashed)
- Update client-side logic to use the new endpoints

