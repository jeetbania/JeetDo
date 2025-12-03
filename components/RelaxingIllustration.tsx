import React from 'react';

const RelaxingIllustration: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 500 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Sun */}
      <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="3" />
      
      {/* Ocean Horizon */}
      <path d="M0 250 H500" stroke="currentColor" strokeWidth="3" />
      <path d="M20 280 Q100 300 180 280 T340 280" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
      
      {/* Palm Tree */}
      {/* Trunk */}
      <path d="M350 250 Q360 150 420 80" stroke="currentColor" strokeWidth="4" />
      <path d="M350 250 Q380 150 420 80" stroke="currentColor" strokeWidth="4" />
      {/* Leaves */}
      <path d="M420 80 Q350 60 300 100" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M420 80 Q480 20 490 90" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M420 80 Q400 20 340 40" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M420 80 Q460 120 400 140" stroke="currentColor" strokeWidth="3" fill="none" />

      {/* Deck Chair */}
      <path d="M200 320 L350 180" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M250 320 L350 240" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M230 320 L210 340" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M360 250 L380 340" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

      {/* Person */}
      {/* Head */}
      <circle cx="330" cy="170" r="15" stroke="currentColor" strokeWidth="3" fill="white" fillOpacity="0.5" />
      {/* Body / Legs */}
      <path d="M330 185 L300 230 L220 230" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M220 230 L200 260" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* Arm */}
      <path d="M320 200 L290 220 L270 200" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Laptop */}
      <path d="M260 200 L280 180 L300 200" stroke="currentColor" strokeWidth="3" fill="white" fillOpacity="0.8" />
      
      {/* Bird 1 */}
      <path d="M150 100 Q160 90 170 100" stroke="currentColor" strokeWidth="2" />
      <path d="M170 100 Q180 90 190 100" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};

export default RelaxingIllustration;