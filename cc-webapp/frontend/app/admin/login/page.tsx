'use client';

import AdminLoginForm from '../../../components/auth/AdminLoginForm';
import { Suspense } from 'react';

export default function AdminLoginPage() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <Suspense fallback={<div>Loading...</div>}>
                    <AdminLoginForm
                        onSwitchToLogin={() => {
                            window.location.href = '/auth';
                        }}
                    />
                </Suspense>
            </div>
        </div>
    );
}
