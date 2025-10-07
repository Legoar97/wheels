import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import AuthScreen from '@/components/screens/AuthScreen';
import VerificationScreen from '@/components/screens/VerificationScreen';
import MainAppScreen from '@/components/screens/MainAppScreen';
import ProfileSetupScreen from '@/components/screens/ProfileSetupScreen';
import TravelFlow from '@/components/app/TravelFlow';
import SummarySection from '@/components/app/SummarySection';
import AccountSection from '@/components/app/AccountSection';
import LiveTripScreen from '@/components/screens/LiveTripScreen';
import ActiveTripBar from '@/components/ActiveTripBar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { TripProvider } from '@/contexts/TripContext';

const pageVariants = {
  initial: { opacity: 0, x: "100vw" },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: "-100vw" },
};

const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

const ProtectedRoute = ({ user, redirectPath = '/welcome' }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut: contextSignOut, session } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    await contextSignOut();
    setIsLoading(false);
  };

  const checkUserProfile = async (user) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { 
      toast({ title: "Error al cargar perfil", description: error.message, variant: "destructive" });
      handleLogout();
      return null;
    }

    const fullUser = { ...user, ...profile };
    setCurrentUser(fullUser);

    if (!profile || !profile.full_name || !profile.avatar_url) {
      navigate('/profile-setup', { replace: true });
    } else if (location.pathname === '/profile-setup' || location.pathname === '/welcome' || location.pathname === '/auth' || location.pathname === '/verification') {
      navigate('/app', { replace: true });
    }
    return fullUser;
  };

  useEffect(() => {
    setIsLoading(true);
    if (session) {
      checkUserProfile(session.user);
    } else {
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, [session]);

  if (isLoading && !session) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <TripProvider>
      <div className="mobile-container bg-background text-foreground min-h-screen">
        {/* Barra persistente de viaje activo */}
        <ActiveTripBar />
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/welcome" element={<WelcomeScreen pageVariants={pageVariants} pageTransition={pageTransition} />} />
            <Route path="/auth" element={<AuthScreen pageVariants={pageVariants} pageTransition={pageTransition} />} />
            <Route path="/verification" element={<VerificationScreen pageVariants={pageVariants} pageTransition={pageTransition} />} />
            
            <Route element={<ProtectedRoute user={currentUser} />}>
              <Route path="/profile-setup" element={<ProfileSetupScreen currentUser={currentUser} setCurrentUser={setCurrentUser} onProfileComplete={() => navigate('/app', { replace: true })} pageVariants={pageVariants} pageTransition={pageTransition} />} />
              
              <Route path="/app" element={<MainAppScreen currentUser={currentUser} setCurrentUser={setCurrentUser} handleLogout={handleLogout} />}>
                <Route index element={<TravelFlow currentUser={currentUser} pageVariants={pageVariants} pageTransition={pageTransition} />} />
                <Route path="summary" element={<SummarySection currentUser={currentUser} pageVariants={pageVariants} pageTransition={pageTransition} />} />
                <Route path="account" element={<AccountSection currentUser={currentUser} setCurrentUser={setCurrentUser} handleLogout={handleLogout} pageVariants={pageVariants} pageTransition={pageTransition} />} />
              </Route>
              
              <Route path="/trip/:tripId" element={<LiveTripScreen currentUser={currentUser} />} />

            </Route>
            
            <Route path="*" element={<Navigate to={currentUser ? "/app" : "/welcome"} />} />
          </Routes>
        </AnimatePresence>
      </div>
    </TripProvider>
  );
};

export default App;