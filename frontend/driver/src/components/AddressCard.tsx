// Tujuan    : Display address with contact info, phone link, and open-in-maps button
// Caller    : OrderDetailPage
// Dependensi: lucide-react (MapPin, Phone, ExternalLink)
// Main Func : Renders pickup/dropoff address card with actionable links
// Side Effects: tel: link (dialer), external Google Maps URL

import { MapPin, Phone, ExternalLink } from 'lucide-react';

interface AddressCardProps {
  label: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  lat: number;
  lng: number;
}

export default function AddressCard({ label, name, phone, address, notes, lat, lng }: AddressCardProps) {
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} className="text-brand-primary" />
        <span className="text-xs font-medium text-brand-primary uppercase tracking-wide">{label}</span>
      </div>

      <h3 className="text-sm font-semibold text-text-primary">{name}</h3>

      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-primary mt-1 min-h-[44px]"
      >
        <Phone size={14} />
        {phone}
      </a>

      <p className="text-sm text-text-muted mt-1">{address}</p>

      {notes && <p className="text-xs text-text-faint mt-1 italic">Catatan: {notes}</p>}

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-brand-primary bg-white px-3 py-2 rounded-md border border-border min-h-[44px]"
      >
        <ExternalLink size={14} />
        Buka di Maps
      </a>
    </div>
  );
}
