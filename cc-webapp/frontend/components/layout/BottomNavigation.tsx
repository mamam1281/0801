import { motion } from "framer-motion";
import { Home, Gamepad2, ShoppingBag, MessageCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BottomNavigationProps {
  activeTab?: string;
}

const tabs = [
  { id: "home", label: "홈", icon: Home, path: "/" },
  { id: "games", label: "게임", icon: Gamepad2, path: "/games" },
  { id: "shop", label: "상점", icon: ShoppingBag, path: "/shop" },
  { id: "chat", label: "채팅", icon: MessageCircle, path: "/chat" },
  { id: "profile", label: "프로필", icon: User, path: "/profile" },
];

export default function BottomNavigation({ activeTab = "home" }: BottomNavigationProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleTabClick = (tab: typeof tabs[0]) => {
    setCurrentTab(tab.id);
    router.push(tab.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabClick(tab)}
              className="relative flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-purple-600/20 rounded-lg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              <div className="relative z-10">
                <Icon 
                  size={20} 
                  className={isActive ? "text-purple-400" : "text-gray-500"} 
                />
              </div>
              
              <span 
                className={`text-xs font-medium relative z-10 ${
                  isActive ? "text-purple-400" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
