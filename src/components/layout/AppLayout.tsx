
import React from 'react';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, hideNavigation = false }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container max-w-5xl mx-auto pb-20">
        {children}
      </main>
      
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
