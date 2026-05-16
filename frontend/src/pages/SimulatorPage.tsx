import { useState, useCallback } from 'react';
import { ArrowLeft, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CourierSelect } from '@/components/CourierSelect';
import { ObstaclePhotoUpload } from '@/components/ObstaclePhotoUpload';
import { reportObstacle } from '@/services/api';
import { useCouriers } from '@/hooks/useCouriers';

/**
 * Cycle 7: Full-screen standalone courier simulator / obstacle report page.
 *
 * Mobile-friendly layout for operators on-the-go.
 * Same form as the dashboard dialog but without modal wrapper.
 */
export default function SimulatorPage() {
  const navigate = useNavigate();
  const { data: couriers } = useCouriers();

  const [courierId, setCourierId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [obstacleType, setObstacleType] = useState('');
  const [severity, setSeverity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setCourierId('');
    setPhoto(null);
    setDescription('');
    setObstacleType('');
    setSeverity('');
    setLat('');
    setLng('');
    setSubmitting(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!courierId) {
        toast.error('Please select a courier.');
        return;
      }
      if (!description.trim()) {
        toast.error('Please describe the obstacle.');
        return;
      }
      if (!obstacleType) {
        toast.error('Please select an obstacle type.');
        return;
      }
      if (!severity) {
        toast.error('Please select a severity level.');
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append('courierId', courierId);
      formData.append('description', description.trim());
      formData.append('type', obstacleType);
      formData.append('severity', severity);
      if (photo) formData.append('photo', photo);
      if (lat) formData.append('lat', lat);
      if (lng) formData.append('lng', lng);

      try {
        await reportObstacle(formData);
        toast.success('Obstacle report submitted successfully');
        reset();
      } catch (err) {
        // User-facing error toast is dispatched by the axios response interceptor
        // in `src/services/api.ts`. Keep console.error here for dev debugging only.
        // eslint-disable-next-line no-console
        console.error('Report obstacle failed:', err);
        setSubmitting(false);
      }
    },
    [courierId, description, obstacleType, severity, photo, lat, lng, reset],
  );

  const canSubmit = courierId && description.trim() && obstacleType && severity && !submitting;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-text-muted"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning" aria-hidden="true" />
              Report Obstacle
            </CardTitle>
            <CardDescription>
              Simulate an obstacle encountered by a courier. The AI Dispatcher will reroute accordingly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="courier">Courier</Label>
                <CourierSelect
                  couriers={couriers}
                  value={courierId}
                  onChange={setCourierId}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Photo (optional)</Label>
                <ObstaclePhotoUpload
                  file={photo}
                  onChange={setPhoto}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obstacleType">Obstacle Type</Label>
                <select
                  id="obstacleType"
                  value={obstacleType}
                  onChange={(e) => setObstacleType(e.target.value)}
                  disabled={submitting}
                  required
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">Select type…</option>
                  <option value="flood">Flood</option>
                  <option value="accident">Accident</option>
                  <option value="construction">Construction</option>
                  <option value="road_closure">Road Closure</option>
                  <option value="heavy_traffic">Heavy Traffic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={submitting}
                  required
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">Select severity…</option>
                  <option value="1">1 — Low</option>
                  <option value="2">2 — Minor</option>
                  <option value="3">3 — Moderate</option>
                  <option value="4">4 — High</option>
                  <option value="5">5 — Critical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Road closed due to flooding"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Location (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    disabled={submitting}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <Separator />

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
