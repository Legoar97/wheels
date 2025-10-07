import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MapPin, User, Car } from 'lucide-react';

const TripParticipants = ({ tripId, userEmail }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tripId) {
      fetchParticipants();
    }
  }, [tripId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar la función SQL para obtener participantes
      const { data, error } = await supabase
        .rpc('get_trip_participants', {
          trip_id_param: tripId
        });

      if (error) {
        throw error;
      }

      setParticipants(data || []);
    } catch (err) {
      console.error('Error al obtener participantes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-muted-foreground">Cargando participantes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Error al cargar participantes: {error}</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">No se encontraron participantes para este viaje.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Participantes del Viaje</h3>
        <span className="text-sm text-muted-foreground">({participants.length})</span>
      </div>

      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`p-4 rounded-lg border ${
              participant.tipo_de_usuario === 'conductor'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                participant.tipo_de_usuario === 'conductor'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {participant.tipo_de_usuario === 'conductor' ? (
                  <Car className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${
                    participant.tipo_de_usuario === 'conductor'
                      ? 'text-blue-800'
                      : 'text-green-800'
                  }`}>
                    {participant.tipo_de_usuario === 'conductor' ? 'Conductor' : 'Pasajero'}
                  </span>
                  {participant.correo === userEmail && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Tú
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2 break-all">
                  {participant.correo}
                </p>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {participant.direccion_de_viaje}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Registrado: {new Date(participant.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripParticipants;
