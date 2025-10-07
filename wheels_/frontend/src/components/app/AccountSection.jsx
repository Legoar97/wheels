// src/components/app/AccountSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Lock, PlusCircle, Edit3, Trash2, User as UserIcon, Car as CarIcon, Palette, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AccountSection = ({ currentUser, setCurrentUser, handleLogout, pageVariants, pageTransition }) => {
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({ make: '', model: '', year: '', color: '', license_plate: '', capacity: 4 });
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [userVehicles, setUserVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const avatarFileRef = useRef(null);

  useEffect(() => {
    fetchUserVehicles();
  }, [currentUser]);

  const fetchUserVehicles = async () => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', currentUser.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
    } else {
      setUserVehicles(data || []);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error al subir foto", description: uploadError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id)
      .select()
      .single();
    
    setIsLoading(false);
    if (updateError) {
      toast({ title: "Error al actualizar perfil", description: updateError.message, variant: "destructive" });
    } else {
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      toast({ title: "Foto de perfil actualizada" });
    }
  };

  const handleVehicleSubmit = async () => {
    if (!currentVehicle.make || !currentVehicle.model || !currentVehicle.license_plate || !currentVehicle.color || !currentVehicle.year) {
      toast({ title: "Error", description: "Completa todos los campos del vehículo.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (editingVehicleId) {
        // Actualizar vehículo existente
        const { data, error } = await supabase
          .from('vehicles')
          .update({
            make: currentVehicle.make,
            model: currentVehicle.model,
            year: parseInt(currentVehicle.year),
            color: currentVehicle.color,
            license_plate: currentVehicle.license_plate,
            capacity: parseInt(currentVehicle.capacity),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVehicleId)
          .select()
          .single();

        if (error) throw error;
        
        toast({ title: "Vehículo Actualizado", description: "Vehículo actualizado con éxito." });
      } else {
        // Crear nuevo vehículo
        const { data, error } = await supabase
          .from('vehicles')
          .insert({
            driver_id: currentUser.id,
            make: currentVehicle.make,
            model: currentVehicle.model,
            year: parseInt(currentVehicle.year),
            color: currentVehicle.color,
            license_plate: currentVehicle.license_plate,
            capacity: parseInt(currentVehicle.capacity)
          })
          .select()
          .single();

        if (error) throw error;
        
        toast({ title: "Vehículo Guardado", description: "Vehículo añadido con éxito." });
      }
      
      // Recargar la lista de vehículos
      await fetchUserVehicles();
      
      // Limpiar formulario
      setIsVehicleModalOpen(false);
      setCurrentVehicle({ make: '', model: '', year: '', color: '', license_plate: '', capacity: 4 });
      setEditingVehicleId(null);
      
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({ 
        title: "Error al guardar vehículo", 
        description: error.message || "Error inesperado", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditVehicleModal = (vehicle) => {
    setCurrentVehicle({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      capacity: vehicle.capacity || 4
    });
    setEditingVehicleId(vehicle.id);
    setIsVehicleModalOpen(true);
  };

  const deleteVehicle = async (vehicleId) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', vehicleId)
        .eq('driver_id', currentUser.id);

      if (error) throw error;
      
      toast({ title: "Vehículo Eliminado", description: "Vehículo eliminado con éxito." });
      
      // Recargar la lista de vehículos
      await fetchUserVehicles();
      
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({ 
        title: "Error al eliminar vehículo", 
        description: error.message || "Error inesperado", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      toast({ title: "Error", description: "Completa todos los campos de contraseña.", variant: "destructive" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Error", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Error", description: "La nueva contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    setIsLoading(false);

    if (error) {
      toast({ title: "Error al cambiar contraseña", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña Cambiada", description: "Tu contraseña ha sido actualizada. Puede que necesites iniciar sesión de nuevo." });
      setIsPasswordModalOpen(false);
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  };
  
  if (!currentUser) {
    return (
      <motion.div 
        key="account-loading" 
        className="p-6 flex flex-col items-center justify-center flex-grow space-y-6 h-full"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p>Cargando datos de la cuenta...</p>
      </motion.div>
    );
  }

  const userInitials = currentUser.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : (currentUser.email ? currentUser.email.substring(0, 2).toUpperCase() : "??");

  return (
    <motion.div
      key="account"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-4 sm:p-6 flex flex-col flex-grow space-y-6 h-full overflow-y-auto"
    >
      <div className="flex items-center space-x-4 mb-2 pt-6 sm:pt-8">
        <div className="relative">
          <Avatar className="w-20 h-20 text-2xl font-bold shadow-md ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
            <AvatarImage src={currentUser.avatar_url} alt={currentUser.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <input type="file" ref={avatarFileRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          <Button
            size="icon"
            variant="outline"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card hover:bg-muted"
            onClick={() => avatarFileRef.current.click()}
          >
            <Camera className="w-4 h-4 text-primary" />
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">{currentUser.full_name || "Usuario"}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{currentUser.email}</p>
        </div>
      </div>

      <Card className="smooth-transition shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center"><CarIcon className="w-5 h-5 mr-2 text-primary"/>Mis Vehículos</CardTitle>
          <CardDescription className="text-xs">Administra los vehículos para tus viajes como conductor.</CardDescription>
        </CardHeader>
        <CardContent>
          {userVehicles && userVehicles.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {userVehicles.map((vehicle) => (
                <li key={vehicle.id} className="flex justify-between items-center p-3 bg-background/70 rounded-lg shadow-sm border border-border/50">
                  <div className="flex items-center">
                      <div className="p-2 bg-primary/10 rounded-md mr-3">
                        <CarIcon className="w-5 h-5 text-primary"/>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">{vehicle.make} {vehicle.model} ({vehicle.license_plate})</p>
                        <p className="text-xs text-muted-foreground flex items-center"><Palette className="w-3 h-3 mr-1"/> {vehicle.color} • {vehicle.year}</p>
                      </div>
                  </div>
                  <div className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditVehicleModal(vehicle)} className="hover:bg-primary/10 rounded-full w-8 h-8">
                        <Edit3 className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteVehicle(vehicle.id)} className="hover:bg-destructive/10 rounded-full w-8 h-8">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">No has añadido ningún vehículo.</p>
          )}
          <Dialog open={isVehicleModalOpen} onOpenChange={(isOpen) => {
            setIsVehicleModalOpen(isOpen);
            if (!isOpen) {
              setCurrentVehicle({ make: '', model: '', year: '', color: '', license_plate: '', capacity: 4 });
              setEditingVehicleId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => {setEditingVehicleId(null); setCurrentVehicle({ make: '', model: '', year: '', color: '', license_plate: '', capacity: 4 });}}>
                <PlusCircle className="w-4 h-4 mr-2" />
                {editingVehicleId !== null ? 'Editar Vehículo' : 'Añadir Vehículo'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-primary">{editingVehicleId !== null ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de tu vehículo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="make" className="text-muted-foreground">Marca</Label>
                  <Input id="make" value={currentVehicle.make} onChange={(e) => setCurrentVehicle({...currentVehicle, make: e.target.value})} className="bg-input border-border focus:ring-primary" placeholder="Ej: Toyota" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="model" className="text-muted-foreground">Modelo</Label>
                  <Input id="model" value={currentVehicle.model} onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})} className="bg-input border-border focus:ring-primary" placeholder="Ej: Corolla" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="year" className="text-muted-foreground">Año</Label>
                  <Input id="year" type="number" value={currentVehicle.year} onChange={(e) => setCurrentVehicle({...currentVehicle, year: e.target.value})} className="bg-input border-border focus:ring-primary" placeholder="Ej: 2020" min="1990" max="2025" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="license_plate" className="text-muted-foreground">Placa</Label>
                  <Input id="license_plate" value={currentVehicle.license_plate} onChange={(e) => setCurrentVehicle({...currentVehicle, license_plate: e.target.value})} className="bg-input border-border focus:ring-primary" placeholder="Ej: ABC123" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="color" className="text-muted-foreground">Color</Label>
                  <Input id="color" value={currentVehicle.color} onChange={(e) => setCurrentVehicle({...currentVehicle, color: e.target.value})} className="bg-input border-border focus:ring-primary" placeholder="Ej: Blanco" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="capacity" className="text-muted-foreground">Capacidad (pasajeros)</Label>
                  <Select value={currentVehicle.capacity.toString()} onValueChange={(value) => setCurrentVehicle({...currentVehicle, capacity: parseInt(value)})}>
                    <SelectTrigger className="bg-input border-border focus:ring-primary">
                      <SelectValue placeholder="Selecciona capacidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 pasajeros</SelectItem>
                      <SelectItem value="3">3 pasajeros</SelectItem>
                      <SelectItem value="4">4 pasajeros</SelectItem>
                      <SelectItem value="5">5 pasajeros</SelectItem>
                      <SelectItem value="6">6 pasajeros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsVehicleModalOpen(false)} className="border-border text-muted-foreground hover:bg-muted/50">Cancelar</Button>
                <Button type="submit" onClick={handleVehicleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                  {isLoading ? "Guardando..." : (editingVehicleId !== null ? 'Guardar Cambios' : 'Añadir Vehículo')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="smooth-transition shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center"><UserIcon className="w-5 h-5 mr-2 text-primary"/>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium text-card-foreground">{currentUser.full_name || "No especificado"}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-card-foreground">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tipo de Usuario (Perfil):</span>
                <span className="font-medium text-card-foreground capitalize">{currentUser.user_type || "No especificado"}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Miembro desde:</span>
                <span className="font-medium text-card-foreground">
                    {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : "N/A"}
                </span>
            </div>
        </CardContent>
      </Card>


      <Card className="smooth-transition shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center"><Lock className="w-5 h-5 mr-2 text-primary"/>Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog open={isPasswordModalOpen} onOpenChange={(isOpen) => {
            setIsPasswordModalOpen(isOpen);
            if (!isOpen) {
              setPasswords({ newPassword: '', confirmPassword: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-border text-primary hover:bg-primary/10 hover:text-primary">
                <Lock className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-primary">Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa tu nueva contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="newPassword" className="text-muted-foreground">Nueva Contraseña</Label>
                  <Input id="newPassword" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="bg-input border-border focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirmar Nueva Contraseña</Label>
                  <Input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="bg-input border-border focus:ring-primary" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="border-border text-muted-foreground hover:bg-muted/50">Cancelar</Button>
                <Button type="submit" onClick={handleChangePassword} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                  {isLoading ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-destructive-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
      <div className="pb-16"></div>
    </motion.div>
  );
};

export default AccountSection;