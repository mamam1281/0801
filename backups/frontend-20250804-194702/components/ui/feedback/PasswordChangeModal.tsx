'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { Button } from '../basic/button';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 비밀번호 강도 계산
  const getPasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) return { score: 0, label: '', color: '' };
    if (password.length < 6) return { score: 1, label: '매우 약함', color: 'text-red-400' };
    if (password.length < 8) return { score: 2, label: '약함', color: 'text-orange-400' };
    
    let score = 2;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score === 3) return { score: 3, label: '보통', color: 'text-yellow-400' };
    if (score === 4) return { score: 4, label: '강함', color: 'text-green-400' };
    return { score: 5, label: '매우 강함', color: 'text-emerald-400' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.current = '현재 비밀번호를 입력해주세요.';
    }

    if (!newPassword) {
      newErrors.new = '새 비밀번호를 입력해주세요.';
    } else if (newPassword.length < 8) {
      newErrors.new = '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    if (!confirmPassword) {
      newErrors.confirm = '비밀번호 확인을 입력해주세요.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = '새 비밀번호와 일치하지 않습니다.';
    }

    if (currentPassword === newPassword) {
      newErrors.new = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션
      
      onSuccess();
      onClose();
      
      // 폼 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (error) {
      setErrors({ submit: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
              className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
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
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Shield size={20} className="text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">비밀번호 변경</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* 폼 */}
              <div className="space-y-4">
                {/* 현재 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    현재 비밀번호
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="현재 비밀번호를 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.current && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.current}
                    </p>
                  )}
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    새 비밀번호
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="새 비밀번호를 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* 비밀번호 강도 표시 */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.score === 1 ? 'bg-red-500 w-1/5' :
                              passwordStrength.score === 2 ? 'bg-orange-500 w-2/5' :
                              passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                              passwordStrength.score === 4 ? 'bg-green-500 w-4/5' :
                              'bg-emerald-500 w-full'
                            }`}
                          />
                        </div>
                        <span className={`text-xs ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {errors.new && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.new}
                    </p>
                  )}
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    새 비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {confirmPassword && newPassword === confirmPassword && (
                      <CheckCircle size={18} className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-400" />
                    )}
                  </div>
                  {errors.confirm && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.confirm}
                    </p>
                  )}
                </div>

                {/* 에러 메시지 */}
                {errors.submit && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* 버튼들 */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                    disabled={isLoading}
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        변경 중...
                      </div>
                    ) : (
                      <>
                        <Shield size={16} className="mr-2" />
                        변경하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PasswordChangeModal;
