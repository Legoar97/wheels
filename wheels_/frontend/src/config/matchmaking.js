export const matchmakingConfig = {
  // Search radius for real-time trip requests in kilometers.
  realtimeSearchRadiusKm: 5,
  
  // Search radius for scheduled reservations in kilometers.
  reservationSearchRadiusKm: 10,
  
  // Weights for the driver scoring algorithm. Must sum to 1.
  scoreWeights: {
    eta: 0.5,
    distance: 0.2,
    acceptanceRate: 0.15,
    driverRating: 0.15,
  },
  
  // How long a driver has to accept an offer in seconds.
  offerTimeoutSeconds: 30,
  
  // How many drivers to offer the trip to in cascade before failing.
  offerMaxRetries: 3,
  
  // Service operational window for scheduled reservations.
  reservationWindow: {
    start: '06:00', // 6:00 AM
    end: '22:00',   // 10:00 PM
  },
  
  // How many minutes before a scheduled trip to start matching.
  reservationDispatchMinutesBefore: 15,
  
  // How many minutes to wait before retrying a failed reservation match.
  reservationRetryMinutes: 2,

  // Google Maps Distance Matrix API Configuration
  googleMaps: {
    // Enable Google Maps distance calculation
    enabled: true,
    
    // Cache duration in milliseconds (5 minutes)
    cacheDurationMs: 5 * 60 * 1000,
    
    // Maximum number of destinations per batch request
    maxDestinationsPerBatch: 25,
    
    // Fallback to spatial distance if Google Maps fails
    fallbackToSpatial: true,
    
    // Traffic model for distance calculation
    trafficModel: 'best_guess', // 'best_guess', 'pessimistic', 'optimistic'
    
    // Travel mode
    travelMode: 'driving', // 'driving', 'walking', 'bicycling', 'transit'
  },

  // Distance calculation preferences
  distanceCalculation: {
    // Primary method: 'google_maps' or 'spatial'
    primaryMethod: 'google_maps',
    
    // Maximum distance for matching (km)
    maxDistanceKm: 5,
    
    // Consider traffic in calculations
    considerTraffic: true,
    
    // Cache distance calculations
    enableCache: true,
  },
};