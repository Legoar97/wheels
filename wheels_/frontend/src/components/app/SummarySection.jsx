import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Frown, MapPin, Clock, Users, DollarSign, TrendingUp, Car, User, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const SummarySection = ({ currentUser, pageVariants, pageTransition }) => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    conductorTrips: 0,
    passengerTrips: 0,
    toUniversityTrips: 0,
    fromUniversityTrips: 0,
    topDestinations: [],
    monthlyData: [],
    roleDistribution: [],
    directionDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Paleta de colores consistente - Solo verdes
  const COLORS = {
    primary: '#22c55e',      // Verde principal
    secondary: '#16a34a',    // Verde más oscuro
    accent: '#15803d',       // Verde medio
    success: '#10b981',      // Verde éxito
    warning: '#059669',      // Verde esmeralda
    error: '#047857',        // Verde bosque
    info: '#065f46',         // Verde muy oscuro
    purple: '#064e3b',       // Verde muy oscuro
    pink: '#14532d',         // Verde oliva
    gray: '#365314'          // Verde lima oscuro
  };

  const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.error, COLORS.info, COLORS.purple, COLORS.pink, COLORS.gray];

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser?.email) return;
      setLoading(true);
      
      try {
        // Obtener todos los viajes del usuario desde successful_trips
        const { data: userTrips, error } = await supabase
          .from('successful_trips')
          .select('*')
          .eq('correo', currentUser.email)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching user stats:", error);
          toast({
            title: "Error al cargar estadísticas",
            description: "No se pudieron obtener tus estadísticas. Inténtalo de nuevo.",
            variant: "destructive",
          });
          return;
        }

        if (!userTrips || userTrips.length === 0) {
          setLoading(false);
          return;
        }

        // Procesar estadísticas
        const totalTrips = userTrips.length;
        const conductorTrips = userTrips.filter(trip => trip.tipo_de_usuario === 'conductor').length;
        const passengerTrips = userTrips.filter(trip => trip.tipo_de_usuario === 'pasajero').length;
        const toUniversityTrips = userTrips.filter(trip => trip.destino === 'hacia_universidad').length;
        const fromUniversityTrips = userTrips.filter(trip => trip.destino === 'desde_universidad').length;

        // Destinos más frecuentes
        const destinationCounts = {};
        userTrips.forEach(trip => {
          const dest = trip.direccion_de_viaje;
          destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
        });
        
        const topDestinations = Object.entries(destinationCounts)
          .map(([destination, count]) => ({ destination, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Datos mensuales (últimos 6 meses)
        const monthlyData = [];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
          last6Months.push({ monthKey, monthName });
        }

        last6Months.forEach(({ monthKey, monthName }) => {
          const monthTrips = userTrips.filter(trip => {
            const tripDate = new Date(trip.created_at);
            const tripMonthKey = `${tripDate.getFullYear()}-${String(tripDate.getMonth() + 1).padStart(2, '0')}`;
            return tripMonthKey === monthKey;
          });
          
          monthlyData.push({
            month: monthName,
            viajes: monthTrips.length,
            conductores: monthTrips.filter(t => t.tipo_de_usuario === 'conductor').length,
            pasajeros: monthTrips.filter(t => t.tipo_de_usuario === 'pasajero').length
          });
        });

        // Distribución de roles - Paleta de verdes
        const roleDistribution = [
          { name: 'Conductor', value: conductorTrips, color: COLORS.primary },
          { name: 'Pasajero', value: passengerTrips, color: COLORS.secondary }
        ];

        // Distribución de direcciones - Paleta de verdes
        const directionDistribution = [
          { name: 'Hacia Universidad', value: toUniversityTrips, color: COLORS.success },
          { name: 'Desde Universidad', value: fromUniversityTrips, color: COLORS.accent }
        ];

        setStats({
          totalTrips,
          conductorTrips,
          passengerTrips,
          toUniversityTrips,
          fromUniversityTrips,
          topDestinations,
          monthlyData,
          roleDistribution,
          directionDistribution
        });

      } catch (error) {
        console.error("Error processing stats:", error);
        toast({
          title: "Error al procesar estadísticas",
          description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    };

    fetchUserStats();
  }, [currentUser]);

  // Componente para tarjetas de estadísticas
  const StatCard = ({ title, value, icon: Icon, color = COLORS.primary, subtitle }) => (
    <Card className="bg-white shadow-sm border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Componente para gráfico de anillo personalizado
  const CustomPieChart = ({ data, title, height = 200 }) => (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value, name]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center space-x-4 mt-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Componente para gráfico de barras
  const CustomBarChart = ({ data, title, height = 200 }) => (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="viajes" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Componente para lista de destinos
  const TopDestinationsList = ({ destinations }) => (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Destinos Frecuentes</CardTitle>
      </CardHeader>
      <CardContent>
        {destinations.length > 0 ? (
          <div className="space-y-3">
            {destinations.map((dest, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                      {dest.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600">{dest.count}</span>
                  <span className="text-xs text-gray-500">viajes</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No hay destinos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      key="summary"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="p-4 flex flex-col bg-gray-50 min-h-screen"
    >
      <div className="mb-6 pt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mis Estadísticas</h2>
        <p className="text-gray-600 text-sm">Resumen de tu actividad en Wheels</p>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : stats.totalTrips === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Frown className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay viajes todavía</h3>
            <p className="text-gray-500 mb-4">¡Empieza tu primer viaje para ver estadísticas!</p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => navigate('/app')}
            >
              Buscar un viaje
            </Button>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas principales */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Total Viajes"
                value={stats.totalTrips}
                icon={TrendingUp}
                color={COLORS.primary}
                subtitle="Todos los viajes"
              />
              <StatCard
                title="Como Conductor"
                value={stats.conductorTrips}
                icon={Car}
                color={COLORS.secondary}
                subtitle="Viajes conducidos"
              />
              <StatCard
                title="Como Pasajero"
                value={stats.passengerTrips}
                icon={User}
                color={COLORS.accent}
                subtitle="Viajes como pasajero"
              />
              <StatCard
                title="Hacia Universidad"
                value={stats.toUniversityTrips}
                icon={Navigation}
                color={COLORS.success}
                subtitle="Viajes hacia la U"
              />
            </div>

            {/* Gráficos de distribución - Uno debajo del otro */}
            <div className="space-y-6">
              <CustomPieChart
                data={stats.roleDistribution}
                title="Distribución de Roles"
                height={250}
              />
              <CustomPieChart
                data={stats.directionDistribution}
                title="Dirección de Viajes"
                height={250}
              />
            </div>

            {/* Gráfico de tendencia mensual */}
            <CustomBarChart
              data={stats.monthlyData}
              title="Viajes por Mes (Últimos 6 meses)"
              height={250}
            />

            {/* Destinos más frecuentes */}
            <TopDestinationsList destinations={stats.topDestinations} />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SummarySection;