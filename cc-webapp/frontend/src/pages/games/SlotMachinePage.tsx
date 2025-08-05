'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { spinSlotMachine, SlotSpinResponse, getUserGameLimits } from '@/api/slotMachine';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  RefreshCw,
  ArrowLeft,
  Diamond,
  Crown,
  Heart,
  Star,
  Sparkles,
  Flame,
} from 'lucide-react';

// 심볼 객체 정의
type SlotSymbol = {
  id: string;
  icon: React.ComponentType<any>;
  name: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  isWild?: boolean;
};

const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'cherry', icon: Heart, name: '체리', value: 2, rarity: 'common', color: 'text-pink-400' },
  { id: 'lemon', icon: Star, name: '별', value: 3, rarity: 'common', color: 'text-yellow-400' },
  {
    id: 'diamond',
    icon: Diamond,
    name: '다이아',
    value: 5,
    rarity: 'rare',
    color: 'text-blue-400',
  },
  { id: 'crown', icon: Crown, name: '크라운', value: 10, rarity: 'epic', color: 'text-gold' },
  {
    id: 'seven',
    icon: Sparkles,
    name: '세븐',
    value: 25,
    rarity: 'legendary',
    color: 'text-primary',
  },
  {
    id: 'wild',
    icon: Flame,
    name: '와일드',
    value: 0,
    rarity: 'legendary',
    color: 'text-gradient-primary',
    isWild: true,
  },
];

const SlotMachinePage: React.FC = () => {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState<number>(5000);
  const [lines, setLines] = useState<number>(3);
  const [vipMode, setVipMode] = useState<boolean>(false);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<SlotSpinResponse | null>(null);
  const [remainingSpins, setRemainingSpins] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  // 사용자 게임 제한 정보 조회
  useEffect(() => {
    if (user?.id) {
      getUserGameLimits(user.id)
        .then((data) => {
          if (data.daily_limits?.slot) {
            setRemainingSpins(data.daily_limits.slot.remaining);
          }
        })
        .catch((err) => {
          console.error('게임 제한 정보 조회 실패:', err);
        });
    }
  }, [user]);

  // 베팅 금액 변경 핸들러
  const handleBetAmountChange = (event: Event, newValue: number | number[]) => {
    setBetAmount(newValue as number);
  };

  // 라인 수 변경 핸들러
  const handleLinesChange = (event: Event, newValue: number | number[]) => {
    setLines(newValue as number);
  };

  // VIP 모드 변경 핸들러
  const handleVipModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVipMode(event.target.checked);
  };

  // 스핀 실행 핸들러
  const handleSpin = async () => {
    if (!user?.id) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (remainingSpins <= 0) {
      setError('오늘의 스핀 횟수를 모두 소진하였습니다.');
      return;
    }

    try {
      setSpinning(true);
      setError(null);

      // API 호출
      const result = await spinSlotMachine({
        user_id: user.id,
        bet_amount: betAmount,
        lines,
        vip_mode: vipMode,
      });

      // 결과 저장
      setSpinResult(result);
      setRemainingSpins(result.remaining_spins);
    } catch (err: any) {
      setError(err.response?.data?.detail || '스핀 요청에 실패했습니다.');
    } finally {
      setSpinning(false);
    }
  };

  // 승리 라인인지 확인
  const isWinningSymbol = (row: number, col: number) => {
    if (!spinResult) return false;

    // 가로 승리 라인 확인 (1, 2, 3)
    if (spinResult.win_lines.includes(row + 1)) {
      return true;
    }

    // 대각선 승리 라인 확인
    // 왼쪽 상단에서 오른쪽 하단 (4)
    if (spinResult.win_lines.includes(4) && row === col) {
      return true;
    }

    // 오른쪽 상단에서 왼쪽 하단 (5)
    if (spinResult.win_lines.includes(5) && row === 2 - col) {
      return true;
    }

    return false;
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h2" align="center" gutterBottom>
        🎰 슬롯 머신
      </Typography>

      <SlotContainer>
        {/* 릴 표시 영역 */}
        <ReelContainer>
          {spinResult
            ? // 결과 표시
              spinResult.result.map((column, colIndex) => (
                <ReelColumn key={colIndex}>
                  {column.map((symbolId, rowIndex) => (
                    <SymbolBox key={rowIndex} isWinning={isWinningSymbol(rowIndex, colIndex)}>
                      {SYMBOLS[symbolId as keyof typeof SYMBOLS] || symbolId}
                    </SymbolBox>
                  ))}
                </ReelColumn>
              ))
            : // 기본 표시
              Array(3)
                .fill(0)
                .map((_, colIndex) => (
                  <ReelColumn key={colIndex}>
                    {Array(3)
                      .fill(0)
                      .map((_, rowIndex) => (
                        <SymbolBox key={rowIndex}>?</SymbolBox>
                      ))}
                  </ReelColumn>
                ))}
        </ReelContainer>

        {/* 결과 표시 영역 */}
        {spinResult && (
          <Box textAlign="center" mb={3}>
            {spinResult.win_lines.length > 0 ? (
              <Typography variant="h4" color="success.main">
                🎉 축하합니다! {spinResult.win_amount.toLocaleString()}코인을 획득하셨습니다!
              </Typography>
            ) : (
              <Typography variant="h5" color="text.secondary">
                아쉽게도 이번에는 당첨되지 않았습니다.
              </Typography>
            )}

            {spinResult.special_event && (
              <Typography variant="h6" color="primary">
                특별 이벤트: {spinResult.special_event}
              </Typography>
            )}
          </Box>
        )}

        {/* 설정 영역 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography id="bet-amount-slider" gutterBottom>
              베팅 금액: {betAmount.toLocaleString()} 코인
            </Typography>
            <Slider
              value={betAmount}
              onChange={handleBetAmountChange}
              aria-labelledby="bet-amount-slider"
              step={1000}
              min={5000}
              max={10000}
              marks={[
                { value: 5000, label: '5,000' },
                { value: 10000, label: '10,000' },
              ]}
              disabled={spinning}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography id="lines-slider" gutterBottom>
              라인 수: {lines}
            </Typography>
            <Slider
              value={lines}
              onChange={handleLinesChange}
              aria-labelledby="lines-slider"
              step={1}
              min={1}
              max={5}
              marks={[
                { value: 1, label: '1' },
                { value: 3, label: '3' },
                { value: 5, label: '5' },
              ]}
              disabled={spinning}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
          <FormControlLabel
            control={
              <Switch
                checked={vipMode}
                onChange={handleVipModeChange}
                disabled={spinning}
                color="primary"
              />
            }
            label="VIP 모드"
          />

          <Typography>남은 스핀 횟수: {remainingSpins}/30</Typography>
        </Box>

        {/* 오류 메시지 */}
        {error && (
          <Typography color="error" align="center" mt={2}>
            {error}
          </Typography>
        )}

        {/* 스핀 버튼 */}
        <Box textAlign="center" mt={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSpin}
            disabled={spinning || remainingSpins <= 0}
          >
            {spinning ? '스핀 중...' : '스핀!'}
          </Button>
        </Box>
      </SlotContainer>
    </Container>
  );
};

export default SlotMachinePage;
