import React from 'react';
import { BaseCard } from './Basecard';
import Button from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { User, Lock, LogIn } from 'lucide-react';

interface InputCardProps {
  title?: string;
  onSubmit?: (data: { username: string; password: string }) => void;
  className?: string;
}

export const InputCard: React.FC<InputCardProps> = ({
  title = "로그인", 
  
  onSubmit,
  className = ""
}) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ username, password });
    }
  };

  return (
    <BaseCard className={`w-full max-w-sm min-h-[300px] ${className}`}>
      <div className="w-full h-full flex flex-col">
        {/* Top padding to push header down to 1/3 point */}
        <div className="h-16 flex-shrink-0"></div>
        
        <div className="px-10 pb-10 flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Header with title and icon - positioned at 1/3 down */}
          <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
            <LogIn 
              className="text-amber-400 flex-shrink-0" 
              size={24}
              aria-hidden="true" 
            />
            <h3 className="text-lg font-semibold text-white">
              {title}
            </h3>
          </div>

        <form onSubmit={handleSubmit} className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Username Field - 매우 큰 세로 간격 */}
          <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <User
                className="text-gray-300 flex-shrink-0"
                size={20}
                aria-hidden="true"
              />
              <Label 
                htmlFor="username" 
                className="text-md font-medium text-white"
              >
                사용자명
              </Label>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자명을 입력하세요"
                className="w-full"
                fullWidth={true}
                required
              />
            </div>
          </div>

          {/* Password Field - 매우 큰 세로 간격 */}
          <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
              <Lock 
                className="text-gray-300 flex-shrink-0" 
                size={24}
                aria-hidden="true" 
              />
              <Label 
                htmlFor="password" 
                className="text-md font-medium text-white"
              >
                비밀번호
              </Label>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full"
                fullWidth={true}
                required
              />
            </div>
          </div>

          {/* Submit Button with MASSIVE extra spacing */}
          <div style={{ marginTop: '1rem', paddingTop: '1.1rem' }}>
            <Button 
              type="submit" 
              variant="primary"
              size="lg"
              className="w-full"
            >
              로그인
            </Button>
          </div>
        </form>
      </div>
      </div>
    </BaseCard>
  );
};

export default InputCard;
