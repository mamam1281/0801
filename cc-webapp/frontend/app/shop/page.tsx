
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Coins, Gem, Gift, ShoppingCart, Shield } from "lucide-react";
import { Percent } from "lucide-react";
import { Link2 } from "lucide-react";

const itemGroup = [
  {
    id: 4,
    name: "한폴방지 아이템",
    price: 20000,
    icon: <Shield className="w-7 h-7 text-blue-400" />,
    extra: "(주 2회)"
  },
  {
    id: 5,
    name: "출석연결 아이템",
    price: 30000,
    icon: <Link2 className="w-7 h-7 text-cyan-400" />,
    extra: "(월 3회)"
  },
  {
    id: 6,
    name: "입플 30% 아이템",
    price: 50000,
    icon: <Percent className="w-7 h-7 text-lime-400" />,
    extra: "(주 1회)"
  }
];


export default function ShopPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="shop-dashboard w-full max-w-[420px] mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <motion.header
        className="pt-3 pb-4 text-center relative z-20"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.h1
          className="text-2xl font-extrabold tracking-wide text-pink-400 drop-shadow-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.03 }}
        >
          <ShoppingCart className="w-7 h-7 text-pink-400" />
          상점
        </motion.h1>
      </motion.header>
      <main className="flex-1 pb-8 px-3">
        {/* 아이템구매 그룹 */}
        <section className="mt-4 mb-6">
          <h2 className="text-lg font-bold text-pink-300 mb-4 tracking-wider text-center">MODEL 아이템 구매</h2>
          <div className="flex flex-col gap-3 bg-white/5 border border-pink-400/30 rounded-xl p-4">
            {itemGroup.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span className="flex-1 text-base font-semibold text-white">{item.name.replace('아이템', '').trim()}</span>
                <span className="text-yellow-300 font-bold text-base">{item.price.toLocaleString()} GOLD</span>
                {item.extra && <span className="ml-2 text-xs text-pink-200 font-medium">{item.extra}</span>}
              </div>
            ))}
          </div>
        </section>

        {/* 포인트구매 그룹 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-blue-300 mb-4 tracking-wider text-center">MODEL 포인트 구매</h2>
          <div className="flex flex-col gap-3 bg-white/5 border border-blue-400/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 font-bold text-base">30,000 GOLD</span>
              <span className="flex-1 text-base font-semibold text-white text-right">30,000 포인트</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 font-bold text-base">100,000 GOLD</span>
              <span className="flex-1 text-base font-semibold text-white text-right">105,000 포인트</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 font-bold text-base">300,000 GOLD</span>
              <span className="flex-1 text-base font-semibold text-white text-right">330,000 포인트</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 font-bold text-base">1,000,000 GOLD</span>
              <span className="flex-1 text-base font-semibold text-white text-right">1,150,000 포인트</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// TODO: 하단 내역 메뉴를 '지갑'으로 변경 (Footer/Navigation 컴포넌트가 별도 파일일 경우 해당 파일도 수정 필요)
