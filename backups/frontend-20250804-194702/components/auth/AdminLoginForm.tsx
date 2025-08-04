'use client';

import React, { useState } from 'react';

interface AdminLoginFormProps {
    onSwitchToLogin?: () => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSwitchToLogin }) => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // TODO: 실제 admin 로그인 API 호출
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminId,
                    password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // TODO: admin 토큰 저장 및 리다이렉트
                window.location.href = '/admin/dashboard';
            } else {
                const errorData = await response.json();
                setError(errorData.message || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-form">
            <div className="form-header">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    관리자 로그인
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-1">
                        관리자 ID
                    </label>
                    <input
                        type="text"
                        id="adminId"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="관리자 ID를 입력하세요"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        비밀번호
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="비밀번호를 입력하세요"
                        required
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                    } text-white`}
                >
                    {isLoading ? '로그인 중...' : '관리자 로그인'}
                </button>

                {onSwitchToLogin && (
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            일반 사용자 로그인으로 돌아가기
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AdminLoginForm;
