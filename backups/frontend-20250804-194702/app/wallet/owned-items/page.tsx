import React from 'react';


// 요청하신 보유 아이템 3종
const ownedItems = [
  { id: 1, name: '한폴방지 아이템', description: '사용시 한폴방지 낙첨된 배당은 제외', icon: '🛡️', count: 0 },
  { id: 2, name: '출석연결 아이템', description: '사용시 원하는 날짜 출석인정', icon: '📅', count: 0 },
  { id: 3, name: '충전30% 아이템', description: '사용 후 충전시 충전보너스 30%', icon: '💰', count: 0 },
];

export default function OwnedItemsPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">보유 아이템</h1>
      <div className="space-y-4">
        {ownedItems.length === 0 ? (
          <div className="text-gray-400">보유한 아이템이 없습니다.</div>
        ) : (
          ownedItems.map(item => (
            <div key={item.id} className="flex items-center bg-[#181828] rounded-lg p-4 shadow-md">
              <span className="text-3xl mr-4">{item.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg flex items-center gap-2">
                  {item.name}
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-200">{item.count}개</span>
                </div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
