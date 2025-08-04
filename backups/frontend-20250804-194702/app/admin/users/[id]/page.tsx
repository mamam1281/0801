'use client';

import React from 'react';

export default function UserDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">User Details - ID: {params.id}</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">User detail view will be implemented here.</p>
            </div>
        </div>
    );
}