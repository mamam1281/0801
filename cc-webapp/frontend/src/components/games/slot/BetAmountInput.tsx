import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface BetAmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const BetAmountInput: React.FC<BetAmountInputProps> = ({
  value,
  onChange,
  min = 5000,
  max = 10000,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [error, setError] = useState<string | null>(null);

  // When external value changes, update input
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Allow empty string for typing
    if (newValue === '') {
      setError('금액을 입력해주세요');
      return;
    }

    const numValue = parseInt(newValue, 10);

    // Validate number
    if (isNaN(numValue)) {
      setError('숫자만 입력해주세요');
      return;
    }

    // Validate range
    if (numValue < min) {
      setError(`최소 베팅 금액은 ${min.toLocaleString()}코인입니다`);
      return;
    }

    if (numValue > max) {
      setError(`최대 베팅 금액은 ${max.toLocaleString()}코인입니다`);
      return;
    }

    // Clear error and update parent
    setError(null);
    onChange(numValue);
  };

  // Quick bet amount buttons
  const quickBetOptions = [
    { label: '최소', value: min },
    { label: '중간', value: Math.floor((min + max) / 2) },
    { label: '최대', value: max },
  ];

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-white">베팅 금액</label>
      <div className="relative">
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          disabled={disabled}
          min={min}
          max={max}
          className={`w-full px-4 py-2 bg-gray-900 border rounded-lg focus:ring-2 focus:outline-none ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-purple-500'
          }`}
          placeholder={`${min.toLocaleString()} ~ ${max.toLocaleString()}`}
        />
        <div className="absolute right-2 top-2 text-gray-400">코인</div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 mt-2">
        {quickBetOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              setInputValue(option.value.toString());
              onChange(option.value);
              setError(null);
            }}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-md flex-1 transition-colors"
          >
            {option.label} ({option.value.toLocaleString()})
          </button>
        ))}
      </div>
    </div>
  );
};

export default BetAmountInput;
