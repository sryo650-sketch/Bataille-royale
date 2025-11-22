import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ShieldIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export const ShieldIcon: React.FC<ShieldIconProps> = ({ 
  size = 40, 
  color = '#3B82F6',
  active = false 
}) => {
  // Toujours utiliser la couleur principale, ne pas changer selon active
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 36 36"
      style={{ backgroundColor: 'transparent' }}
    >
      <Path 
        fill={color} 
        d="M33 3c-7-3-15-3-15-3S10 0 3 3C0 18 3 31 18 36c15-5 18-18 15-33z"
      />
      <Path 
        fill={color} 
        d="M18 33.884C6.412 29.729 1.961 19.831 4.76 4.444C11.063 2.029 17.928 2 18 2c.071 0 6.958.04 13.24 2.444c2.799 15.387-1.652 25.285-13.24 29.44z"
        opacity={0.8}
      />
      <Path 
        fill={color} 
        d="M31.24 4.444C24.958 2.04 18.071 2 18 2v31.884c11.588-4.155 16.039-14.053 13.24-29.44z"
        opacity={0.6}
      />
    </Svg>
  );
};
