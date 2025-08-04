import React from 'react';
import { Home, Compass, ShoppingBag, User, Settings, LogOut } from 'lucide-react'; // Example icons

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, label, isActive }) => {
  return (
    <a
      href={href}
      className={`
        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150
        ${isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }
      `}
    >
      <Icon size={20} className="mr-3" />
      <span>{label}</span>
    </a>
  );
};

export interface SidebarProps {
  // Props to control active links or other sidebar states can be added here
  currentPath?: string; // Example: to highlight active link
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/' }) => {
  const navigationLinks = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/explore', icon: Compass, label: 'Explore Games' },
    { href: '/shop', icon: ShoppingBag, label: 'Token Shop' },
    { href: '/profile', icon: User, label: 'My Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border h-screen fixed top-0 left-0 pt-[var(--app-header-height-desktop)] safe-bottom z-40">
      {/* Added z-40 to be below sticky header (z-50) if they were to overlap, and pt for header height */}
      <div className="flex-grow p-4 overflow-y-auto">
        <nav className="space-y-2">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.label}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={currentPath === link.href}
            />
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-border">
        <NavLink href="/logout" icon={LogOut} label="Logout" />
      </div>
    </aside>
  );
};

export default Sidebar;
