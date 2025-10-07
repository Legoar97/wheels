import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, fullName) => {
    try {
      console.log('🔍 Iniciando registro con:', { email, fullName });
      
      // 1. Registrar el usuario
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log('📋 Resultado del registro:', { data, error });

      if (error) {
        console.error('❌ Error en registro:', error);
        toast({
          variant: "destructive",
          title: "Sign up Failed",
          description: error.message || "Something went wrong",
        });
        return { user: null, error };
      }

      if (data.user) {
        console.log('✅ Usuario creado, creando perfil...');
        
        // 2. Crear el perfil automáticamente
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            user_type: 'pasajero',
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
          // No mostrar error al usuario, el perfil se puede crear después
        } else {
          console.log('✅ Perfil creado exitosamente');
        }

        toast({ 
          title: "Registro exitoso", 
          description: "¡Revisa tu correo para verificar tu cuenta!" 
        });
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Error general en signUp:', error);
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: "Error inesperado durante el registro",
      });
      return { user: null, error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    } else if (data.user) {
      toast({ title: "¡Bienvenido de nuevo!", description: "Has iniciado sesión correctamente." });
    }

    return { user: data.user, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error && !error.message.includes("Session from session_id claim in JWT does not exist")) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
       return { error };
    }
    
    return { error: null };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};