import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Welcome from './Welcome';
import Dashboard from './Dashboard';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-pixel text-[10px] text-primary animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated, otherwise show welcome
  return isAuthenticated ? <Dashboard /> : <Welcome />;
};

export default Index;
