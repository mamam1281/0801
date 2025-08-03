/**
 * 🎰 Casino-Club F2P - Test Component
 * ==================================
 * React 테스트 및 개발용 컴포넌트
 * 
 * 📅 업데이트: 2025-08-03
 * 🎯 목적: 컴포넌트 개발 및 테스트용 예제
 */

import React, { useState } from 'react';

interface TestEditProps {
  initialCount?: number;
  className?: string;
}

const TestEdit: React.FC<TestEditProps> = ({ 
  initialCount = 0, 
  className = '' 
}) => {
  const [count, setCount] = useState<number>(initialCount);
  const [message, setMessage] = useState<string>('Hello, Casino-Club F2P!');

  const increment = (): void => {
    setCount(prevCount => prevCount + 1);
  };

  const decrement = (): void => {
    setCount(prevCount => prevCount - 1);
  };

  const updateMessage = (): void => {
    setMessage(`🎰 카운트: ${count}`);
  };

  const resetCounter = (): void => {
    setCount(initialCount);
    setMessage('Hello, Casino-Club F2P!');
  };

  return (
    <div 
      className={`test-component ${className}`}
      style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '10px',
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}
    >
      <h1 style={{ marginBottom: '20px' }}>🎮 테스트 컴포넌트</h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>{message}</p>
      
      <div style={{ margin: '20px 0' }}>
        <h2 style={{ color: '#FFD700' }}>카운터: {count}</h2>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={decrement} 
            style={{ 
              margin: '0 10px', 
              padding: '10px 20px',
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            - 감소
          </button>
          
          <button 
            onClick={increment} 
            style={{ 
              margin: '0 10px', 
              padding: '10px 20px',
              backgroundColor: '#4ECDC4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            + 증가
          </button>
        </div>

        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={updateMessage} 
            style={{ 
              margin: '0 10px', 
              padding: '10px 20px',
              backgroundColor: '#FFD93D',
              color: '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📝 메시지 업데이트
          </button>
          
          <button 
            onClick={resetCounter} 
            style={{ 
              margin: '0 10px', 
              padding: '10px 20px',
              backgroundColor: '#A8E6CF',
              color: '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 리셋
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <p>🎯 테스트 상태:</p>
        <p>초기값: {initialCount} | 현재값: {count} | 변화량: {count - initialCount}</p>
      </div>
    </div>
  );
};

export default TestEdit;
        </button>
        <button onClick={increment} style={{ margin: '0 10px' }}>
          +
        </button>
      </div>
      <button onClick={updateMessage} style={{ 
        padding: '10px 20px', 
        backgroundColor: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        메시지 업데이트
      </button>
    </div>
  );
};

export default TestComponent;
