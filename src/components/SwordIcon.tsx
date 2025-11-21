import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

interface SwordIconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export const SwordIcon: React.FC<SwordIconProps> = ({ 
  size = 40, 
  color = '#F97316',
  active = false 
}) => {
  const fillColor = active ? color : 'transparent';
  const strokeColor = color;
  const strokeWidth = active ? 2 : 1;

  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 504.32 504.32"
      style={{ backgroundColor: 'transparent' }}
    >
      <G transform="translate(1 1)">
        <Path
          d="M229.4,331.8l55.467,55.467c-23.04,22.187-45.227,23.04-68.267,0L186.733,357.4l0,0l0,0
            l-42.667-42.667L114.2,284.867c-22.187-22.187-23.04-45.227,0-68.267l54.613,54.613l30.72,30.72L229.4,331.8z"
          fill={active ? color : '#AE938D'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M186.733,357.4l-91.307,91.307L52.76,406.041l0,0l91.307-91.307L186.733,357.4z M108.227,461.507
            c5.12,5.12,5.12,11.093,1.707,13.653l-19.627,19.627c-3.413,3.413-8.533,3.413-11.947,0L5.827,422.254
            c-3.413-3.413-3.413-8.533,0-11.947l19.627-19.627c3.413-3.413,8.533-3.413,11.947,0l15.36,14.507l0,0l42.667,42.667
            L108.227,461.507z"
          fill={active ? color : '#FFD0A1'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <Path
          d="M498.2,3.267L199.533,301.934l0,0l-30.72-30.72l1.707-1.707L344.6,37.4L498.2,3.267z M498.2,3.267
            l-34.133,153.6L230.253,331.8l0,0l-29.867-29.867l0,0L498.2,3.267z"
          fill={active ? color : '#ECF4F7'}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </G>
    </Svg>
  );
};
