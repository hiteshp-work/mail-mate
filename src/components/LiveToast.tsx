import React from 'react';
import { Eye, MousePointerClick, X, ExternalLink } from 'lucide-react';
import { TrackingEvent } from '../types';

interface LiveToastProps {
  event: TrackingEvent | null;
  onClose: () => void;
  onClick: () => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({ event, onClose, onClick }) => {
  if (!event) return null;

  const isOpen = event.type === 'open';

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
      <div
        onClick={onClick}
        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 cursor-pointer max-w-sm ${
          isOpen
            ? 'border-emerald-500/40 bg-slate-950/95 shadow-emerald-500/20'
            : 'border-purple-500/40 bg-slate-950/95 shadow-purple-500/20'
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            isOpen
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
          }`}
        >
          {isOpen ? <Eye className="h-5 w-5" /> : <MousePointerClick className="h-5 w-5" />}
        </div>

        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${
                isOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
              }`}
            >
              {isOpen ? 'EMAIL OPENED' : 'LINK CLICKED'}
            </span>
            <span className="text-[10px] text-slate-400">Just now</span>
          </div>

          <p className="text-xs font-bold text-white truncate max-w-[200px]">
            {event.subject || 'Tracked Message'}
          </p>

          <p className="text-[11px] text-slate-300">
            {event.recipientName || 'Recipient'} ({event.location?.city ? `${event.location.city}, ${event.location.country}` : 'Global'})
          </p>

          <p className="text-[10px] text-slate-400 font-mono">
            {event.client} • {event.os}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-lg p-1 text-slate-400 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
