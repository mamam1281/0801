'use client';

import { useState, useEffect } from 'react';
import ProfileContainer from '../../components/profile/ProfileContainer';
import ProfileContainerMobile from '../../components/profile/ProfileContainerMobile';

export default function ProfilePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 감지 로직
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 초기 체크
    checkIfMobile();
    
    // 리사이즈 이벤트에 반응
    window.addEventListener('resize', checkIfMobile);
    
    // 클린업
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className="w-full min-h-screen">
      {isMobile ? <ProfileContainerMobile /> : <ProfileContainer />}
    </div>
  );
}