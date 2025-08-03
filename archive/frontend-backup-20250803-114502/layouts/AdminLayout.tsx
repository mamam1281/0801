'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Activity, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, title: '대시보드', path: '/admin' },
    { icon: <Users className="w-5 h-5" />, title: '사용자 관리', path: '/admin/users' },
    { icon: <Award className="w-5 h-5" />, title: '보상 관리', path: '/admin/rewards' },
    { icon: <Activity className="w-5 h-5" />, title: '활동 모니터링', path: '/admin/activities' },
    { icon: <Settings className="w-5 h-5" />, title: '설정', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <motion.aside 
        initial={{ width: sidebarOpen ? 250 : 70 }}
        animate={{ width: sidebarOpen ? 250 : 70 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-900 border-r border-gray-800 fixed h-full z-10 overflow-hidden"
      >
        {/* Logo and toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {sidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold text-cyan-400"
            >
              카지노클럽 관리
            </motion.h1>
          )}
          <button 
            onClick={toggleSidebar} 
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-800"
          >
            {sidebarOpen ? 
              <X className="w-5 h-5 text-gray-400" /> : 
              <Menu className="w-5 h-5 text-gray-400" />
            }
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-2 py-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.path} 
                  className="flex items-center px-2 py-3 rounded-lg hover:bg-gray-800 group transition-all duration-300"
                >
                  <div className="text-cyan-400 group-hover:text-cyan-300">
                    {item.icon}
                  </div>
                  
                  {sidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="ml-3 text-gray-300 group-hover:text-white"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-0 w-full px-2 py-4 border-t border-gray-800">
          <Link 
            href="/admin/logout" 
            className="flex items-center px-2 py-3 rounded-lg hover:bg-gray-800 group transition-all duration-300"
          >
            <div className="text-red-400 group-hover:text-red-300">
              <LogOut className="w-5 h-5" />
            </div>
            
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="ml-3 text-gray-300 group-hover:text-white"
              >
                로그아웃
              </motion.span>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div 
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-[250px]' : 'ml-[70px]'} flex-1`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900">
          <h1 className="text-xl font-medium text-white">
            {title}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">관리자</div>
            <div className="w-8 h-8 rounded-full bg-cyan-800 flex items-center justify-center text-white">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
