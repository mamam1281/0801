// SimpleRoulette.ts - 완전히 새로운 간단한 룰렛 로직

export interface Bet {
  type: 'number' | 'color';
  value: number | 'red' | 'black';
  amount: number;
}

export interface GameState {
  balance: number;
  isSpinning: boolean;
  winningNumber: number | null;
  bets: Bet[];
  history: number[];
}

// 12숫자 룰렛: 0-11
export const ROULETTE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// 칩 금액
export const CHIP_VALUES = [5, 10, 25, 50];

// 색상 계산 (0=녹색, 홀수=빨강, 짝수=검정)
export function getNumberColor(number: number): 'green' | 'red' | 'black' {
  if (number === 0) return 'green';
  return number % 2 === 1 ? 'red' : 'black';
}

// 승리 판정
export function checkWin(bet: Bet, winningNumber: number): boolean {
  if (bet.type === 'number') {
    return bet.value === winningNumber;
  } else if (bet.type === 'color') {
    const winningColor = getNumberColor(winningNumber);
    if (winningColor === 'green') return false;
    return bet.value === winningColor;
  }
  return false;
}

// 배당률
export function getPayout(bet: Bet): number {
  if (bet.type === 'number') {
    return 12; // 12배
  } else if (bet.type === 'color') {
    return 2; // 2배
  }
  return 0;
}

// 총 승리 금액
export function calculateWinnings(bets: Bet[], winningNumber: number): number {
  return bets.reduce((total, bet) => {
    if (checkWin(bet, winningNumber)) {
      return total + (bet.amount * getPayout(bet));
    }
    return total;
  }, 0);
}

export const anglePerSegment = 360 / ROULETTE_NUMBERS.length;

/**
 * 특정 결과 숫자에 대해 휠이 회전해야 할 각도를 계산합니다.
 * 포인터가 정확히 해당 숫자의 중앙에 위치하도록 각도를 보정합니다.
 * @param resultNumber - 목표 숫자
 * @returns {number} - 시계방향 회전 각도 (degrees)
 */
export function calculateWheelRotation(resultNumber: number): number {
  const index = ROULETTE_NUMBERS.indexOf(resultNumber);
  if (index === -1) {
    console.error(`[SimpleRoulette] calculateWheelRotation: 유효하지 않은 결과 숫자(${resultNumber})`);
    return 0;
  }

  // 각 세그먼트의 중앙에 포인터가 오도록 각도를 계산합니다.
  // 회전 방향은 시계방향(양수 값)으로 통일합니다.
  const angle = 360 - (index * anglePerSegment + anglePerSegment / 2);

  console.log(`[SimpleRoulette] calculateWheelRotation: 숫자 ${resultNumber}(인덱스 ${index}) -> 각도 ${angle.toFixed(2)}deg`);
  return angle;
}

/**
 * 현재 휠의 회전 각도를 기반으로 포인터가 가리키는 숫자를 결정합니다.
 * @param rotation - 현재 휠의 회전 각도 (degrees)
 * @returns {number} - 포인터가 가리키는 숫자
 */
export const getPointerNumber = (rotation: number): number => {
  // 포인터는 항상 0도(상단)에 고정되어 있다고 가정합니다.
  // 휠이 `rotation`만큼 시계방향으로 돌았을 때, 포인터 아래에 위치하게 되는 세그먼트를 찾습니다.
  // 이는 원래 휠의 어떤 각도가 0도로 이동했는지를 찾는 것과 같습니다.
  // 회전 후 0도 위치에 오는 원래 각도는 `(360 - (rotation % 360)) % 360` 입니다.
  const pointerAngle = (360 - (rotation % 360)) % 360;

  // 어떤 숫자(세그먼트)가 이 각도에 가장 가까운지 찾습니다.
  // 각 세그먼트의 중심 각도와 비교하여 가장 차이가 적은 인덱스를 찾습니다.
  let closestIndex = -1;
  let minDiff = 360;

  ROULETTE_NUMBERS.forEach((num, index) => {
    const segmentCenterAngle = index * anglePerSegment + anglePerSegment / 2;
    let diff = Math.abs(pointerAngle - segmentCenterAngle);
    // 0도와 359도처럼 경계를 넘나드는 각도 차이를 보정합니다.
    if (diff > 180) {
      diff = 360 - diff;
    }

    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  const result = ROULETTE_NUMBERS[closestIndex];
  console.log(`[SimpleRoulette] getPointerNumber: 각도 ${rotation.toFixed(2)}deg -> 포인터 각도 ${pointerAngle.toFixed(2)}deg -> 인덱스 ${closestIndex} -> 숫자 ${result}`);
  return result;
};
