// Tujuan    : Modal for capturing failure reason when delivery fails
// Caller    : OrderActions (triggered by "Gagal" button)
// Dependensi: react (useState), lucide-react (X)
// Main Func : Quick-select dropdown + free-text description for failure reason
// Side Effects: None

import { useState } from 'react';
import { X } from 'lucide-react';

const commonReasons = [
  'Penerima tidak ada di rumah',
  'Alamat tidak ditemukan',
  'Paket rusak',
  'Lainnya',
];

interface FailureReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function FailureReasonModal({ isOpen, onClose, onSubmit }: FailureReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const finalReason = selectedReason === 'Lainnya' ? customReason : selectedReason;
  const canSubmit = finalReason.trim().length > 0;

  const handleSubmit = () => {
    onSubmit(finalReason.trim());
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl p-4 space-y-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Alasan Gagal</h2>
          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {commonReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={[
                'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors min-h-[44px]',
                selectedReason === reason
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary'
                  : 'bg-surface text-text-primary border border-transparent',
              ].join(' ')}
            >
              {reason}
            </button>
          ))}
        </div>

        {selectedReason === 'Lainnya' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Jelaskan alasan lain..."
            rows={3}
            className="w-full p-3 bg-surface rounded-md text-sm text-text-primary border-none resize-none focus:ring-2 focus:ring-brand-accent"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 bg-status-error text-white rounded-full font-medium disabled:opacity-50"
        >
          Konfirmasi Gagal
        </button>
      </div>
    </div>
  );
}
