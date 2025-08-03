import { useState } from 'react';
import ApiClient from '../../../lib/api-client';

export default function SlotMachine() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);

    const handleSpin = async () => {
        setIsSpinning(true);
        try {
            const response = await ApiClient.spinSlot(5000);
            setResult(response);
        } catch (error) {
            console.error('Slot spin failed:', error);
            alert('게임 오류가 발생했습니다.');
        } finally {
            setIsSpinning(false);
        }
    };

    return (
        <div className="slot-machine">
            <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="spin-button"
            >
                {isSpinning ? '스핀 중...' : '스핀'}
            </button>

            {result && (
                <div className="result">
                    <p>결과: {result.win ? '승리!' : '패배'}</p>
                    <p>획득: {result.prize_amount}코인</p>
                </div>
            )}
        </div>
    );
}
