import { BaseCard } from './Basecard';
import Button from './Button';
import { Bell, X } from 'lucide-react';

interface NotificationCardProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export function NotificationCard({ 
  title, 
  description, 
  actionText = "확인",
  onAction,
  onDismiss
}: NotificationCardProps) {
  return (
    <BaseCard className="w-full max-w-sm min-h-[300px]">
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-16 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-400/20 flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 className="text-base font-medium text-white">{title}</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-300" />
              </button>
            )}
          </div>
        
        {onAction && (
          <div className="flex gap-2" style={{ marginTop: '1.1rem' }}>
            <Button 
              onClick={onAction}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>
      </div>
    </BaseCard>
  );
}