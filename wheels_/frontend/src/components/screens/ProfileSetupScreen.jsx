import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ProfileSetupScreen = ({ currentUser, setCurrentUser, onProfileComplete, pageVariants, pageTransition }) => {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ title: "Archivo inválido", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
    }
  };

  const handleProfileSave = async () => {
    if (!fullName) {
      toast({ title: "Nombre requerido", description: "Por favor, ingresa tu nombre completo.", variant: "destructive" });
      return;
    }
    if (!avatarFile && !currentUser?.avatar_url) {
      toast({ title: "Foto requerida", description: "Por favor, sube una foto de perfil.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let avatarUrl = currentUser?.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast({ title: "Error al subir la foto", description: uploadError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id)
      .select()
      .single();

    setIsLoading(false);

    if (updateError) {
      toast({ title: "Error al guardar el perfil", description: updateError.message, variant: "destructive" });
    } else {
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      toast({ title: "¡Perfil completado!", description: "Bienvenido a la comunidad." });
      onProfileComplete();
    }
  };

  const userInitials = fullName ? fullName.substring(0, 2).toUpperCase() : currentUser.email.substring(0, 2).toUpperCase();

  return (
    <motion.div
      key="profileSetup"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen p-6 flex flex-col justify-center items-center bg-background"
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Configura tu Perfil</CardTitle>
          <CardDescription>Completa tu información para continuar. ¡Es obligatorio!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar
                className="w-32 h-32 text-4xl cursor-pointer ring-4 ring-primary/20 ring-offset-2 ring-offset-background"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={avatarPreview} alt="Avatar de usuario" />
                <AvatarFallback className="bg-primary/10 text-primary">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-transform duration-200 ease-in-out hover:scale-110">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg"
            />
            <p className="text-sm text-muted-foreground">Haz clic en la cámara para subir tu foto</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-muted-foreground">Nombre Completo</Label>
            <Input
              id="fullName"
              placeholder="Tu nombre y apellido"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-input border-border focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleProfileSave}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar y Continuar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileSetupScreen;