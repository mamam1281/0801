'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Smartphone, 
  Mail, 
  Gift,
  Trophy,
  Gamepad2,
  DollarSign,
  Shield,
  Save
} from 'lucide-react';
import { Button } from '../basic/button';
import ToggleSwitch from '../basic/ToggleSwitch';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  gameNotifications: {
    gameResults: boolean;
    bonusReceived: boolean;
    achievementUnlocked: boolean;
    friendActivity: boolean;
  };
  promotionNotifications: {
    dailyBonus: boolean;
    specialOffers: boolean;
    newGames: boolean;
    tournaments: boolean;
  };
  securityNotifications: {
    loginAlerts: boolean;
    passwordChanges: boolean;
    accountActivity: boolean;
  };
  marketing: {
    newsletter: boolean;
    productUpdates: boolean;
    surveys: boolean;
  };
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    gameNotifications: {
      gameResults: true,
      bonusReceived: true,
      achievementUnlocked: true,
      friendActivity: false,
    },
    promotionNotifications: {
      dailyBonus: true,
      specialOffers: true,
      newGames: false,
      tournaments: true,
    },
    securityNotifications: {
      loginAlerts: true,
      passwordChanges: true,
      accountActivity: true,
    },
    marketing: {
      newsletter: false,
      productUpdates: false,
      surveys: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      onSave(settings);
      onClose();
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (category: keyof NotificationSettings, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [key]: value }
        : value
    }));
  };

  const toggleCategory = (category: keyof NotificationSettings, enabled: boolean) => {
    if (typeof settings[category] === 'object') {
      const categorySettings = settings[category] as Record<string, boolean>;
      const updatedCategory = Object.keys(categorySettings).reduce((acc, key) => ({
        ...acc,
        [key]: enabled
      }), {});
      
      setSettings(prev => ({
        ...prev,
        [category]: updatedCategory
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [category]: enabled
      }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div 
              className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(145deg, rgba(26,26,26,0.98) 0%, rgba(20,20,35,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Bell size={20} className="text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">알림 설정</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 전체 알림 설정 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Smartphone size={18} className="text-blue-400" />
                    기본 알림 설정
                  </h3>
                  
                  <div className="space-y-3 ml-6">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">푸시 알림</p>
                      </div>
                      <ToggleSwitch
                        isOn={settings.pushNotifications}
                        onToggle={() => updateSetting('pushNotifications', '', !settings.pushNotifications)}
                        color="primary"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Mail size={18} className="text-gray-400" />
                        <div>
                          <p className="text-white font-medium">이메일 알림</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        isOn={settings.emailNotifications}
                        onToggle={() => updateSetting('emailNotifications', '', !settings.emailNotifications)}
                        color="primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 게임 알림 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Gamepad2 size={18} className="text-green-400" />
                      게임 알림
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const allEnabled = Object.values(settings.gameNotifications).every(v => v);
                        toggleCategory('gameNotifications', !allEnabled);
                      }}
                      className="text-base"
                    >
                      전체 {Object.values(settings.gameNotifications).every(v => v) ? '끄기' : '켜기'}
                    </Button>
                  </div>

                  <div className="space-y-2 ml-6">
                    {[
                      { key: 'gameResults', label: '게임 결과' },
                      { key: 'bonusReceived', label: '보너스 획득' },
                      { key: 'achievementUnlocked', label: '업적 달성' },
                      { key: 'friendActivity', label: '친구 활동' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-2 hover:bg-gray-800/20 rounded-lg transition-colors">
                        <div>
                          <p className="text-white text-sm font-medium">{item.label}</p>
                        </div>
                        <ToggleSwitch
                          isOn={settings.gameNotifications[item.key as keyof typeof settings.gameNotifications]}
                          onToggle={() => updateSetting('gameNotifications', item.key, !settings.gameNotifications[item.key as keyof typeof settings.gameNotifications])}
                          size="sm"
                          color="success"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 프로모션 알림 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Gift size={18} className="text-pink-400" />
                      프로모션 알림
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const allEnabled = Object.values(settings.promotionNotifications).every(v => v);
                        toggleCategory('promotionNotifications', !allEnabled);
                      }}
                      className="text-base"
                    >
                      전체 {Object.values(settings.promotionNotifications).every(v => v) ? '끄기' : '켜기'}
                    </Button>
                  </div>

                  <div className="space-y-2 ml-6">
                    {[
                      { key: 'dailyBonus', label: '일일 보너스' },
                      { key: 'specialOffers', label: '특별 혜택' },
                      { key: 'newGames', label: '신규 게임' },
                      { key: 'tournaments', label: '토너먼트' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-2 hover:bg-gray-800/20 rounded-lg transition-colors">
                        <div>
                          <p className="text-white text-sm font-medium">{item.label}</p>
                        </div>
                        <ToggleSwitch
                          isOn={settings.promotionNotifications[item.key as keyof typeof settings.promotionNotifications]}
                          onToggle={() => updateSetting('promotionNotifications', item.key, !settings.promotionNotifications[item.key as keyof typeof settings.promotionNotifications])}
                          size="sm"
                          color="warning"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 보안 알림 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield size={18} className="text-red-400" />
                    보안 알림 (권장)
                  </h3>

                  <div className="space-y-2 ml-6">
                    {[
                      { key: 'loginAlerts', label: '로그인 알림' },
                      { key: 'passwordChanges', label: '비밀번호 변경' },
                      { key: 'accountActivity', label: '계정 활동' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-2 hover:bg-gray-800/20 rounded-lg transition-colors">
                        <div>
                          <p className="text-white text-sm font-medium">{item.label}</p>
                        </div>
                        <ToggleSwitch
                          isOn={settings.securityNotifications[item.key as keyof typeof settings.securityNotifications]}
                          onToggle={() => updateSetting('securityNotifications', item.key, !settings.securityNotifications[item.key as keyof typeof settings.securityNotifications])}
                          size="sm"
                          color="danger"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      저장 중...
                    </div>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      저장하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettingsModal;
