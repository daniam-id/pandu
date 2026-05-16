#!/bin/bash
set -e
echo "=== Deploy pandu-backend ke Cloud Run ==="
gcloud run deploy pandu-backend \
  --source . \
  --region=asia-southeast2 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars=NODE_ENV=production,LOG_LEVEL=info,CORS_ORIGIN=* \
  --set-secrets=FIREBASE_SERVICE_ACCOUNT_BASE64=pandu-firebase-sa-b64:latest,GEMINI_API_KEY=pandu-gemini:latest
echo "=== Selesai ==="
