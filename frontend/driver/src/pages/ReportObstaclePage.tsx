// Tujuan    : Form for couriers to report road obstacles with photo, type, severity
// Caller    : routes.tsx (/report)
// Dependensi: react-hook-form, zod, @hookform/resolvers, api.reportObstacle, sonner (toast)
// Main Func : Validates and submits obstacle reports as multipart FormData
// Side Effects: HTTP POST /api/v1/obstacles/report, navigator.geolocation read

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { TriangleAlert, Camera, X, MapPin } from 'lucide-react';
import { reportObstacle } from '@/services/api';
import type { ObstacleType } from '@/types/domain';

const obstacleSchema = z.object({
  type: z.enum(['flood', 'accident', 'construction', 'road_closure', 'heavy_traffic', 'other']),
  severity: z.coerce.number().min(1).max(5),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(500, 'Maksimal 500 karakter'),
});

type ObstacleForm = z.infer<typeof obstacleSchema>;

const typeLabels: Record<ObstacleType, string> = {
  flood: 'Banjir',
  accident: 'Kecelakaan',
  construction: 'Konstruksi',
  road_closure: 'Jalan Ditutup',
  heavy_traffic: 'Macet Parah',
  other: 'Lainnya',
};

export default function ReportObstaclePage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ObstacleForm>({
    resolver: zodResolver(obstacleSchema),
    mode: 'onChange',
  });

  // Auto-fill location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(null),
    );
  }, []);

  const severity = watch('severity');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5 MB');
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: ObstacleForm) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('courierId', import.meta.env.REACT_APP_COURIER_ID);
    formData.append('type', data.type);
    formData.append('severity', String(data.severity));
    formData.append('description', data.description);
    if (photo) formData.append('photo', photo);
    if (location) {
      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
    }

    try {
      await reportObstacle(formData);
      toast.success('Laporan berhasil dikirim');
      reset();
      removePhoto();
    } catch {
      // Error handled by Axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border h-12 flex items-center px-4">
        <TriangleAlert size={20} className="text-brand-primary mr-2" />
        <h1 className="text-lg font-semibold text-text-primary">Laporkan Rintangan</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-4">
        {/* Location indicator */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-surface rounded-lg p-3">
            <MapPin size={14} />
            <span>Lokasi terdeteksi: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )}

        {/* Type select */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Jenis Rintangan</label>
          <select
            {...register('type')}
            className="w-full h-11 px-3 bg-surface rounded-md text-sm text-text-primary border-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">Pilih jenis...</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.type && <p className="text-xs text-status-error mt-1">{errors.type.message}</p>}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Tingkat Keparahan</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => register('severity').onChange({ target: { value: String(level) } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                className={[
                  'flex-1 h-10 rounded-md text-sm font-medium transition-colors',
                  severity === level
                    ? level <= 2
                      ? 'bg-green-100 text-green-700 border-2 border-green-400'
                      : level === 3
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                        : 'bg-red-100 text-red-700 border-2 border-red-400'
                    : 'bg-surface text-text-muted border-2 border-transparent',
                ].join(' ')}
              >
                {level}
              </button>
            ))}
          </div>
          {errors.severity && <p className="text-xs text-status-error mt-1">{errors.severity.message}</p>}
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Foto (opsional)</label>
          {photoPreview ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 bg-surface rounded-lg border-2 border-dashed border-border cursor-pointer">
              <Camera size={24} className="text-text-faint mb-2" />
              <span className="text-sm text-text-muted">Tap untuk pilih foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Deskripsi</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Jelaskan kondisi jalan..."
            className="w-full p-3 bg-surface rounded-md text-sm text-text-primary border-none resize-none focus:ring-2 focus:ring-brand-accent"
          />
          {errors.description && (
            <p className="text-xs text-status-error mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full h-12 bg-brand-primary text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Kirim Laporan'
          )}
        </button>
      </form>
    </div>
  );
}
