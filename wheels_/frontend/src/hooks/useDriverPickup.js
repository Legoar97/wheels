import { useState, useEffect, useCallback } from 'react';
import { pickupOptimizationService } from '../services/pickupOptimizationService';

export const useDriverPickup = (tripId, tripType = 'ida') => {
  // ================================================
  // 🔹 Estados
  // ================================================
  const [currentStep, setCurrentStep] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  // ================================================
  // 🔹 Funciones principales
  // ================================================

  const initializeTrip = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTripCompleted(false);
      setStepCompleted(false);
      
      console.log(`🚀 Inicializando viaje ${tripId} (${tripType})`);
      
      // Obtener optimización del viaje
      const optimizationData = await pickupOptimizationService.getTripOptimization(tripId, tripType);
      setTripData(optimizationData);
      
      // Obtener el primer paso
      const firstStep = await pickupOptimizationService.getTripStep(tripId, 0);
      setCurrentStep(firstStep);
      
      console.log('✅ Viaje inicializado correctamente');
      
    } catch (err) {
      console.error('❌ Error al inicializar viaje:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId, tripType]);

  const goToNextStep = useCallback(async () => {
    try {
      setStepCompleted(false);
      
      // Marcar paso actual como completado
      if (currentStep) {
        await pickupOptimizationService.completeStep(tripId, currentStep.step);
        console.log(`✅ Paso ${currentStep.step} completado`);
      }
      
      // Obtener siguiente paso
      const nextStepData = await pickupOptimizationService.getNextStep(tripId);
      
      if (nextStepData.trip_completed) {
        setTripCompleted(true);
        return;
      }
      
      setCurrentStep(nextStepData);
      setStepCompleted(true);
      
    } catch (err) {
      console.error('❌ Error al avanzar al siguiente paso:', err);
      setError(err.message);
    }
  }, [tripId, currentStep]);

  const goToStep = useCallback(async (stepNumber) => {
    try {
      setLoading(true);
      setError(null);
      
      const stepData = await pickupOptimizationService.getTripStep(tripId, stepNumber);
      setCurrentStep(stepData);
      pickupOptimizationService.setCurrentStep(stepNumber);
      
    } catch (err) {
      console.error('❌ Error al ir al paso:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const completeTrip = useCallback(() => {
    setTripCompleted(true);
    setCurrentStep(null);
  }, []);

  const resetTrip = useCallback(() => {
    setCurrentStep(null);
    setTripData(null);
    setError(null);
    setTripCompleted(false);
    setStepCompleted(false);
    pickupOptimizationService.clearCurrentTrip();
  }, []);

  // ================================================
  // 🔹 Efectos
  // ================================================

  useEffect(() => {
    if (tripId) {
      initializeTrip();
    }
  }, [tripId, initializeTrip]);

  // ================================================
  // 🔹 Funciones de utilidad
  // ================================================

  const getProgressPercentage = useCallback(() => {
    return pickupOptimizationService.getProgressPercentage();
  }, []);

  const hasMoreSteps = useCallback(() => {
    return pickupOptimizationService.hasMoreSteps();
  }, []);

  const getTripStatus = useCallback(async () => {
    try {
      return await pickupOptimizationService.getTripStatus(tripId);
    } catch (err) {
      console.error('❌ Error al obtener estado del viaje:', err);
      return null;
    }
  }, [tripId]);

  const formatDuration = useCallback((minutes) => {
    return pickupOptimizationService.formatDuration(minutes);
  }, []);

  const formatDistance = useCallback((meters) => {
    return pickupOptimizationService.formatDistance(meters);
  }, []);

  // ================================================
  // 🔹 Retorno del hook
  // ================================================

  return {
    // Estados
    currentStep,
    tripData,
    loading,
    error,
    tripCompleted,
    stepCompleted,
    
    // Funciones principales
    initializeTrip,
    goToNextStep,
    goToStep,
    completeTrip,
    resetTrip,
    
    // Funciones de utilidad
    getProgressPercentage,
    hasMoreSteps,
    getTripStatus,
    formatDuration,
    formatDistance,
    
    // Información del viaje
    tripId,
    tripType,
    totalSteps: tripData?.optimized_route?.total_steps || 0,
    currentStepNumber: currentStep?.current_step || 0,
    isFirstStep: currentStep?.current_step === 0,
    isLastStep: currentStep?.is_last_step || false,
  };
};
