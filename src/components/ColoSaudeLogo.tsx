import React from 'react';

interface ColoSaudeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ColoSaudeLogo: React.FC<ColoSaudeLogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      <img
        src="https://www.colosaude.com.br/doutor/uploads/0/logo/2025/06/emp-colo-certo-aa1f1.png"
        alt="ColoSaude Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default ColoSaudeLogo;