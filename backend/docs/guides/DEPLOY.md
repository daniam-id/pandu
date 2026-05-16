# Pandu.ai — Deploy & Rollback Guide

## Setup Awal (Satu Kali)

### 1. Set project
```bash
gcloud config set project pandu-494913
```

### 2. Enable APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
```

### 3. Secret Manager
```bash
# Firebase service account (base64 dari file JSON; atau isi langsung private_key)
gcloud secrets create pandu-firebase-sa --data-file=firebase-key.json
# Gemini API key
echo -n "AIza..." | gcloud secrets create pandu-gemini --data-file=-
# Backend API key (minimal 32 karakter hex)
openssl rand -hex 32 | gcloud secrets create pandu-api-key --data-file=-
```

### 4. Deploy Firestore & Storage Rules
```bash
firebase deploy --only firestore:rules,storage --project=pandu-494913
```

### 5. Deploy pertama
```bash
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
  --set-secrets=FIREBASE_PRIVATE_KEY=pandu-firebase-sa:latest,GEMINI_API_KEY=pandu-gemini:latest
```

Setelah deploy, catat URL yang muncul (contoh: `https://pandu-backend-xxxx.a.run.app`).

### 6. Cloud Build Trigger (CI/CD auto-deploy dari GitHub)
```bash
gcloud builds triggers create github \
  --name=pandu-backend-prod \
  --repo-name=pandu \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=main \
  --build-config=backend/cloudbuild.yaml
```

---

## Deploy Harian

### Otomatis (push ke `main`)
```bash
git push origin main
# Cloud Build: type-check → lint → deploy --source
```

### Manual
```bash
gcloud run deploy pandu-backend --source . --region=asia-southeast2
```

### Preview / dry-run
```bash
gcloud builds submit --config=cloudbuild.yaml --no-source --dry-run
```

---

## Rollback

```bash
# Lihat revisi
gcloud run revisions list --service=pandu-backend --region=asia-southeast2

# Rollback ke revisi spesifik
gcloud run services update-traffic pandu-backend \
  --to-revisions=LATEST-1=100 \
  --region=asia-southeast2
```

---

## Verifikasi

```bash
# Cek health
curl https://pandu-backend-xxxx.a.run.app/health

# Test endpoint dengan API key
curl -H "x-api-key: your_api_key" \
  https://pandu-backend-xxxx.a.run.app/api/v1/orders?courierId=cour_1
```
