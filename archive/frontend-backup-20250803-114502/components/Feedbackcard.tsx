import { BaseCard } from './Basecard';
import { Check, X, AlertCircle } from 'lucide-react';

interface FeedbackCardProps {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function FeedbackCard({ type, title, message, onDismiss }: FeedbackCardProps) {
  const iconMap = {
    success: <Check className="w-5 h-5 text-green-400" />,
    error: <X className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />
  };

  const variantMap = {
    success: 'success' as const,
    error: 'error' as const,
    warning: 'accent' as const
  };

  return (
    <BaseCard variant={variantMap[type]} className="w-full max-w-sm min-h-[200px]">
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-20 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0" style={{ marginTop: '0.5rem' }}>
                {iconMap[type]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="text-base font-medium text-white">{title}</h4>
                <p className="text-gray-300 text-sm">{message}</p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
                style={{ marginTop: '0.5rem' }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}