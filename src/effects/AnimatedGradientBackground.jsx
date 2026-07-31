// effects/AnimatedGradientBackground.jsx
import React from 'react';

const AnimatedGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <div 
        className="w-full h-full animate-cyclic-flow"
        style={{
          background: 'linear-gradient(135deg, #FE975B, #CB83D0, #788DEC, #FE975B)',
          backgroundSize: '400% 400%', 
        }}
      />
      <style>{`
        @keyframes cyclic-flow {
          0% {
            background-position: 0% 100%; 
          }
          25% {
            background-position: 100% 50%; 
          }
          50% {
            background-position: 100% 0%; 
          }
          75% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 0% 100%;
          }
        }
        .animate-cyclic-flow {
          animation: cyclic-flow 24s linear infinite; 
        }
      `}</style>
    </div>
  );
};

export default AnimatedGradientBackground;