# Deployment Checklist & Environment Variables
**Project:** Pandu.ai
**Target Environment:** Production (Hackathon Demo)
**Hosting:** Firebase Hosting (FE), Google Cloud Run (BE)[cite: 1]

## Overview
This document serves as the final checklist before pushing the Pandu.ai code to the live server for the hackathon demonstration. It ensures all API keys, environment variables, and security rules are correctly configured to prevent runtime errors.

---

## 1. Environment Variables (.env)
Ensure these variables are set in the respective hosting environments. **Never commit the actual `.env` file to the GitHub repository.**

### Frontend (React.js)
Variables needed for the build process (Firebase Hosting).
```env
# Google Maps Routes API Key
REACT_APP_GOOGLE_MAPS_API_KEY="AIzaSyYourMapKeyHere..."

# Firebase Config (for Firestore Listeners)
REACT_APP_FIREBASE_API_KEY="AIzaSyYourFirebaseKey..."
REACT_APP_FIREBASE_AUTH_DOMAIN="pandu-ai-2026.firebaseapp.com"
REACT_APP_FIREBASE_PROJECT_ID="pandu-ai-2026"
REACT_APP_FIREBASE_STORAGE_BUCKET="pandu-ai-2026.appspot.com"

# Backend Cloud Run URL
REACT_APP_API_BASE_URL="https://api-pandu-ai-[hash].a.run.app/api/v1"
```

### Backend (Node.js / Cloud Run)
Variables needed in the Google Cloud Run configuration.
```env
# Gemini AI Configuration
GEMINI_API_KEY="AIzaSyYourGeminiKeyHere..."
GEMINI_MODEL_VERSION="gemini-3.1-flash-lite-preview"

# Firebase Admin SDK (Service Account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJwcm9qZWN0X2lkIjoi..."

# Hackathon Auth (Static)
API_SECRET_KEY="antigravity-2026-pandu-ai-demo"

# Server Port (Handled by Cloud Run, but good for local)
PORT=8080
```

---

## 2. Pre-Deployment Checklist

### A. Backend (Google Cloud Run)
- [ ] Ensure `package.json` has a valid `start` script (e.g., `node dist/index.js`).
- [ ] Inject all Backend `.env` variables into the Cloud Run service configuration.
- [ ] **CORS Configuration:** Ensure the backend allows requests from the Frontend URL (Firebase Hosting URL) and `localhost:3000` (for testing).
- [ ] Test the `/obstacles/report` API endpoint via Postman using the live Cloud Run URL.

### B. Database (Firebase Firestore)
- [ ] Verify `firebase.rules` are deployed and temporarily allow read/write access for the hackathon demo.
- [ ] Ensure the 5 mock couriers are injected into the `couriers` collection.
- [ ] Clear any junk/test data from the `orders` and `ai_decision_logs` collections before the presentation.

### C. Frontend (Firebase Hosting)
- [ ] Run `npm run build` locally to ensure the project compiles without errors.
- [ ] Verify all `REACT_APP_` variables are correctly referenced in the code.
- [ ] Deploy to Firebase using `firebase deploy --only hosting`.
- [ ] Open the live Firebase Hosting URL and verify the map loads correctly without API key watermarks/errors.

---

## 3. Emergency Rollback / Troubleshooting
*   **Map not rendering:** Check `REACT_APP_GOOGLE_MAPS_API_KEY` and ensure the domain is whitelisted in Google Cloud Console.
*   **AI not responding:** Check the Cloud Run logs for Gemini quota limits or invalid `GEMINI_API_KEY`.
*   **Data not syncing:** Refresh the dashboard; verify the `REACT_APP_FIREBASE_PROJECT_ID` matches the deployed backend target.