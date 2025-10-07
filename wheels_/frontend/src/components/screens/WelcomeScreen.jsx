import React from 'react';
import { motion } from 'framer-motion';
import { Car, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = ({ pageVariants, pageTransition }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key="welcome"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex flex-col items-center justify-center min-h-screen p-6 gradient-bg"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-glow animate-pulse-slow">
            <Car className="w-12 h-12 text-primary" />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-white mb-4 text-shadow"
        >
          Wheels Externado
        </motion.h1>
        
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/90 text-lg"
        >
          Tu compañero de viaje universitario
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm space-y-4"
      >
        <Card className="glass-effect border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">¡Bienvenido!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                navigate('/auth', { state: { authMode: 'login' } });
              }}
              className="w-full bg-white text-primary hover:bg-white/90 shadow-lg"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </Button>
            
            <Button
              onClick={() => {
                navigate('/auth', { state: { authMode: 'register' } });
              }}
              variant="outline"
              className="w-full border-white bg-white/10 text-white hover:bg-white/20 hover:text-white shadow-md"
              size="lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registrarse
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;