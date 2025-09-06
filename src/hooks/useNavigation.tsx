import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationContextType {
  goBack: () => void;
  navigateTo: (path: string) => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = useCallback((path: string) => {
    if (location.pathname !== path) {
      setHistory(prev => [...prev, location.pathname]);
      navigate(path);
    }
  }, [navigate, location.pathname]);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const previousPath = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      navigate(previousPath, { replace: true });
    } else {
      // If no history, go to home
      navigate('/', { replace: true });
    }
  }, [history, navigate]);

  const canGoBack = history.length > 0;

  return (
    <NavigationContext.Provider value={{ goBack, navigateTo, canGoBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};