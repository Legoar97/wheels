import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Users } from 'lucide-react';

export const PassengerMatchCard = ({ match, onConfirm, isRequesting }) => {
  return (
    <Card className="bg-card/80 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold">{match.nombre_conductor || match.profile?.full_name || 'Conductor'}</h4>
            <p className="text-sm text-muted-foreground">
              ${match.price_per_seat ?? 0} • {match.available_seats ?? 1} cupos{typeof match.distance_km === 'number' ? ` • ${match.distance_km.toFixed(1)}km` : ''}
            </p>
          </div>
          <Button
            onClick={() => onConfirm(match)}
            disabled={isRequesting}
            className="bg-primary hover:bg-primary/90"
          >
            {isRequesting ? "Solicitando..." : "Solicitar"}
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Desde:</span> {match.pickup_address || match.pickup}</div>
          <div><span className="font-medium">Hasta:</span> {match.dropoff_address || match.destino}</div>
        </div>
      </CardContent>
    </Card>
  );
};