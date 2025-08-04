'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/basic/button';
import Link from 'next/link';
import ToggleSwitch from '../../components/ui/basic/ToggleSwitch';
import PasswordChangeModal from '../../components/ui/feedback/PasswordChangeModal';
import NotificationSettingsModal from '../../components/ui/feedback/NotificationSettingsModal';
import LogoutConfirmModal from '../../components/ui/feedback/LogoutConfirmModal';

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  return (
    <div className="auth-container popup-mode">
      <div className="auth-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-6">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl text-white game-title">설정</h1>
          </div>

          <div className="space-y-6">
            <section className="p-4 bg-card rounded-lg border border-border">
              <h2 className="text-lg text-white mb-4 game-subtitle">계정 설정</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">프로필 편집</span>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">수정</Button>
                  </Link>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">비밀번호 변경</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    변경
                  </Button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">알림 설정</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowNotificationModal(true)}
                  >
                    설정
                  </Button>
                </div>
              </div>
            </section>

            <section className="p-4 bg-card rounded-lg border border-border">
              <h2 className="text-lg text-white mb-4 game-subtitle">게임 설정</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">사운드</span>
                  <ToggleSwitch
                    isOn={soundEnabled}
                    onToggle={() => setSoundEnabled(!soundEnabled)}
                    size="sm"
                    style="checkbox"
                  />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">진동</span>
                  <ToggleSwitch
                    isOn={vibrationEnabled}
                    onToggle={() => setVibrationEnabled(!vibrationEnabled)}
                    size="sm"
                    style="checkbox"
                  />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">그래픽 품질</span>
                  <Button variant="ghost" size="sm">고품질</Button>
                </div>
              </div>
            </section>

            <section className="p-4 bg-card rounded-lg border border-border">
              <h2 className="text-lg text-white mb-4 game-subtitle">앱 정보</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-white">버전</span>
                  <span className="text-sm text-muted-foreground">1.0.0</span>
                </div>
              </div>
            </section>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => setShowLogoutModal(true)}
              >
                로그아웃
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 모달들 */}
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            console.log('비밀번호가 성공적으로 변경되었습니다.');
            // 성공 토스트 표시 등
          }}
        />

        <NotificationSettingsModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onSave={(settings) => {
            console.log('알림 설정 저장:', settings);
            // 설정 저장 로직
          }}
        />

        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            console.log('로그아웃 처리');
            // 로그아웃 로직
          }}
        />
      </div>
    </div>
  );
}
