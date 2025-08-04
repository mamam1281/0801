import { motion } from "framer-motion";
import { useState } from "react";
import clsx from "clsx";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tab({ tabs, activeTab, onChange, className }: TabProps) {
  return (
    <div className={clsx("flex gap-1 p-1 bg-gray-800/50 rounded-lg", className)}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "relative px-4 py-2 rounded-md font-medium transition-colors text-sm flex items-center gap-2",
            activeTab === tab.id
              ? "text-white"
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            {tab.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
