import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 탭 아이템 데이터 타입
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  // 탭 콘텐츠에 적용할 레이아웃 타입 또는 클래스 정보 추가
  contentType?: 'single-card' | 'multi-card-grid' | 'full-width-section' | 'vertical-stack';
  customLayoutClass?: string; // 특정 레이아웃 클래스를 직접 지정할 경우
}

export interface TabsProps {
  tabs: TabItem[]; // 탭 아이템 배열
  activeTab: string; // 현재 활성 탭의 ID
  onTabChange: (tabId: string) => void; // 탭 변경 시 호출될 콜백
  className?: string; // 전체 컨테이너에 적용될 추가 클래스
  tabListClassName?: string; // 탭 라벨 리스트에 적용될 클래스
  tabContentClassName?: string; // 탭 콘텐츠 영역에 적용될 클래스
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  tabListClassName = '',
  tabContentClassName = '',
}) => {
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const activeTabRef = useRef<HTMLButtonElement>(null); // 활성 탭 버튼 참조
  const tabListRef = useRef<HTMLDivElement>(null); // 탭 리스트 컨테이너 참조

  // 1. Sliding Underline 위치 계산을 위한 상태
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const [underlineLeft, setUnderlineLeft] = useState(0);

  // 2. 활성 탭이 변경될 때마다 밑줄 위치/크기 업데이트
  useEffect(() => {
    if (activeTabRef.current && tabListRef.current) {
      const tabElement = activeTabRef.current;
      const containerElement = tabListRef.current;
      
      setUnderlineWidth(tabElement.offsetWidth);
      setUnderlineLeft(tabElement.offsetLeft - containerElement.offsetLeft);
    }
  }, [activeTab]); // activeTab이 변경될 때마다 실행

  // 3. 콘텐츠 전환 애니메이션을 위한 variants
  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className={`tabs-container ${className}`}>      {/* 탭 라벨 리스트 - 아이스 글래스모피즘 */}
      <div 
        ref={tabListRef}
        className={`
          tabs-ice-glass
          relative flex
          pt-4 pb-3 px-2
          ${tabListClassName}
        `}
        style={{
          minHeight: '60px', // 고정 높이 증가
          display: 'grid',
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, // 모든 탭을 균등하게 분배
          gap: '4px' // 탭 간 간격 추가
        }}
      >        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={activeTab === tab.id ? activeTabRef : null} // 활성 탭에만 ref 연결
            onClick={() => onTabChange(tab.id)}
            className={`
              tab-button-ice-glass
              ${activeTab === tab.id ? 'active' : ''}
              relative py-3 px-3
              text-sm font-medium
              cursor-pointer
              rounded-lg
              border-0
              ${activeTab === tab.id 
                ? 'text-white' 
                : 'text-white/70 hover:text-white'
              }
              whitespace-nowrap text-center
              transition-all duration-300
            `}
            style={{
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: tabs.length > 4 ? '12px' : '14px', // 탭이 많으면 폰트 크기 줄이기
            }}
          >
            {tab.label}
          </button>
        ))}          {/* Sliding Underline */}
        {activeTabIndex !== -1 && ( // 활성 탭이 있을 때만 렌더링
          <motion.div
            className="absolute bottom-0 h-[3px] bg-gradient-to-r from-accent via-primary to-accent rounded-t-sm" // 밑줄 스타일 강화
            initial={false} // 초기 애니메이션 비활성화 (위치 계산 후 바로 적용)
            animate={{ 
              width: underlineWidth, 
              x: underlineLeft 
            }} // 너비와 x축 위치 애니메이션
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }} // 더 빠르고 반응적인 스프링 애니메이션
            style={{
              boxShadow: '0 0 8px rgba(255, 69, 22, 0.4)', // 은은한 glow 효과
            }}
          />
        )}
      </div>      {/* 모바일 우선 반응형 마스터 컨테이너 - 아이스 글래스모피즘 */}
      <div
        className={`
          tab-content-ice-glass
          tab-content-master-container
          w-full max-w-6xl mx-auto
          min-h-[250px] max-[767px]:min-h-[200px]
          max-h-[70vh] max-[767px]:max-h-[60vh]
          p-8 max-[767px]:p-6
          overflow-y-auto
          ${tabContentClassName}
        `}
        style={{
          // 모바일 우선 동적 높이 적용
          minHeight: 'clamp(200px, 50vh, 400px)',
          maxHeight: 'clamp(300px, 70vh, 600px)',
          transition: 'none', // 크기 변경 애니메이션 비활성화
          marginTop: '7px', // 탭과 정확히 7px 간격
          marginBottom: '16px', // 하단에서 16px 오프셋
          position: 'relative',
          zIndex: 10, // 탭보다 낮은 z-index
        }}
      >
        <AnimatePresence mode="wait">
          {tabs.map((tab) =>
            activeTab === tab.id ? (
              <motion.div
                key={tab.id}                initial="initial"
                animate="animate"
                exit="exit"
                variants={contentVariants}
                transition={{ duration: 0.15 }}
                className={`
                  w-full h-full relative overflow-y-auto
                  ${(() => {
                    switch (tab.contentType) {
                      case 'single-card':
                        return 'flex items-start justify-center pt-6'; // 단일 카드를 중앙 상단에 배치, 여백 증가
                      case 'multi-card-grid':
                        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-min py-6'; // 반응형 그리드 + 세로 간격 더욱 증가
                      case 'vertical-stack': 
                        return 'flex flex-col gap-8 py-6'; // 세로 스택 + 간격 더욱 증가
                      case 'full-width-section': 
                        return 'w-full h-full py-6'; // 컨테이너 전체 사용 + 여백 증가
                      default:
                        return tab.customLayoutClass || 'flex flex-col gap-8 py-6'; // 기본 레이아웃 + 간격 더욱 증가
                    }
                  })()}
                `}
                style={{
                  // 내부 콘텐츠 높이를 유연하게 설정
                  minHeight: '100%',
                }}
              >
                {tab.content}
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tabs;
