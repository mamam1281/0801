import { BaseCard } from './Basecard';
import { Clock, Play, Trophy, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  type: 'game' | 'achievement' | 'message';
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'game':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <BaseCard className="w-full max-w-sm min-h-[200px]">
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-16 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-medium text-white">최근 활동</h3>
          </div>

        <div className="max-h-56 overflow-y-auto flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ marginBottom: '0.5rem' }}>
              <div className="flex-shrink-0" style={{ marginTop: '0.5rem' }}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 className="text-white text-sm font-medium truncate">{activity.title}</h4>
                <p className="text-gray-300 text-xs truncate">{activity.description}</p>
                <p className="text-gray-400 text-xs">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm" style={{ marginTop: '1.1rem' }}>
            최근 활동이 없습니다
          </div>
        )}
      </div>
      </div>
    </BaseCard>
  );
}