import React from 'react';
import { motion } from 'framer-motion';
import { Users, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const UserTypeScreen = ({ setCurrentStep, userType, setUserType, pageVariants, pageTransition }) => {
  
  const handleSetUserType = (type) => {
    setUserType(type);
    setCurrentStep('direction');
  };

  return (
    <motion.div
      key="userType"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-6 flex flex-col bg-background text-foreground flex-grow h-full"
    >
      <div className="flex items-center mb-8 pt-8">
        <h2 className="text-2xl font-bold text-primary ml-4">¿Qué eres hoy?</h2>
      </div>

      <div className="flex-1 space-y-6 flex flex-col justify-center">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="smooth-transition"
        >
          <Card 
            className={`cursor-pointer smooth-transition ${
              userType === 'pasajero' 
                ? 'ring-2 ring-primary shadow-glow bg-primary/10' 
                : 'bg-card hover:border-primary/40'
            }`}
            onClick={() => handleSetUserType('pasajero')}
          >
            <CardContent className="p-8 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 smooth-transition ${
                userType === 'pasajero' ? 'text-primary' : 'text-primary/70'
              }`} />
              <h3 className={`text-2xl font-bold mb-2 smooth-transition ${
                userType === 'pasajero' ? 'text-primary' : 'text-card-foreground'
              }`}>
                Pasajero
              </h3>
              <p className={`smooth-transition ${
                userType === 'pasajero' ? 'text-primary/80' : 'text-muted-foreground'
              }`}>
                Necesito que me lleven
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="smooth-transition"
        >
          <Card 
            className={`cursor-pointer smooth-transition ${
              userType === 'conductor' 
                ? 'ring-2 ring-primary shadow-glow bg-primary/10' 
                : 'bg-card hover:border-primary/40'
            }`}
            onClick={() => handleSetUserType('conductor')}
          >
            <CardContent className="p-8 text-center">
              <Car className={`w-16 h-16 mx-auto mb-4 smooth-transition ${
                userType === 'conductor' ? 'text-primary' : 'text-primary/70'
              }`} />
              <h3 className={`text-2xl font-bold mb-2 smooth-transition ${
                userType === 'conductor' ? 'text-primary' : 'text-card-foreground'
              }`}>
                Conductor
              </h3>
              <p className={`smooth-transition ${
                userType === 'conductor' ? 'text-primary/80' : 'text-muted-foreground'
              }`}>
                Puedo llevar pasajeros
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserTypeScreen;