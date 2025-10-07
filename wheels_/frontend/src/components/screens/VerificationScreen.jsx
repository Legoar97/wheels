import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationScreen = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
        padding: '24px',
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-lg flex flex-col items-center px-6 py-10"
        style={{
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex items-center justify-center mb-6"
          style={{
            background: '#e0fbe6',
            borderRadius: '50%',
            width: 64,
            height: 64,
          }}
        >
          <svg width="36" height="36" fill="#22c55e" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm-1 15l-5-5 1.414-1.414L11 13.172l5.586-5.586L18 9l-7 8z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-4 text-center">
          ¡Verifica tu cuenta!
        </h2>
        <p className="text-gray-700 text-center mb-8">
          Te hemos enviado un enlace de verificación a tu correo electrónico.<br />
          Haz clic en el enlace para activar tu cuenta e inicia sesión nuevamente.
        </p>
        <button
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
          style={{
            fontSize: 16,
            marginBottom: 8,
          }}
          onClick={() => navigate('/login')}
        >
          Ir a inicio de sesión
        </button>
      </div>
    </div>
  );
};

export default VerificationScreen;