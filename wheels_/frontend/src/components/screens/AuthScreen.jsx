import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const AuthScreen = ({ pageVariants, pageTransition }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.authMode) {
      setAuthMode(location.state.authMode);
    }
  }, [location.state]);

  const validateEmail = (email) => {
    if (!email) return false;
    const allowedDomains = ['uexternado.edu.co', 'est.uexternado.edu.co'];
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  };

  const handleAuth = async () => {
    setIsLoading(true);
    const { name, email, password } = formData;

    if (authMode === 'register') {
      if (!name || !email || !password) {
        toast({ title: "Error", description: "Por favor, completa todos los campos.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!validateEmail(email)) {
        toast({ title: "Email no válido", description: "Usa tu correo institucional del Externado.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { user, error } = await signUp(email, password, name);
      if (!error && user && !user.email_confirmed_at) {
        navigate('/verification', { state: { email: user.email } });
      }

    } else {
      if (!email || !password) {
        toast({ title: "Error", description: "Por favor, ingresa tu email y contraseña.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      await signIn(email, password);
    }
    setIsLoading(false);
  };
  
  const handleBack = () => {
    navigate('/welcome');
  };

  return (
    <motion.div
      key="auth"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen p-6 flex flex-col gradient-bg"
    >
      <div className="flex items-center mb-8 pt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-white hover:bg-white/20"
          disabled={isLoading}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-bold text-white ml-4">
          {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        </h2>
      </div>

      <Card className="glass-effect border-white/20 flex-1">
        <CardContent className="p-6 space-y-6">
          {authMode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nombre Completo</Label>
              <Input
                id="name"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white/80 text-primary placeholder:text-primary/70"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email Institucional</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu.email@uexternado.edu.co"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-white/80 text-primary placeholder:text-primary/70"
              disabled={isLoading}
            />
            {authMode === 'register' && (
              <p className="text-white/70 text-xs">
                Solo @uexternado.edu.co o @est.uexternado.edu.co
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="bg-white/80 text-primary placeholder:text-primary/70"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleAuth}
            className="w-full bg-white text-primary hover:bg-white/90 shadow-lg"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <>
                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-white/80 hover:text-white underline text-sm"
              disabled={isLoading}
            >
              {authMode === 'login' 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuthScreen;