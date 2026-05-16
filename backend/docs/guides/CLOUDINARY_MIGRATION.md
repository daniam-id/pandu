# Migrasi Firebase Storage → Cloudinary

**Status**: Rencana — belum diimplementasi  
**Alasan**: Firebase Storage butuh Blaze plan (berbayar). Cloudinary gratis 25GB/bulan.

---

## Perubahan yang Diperlukan

### 1. Install dependency
```bash
npm install cloudinary
```

### 2. Tambah env vars
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Ubah `src/routes/obstacles.ts`

**Hapus:**
```typescript
import { getStorage } from 'firebase-admin/storage';
```

**Tambah:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

**Ganti bagian upload** (saat ini ~line 138-153):

Dari:
```typescript
const bucket = getStorage().bucket(config.firebase.storageBucket);
const fileName = `obstacles/${Date.now()}_${req.file.originalname}`;
const file = bucket.file(fileName);
await file.save(req.file.buffer, {
  metadata: { contentType: req.file.mimetype },
  public: true,
});
const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
```

Ke:
```typescript
const b64 = Buffer.from(req.file.buffer).toString('base64');
const dataUri = `data:${req.file.mimetype};base64,${b64}`;
const result = await cloudinary.uploader.upload(dataUri, {
  folder: 'pandu-obstacles',
  resource_type: 'auto',
});
const imageUrl = result.secure_url;
```

### 4. Bersihkan
```bash
npm uninstall @google-cloud/storage  # optional, sudah jadi dependency firebase-admin
```

### 5. Hapus dari firebase.json
```json
// Hapus bagian "storage" dari firebase.json
```

---

## Perbandingan

| | Firebase Storage | Cloudinary |
|---|-----------------|------------|
| Harga | Blaze plan (minimal ~$0.026/GB) | Gratis 25GB/bulan |
| Setup | Sudah terintegrasi Firebase | Perlu Cloudinary account terpisah |
| Image transform | Manual | Built-in resize/crop/optimize |
| Latensi | Same region as Firestore | CDN global |

Untuk hackathon — Cloudinary cukup dengan free tier dan lebih ringan setup-nya.
