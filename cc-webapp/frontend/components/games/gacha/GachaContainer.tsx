'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GachaResult, SAMPLE_ITEMS, GachaItem } from './types';
import { GachaModal } from './GachaModal';
import { isPopupWindow } from '../../../utils/gamePopup';
import './gacha-premium-theme.css';

export function GachaContainer() {
  const [tickets, setTickets] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<GachaResult | null>(null);
  const [isPopup, setIsPopup] = useState(false);

  // 뽑기 카운트만 유지
  const [pullCount, setPullCount] = useState(0);
  const [socialStats, setSocialStats] = useState({ gacha_spins_today: 0 });

  // 팝업 모드 및 소셜 증명 데이터 감지
  useEffect(() => {
    setIsPopup(isPopupWindow());

    const fetchSocialStats = async () => {
        try {
            const stats = await ApiClient.getSocialProofStats();
            setSocialStats(stats);
        } catch (error) {
            console.error("Failed to fetch social proof stats:", error);
        }
    };

    fetchSocialStats();

    // 팝업 크기 로그 및 최적화
    if (isPopupWindow()) {
      console.log(`🎮 랜덤뽑기 팝업 크기: 가로 ${window.innerWidth}px × 세로 ${window.innerHeight}px`);

      // 컨텐츠 높이에 따른 스타일 조정
      const resizeObserver = new ResizeObserver((entries) => {
        const contentHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        console.log(`컨텐츠 실제 높이: ${contentHeight}px, 뷰포트 높이: ${viewportHeight}px`);

        // 컨테이너 요소 찾기
        const containerElement = document.querySelector('.gacha-container.popup-mode');
        if (containerElement) {
          // 컨텐츠가 뷰포트보다 작으면 세로 중앙 정렬
          if (contentHeight < viewportHeight - 50) {
            containerElement.classList.add('centered-content');
            console.log('컨텐츠가 작아서 중앙 정렬 적용');
          } else {
            containerElement.classList.remove('centered-content');
            console.log('컨텐츠가 커서 기본 배치 사용');
          }
        }
      });

      // body와 실제 랜덤뽑기 컨테이너 모두 관찰
      resizeObserver.observe(document.body);
      const gachaContainer = document.querySelector('.gacha-container');
      if (gachaContainer) resizeObserver.observe(gachaContainer);

      return () => resizeObserver.disconnect();
    }
  }, []);

  const handlePull = async () => {
    if (tickets <= 0 || isPlaying) return;

    setIsPlaying(true);
    setTickets(prev => prev - 1);
    setPullCount(prev => prev + 1);

    try {
      // Assuming user_id is available, e.g. from a context
      const userId = 1; // Replace with actual user ID from auth context
      const gachaResult = await ApiClient.pullGacha(userId);

      // The API response should be shaped like GachaResult
      // We might need to map the API response to the GachaResult type
      const resultToDisplay: GachaResult = {
          item: {
              id: gachaResult.type, // or some other unique id from response
              name: gachaResult.type, // or a mapping from type to name
              rarity: gachaResult.rarity || 'Common', // Assuming rarity is returned
              probability: 0 // Not needed on client side anymore
          },
          isNew: gachaResult.isNew || false // Assuming isNew is returned
      };

      setResult(resultToDisplay);
      setShowModal(true);

    } catch (error) {
        console.error('Gacha pull failed:', error);
        alert('랜덤뽑기에 실패했습니다. 다시 시도해주세요.');
        // Revert ticket count on failure
        setTickets(prev => prev + 1);
    } finally {
        setIsPlaying(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setResult(null);
  };

  const handleRecharge = () => {
    setTickets(prev => prev + 10);
  };

  return (
    <div className={`gacha-container ${isPopup ? 'popup-mode' : ''}`}>
      {/* 타이틀 (팝업 모드에서만 표시) */}
      {isPopup && (
        <div className="gacha-popup-title mb-3">
          <h1 className="text-2xl font-bold text-center text-white drop-shadow-md mb-1">
            럭키 랜덤뽑기
          </h1>
        </div>
      )}

      {/* Ticket Display - 상단 영역 */}
      <div className="gacha-tickets my-2">
        <div className="flex items-center gap-2 justify-center">
          <span className={`${isPopup ? 'text-2xl' : 'text-3xl'} drop-shadow-lg`}>🎫</span>
          <span className="text-white font-bold text-xl drop-shadow-md">{tickets}</span>
          <span className="text-white text-sm opacity-70 ml-1">티켓</span>
        </div>
      </div>

      {/* Gacha Box - 중앙 영역 */}
      <div className={`gacha-box ${isPlaying ? 'playing' : ''} my-3`}>
        <div className={`gacha-icon ${isPlaying ? 'playing' : ''}`}>
          📦
        </div>
        <h2 className="gacha-title">랜덤뽑기 상자</h2>
        <p className="gacha-description"> 지민이가 준비한 선물상자!</p>
      </div>

      {/* 상자 설명 - 가이드 텍스트 */}
      <div className="text-center max-w-[280px] px-2 mt-2 mb-4">
        <p className="text-white/80 text-sm">
          모델 가챠박스에서 다양한 아이템을 뽑아가세요
        </p>
        {socialStats.gacha_spins_today > 0 && (
            <p className="text-cyan-300 text-xs mt-1 animate-pulse">
                오늘 {socialStats.gacha_spins_today}명이 도전했습니다!
            </p>
        )}
      </div>

      {/* Buttons - 하단 영역 */}
      <div className={`flex flex-col gap-3 w-full ${isPopup ? 'mt-2 mb-3' : 'max-w-xs mx-auto'}`}>
        {/* 주요 액션 버튼 - 랜덤뽑기 */}
        <div className="text-center text-sm text-white/70 mb-1">
          {tickets > 0 ? `티켓 1장으로 아이템을 뽑을 수 있습니다` : `티켓이 부족합니다`}
        </div>

        <button
          onClick={handlePull}
          disabled={tickets <= 0 || isPlaying}
          className={`gacha-button gacha-pull-button ${tickets <= 0 || isPlaying ? 'disabled' : ''}`}
        >
          {isPlaying ? (
            <div className="flex items-center justify-center gap-2">
              <div className="gacha-loading"></div>
              뽑는 중...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl drop-shadow-lg">🎰</span>
              랜덤뽑기
            </div>
          )}
        </button>

        {/* 보조 액션 버튼 - 티켓 충전 */}
        <div className="flex justify-center mt-2">
          <button
            onClick={handleRecharge}
            className="gacha-button gacha-recharge-button mx-auto"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">⚡</span>
              티켓충전
            </div>
          </button>
        </div>
      </div>

      {/* Modal */}
      <GachaModal
        isOpen={showModal}
        result={result}
        onClose={handleCloseModal}
      />

      {/* 뽑기 횟수 표시 */}
      {pullCount > 0 && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs">
          총 {pullCount}회 도전
        </div>
      )}
    </div>
  );
}
