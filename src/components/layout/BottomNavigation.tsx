
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Settings, Bell, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Navigation items
  const navItems = [
    { 
      label: t('services'), 
      icon: <LayoutGrid size={24} />, 
      path: '/services' 
    },
    { 
      label: t('home'), 
      icon: <Home size={24} />, 
      path: '/' 
    },
    { 
      label: t('settings'), 
      icon: <Settings size={24} />, 
      path: '/settings' 
    },
    { 
      label: t('notifications'), 
      icon: <Bell size={24} />, 
      path: '/notifications' 
    },
    { 
      label: t('documents'), 
      icon: <FileText size={24} />, 
      path: '/documents' 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex justify-around items-center px-2 shadow-sm">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          aria-label={item.label}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;
