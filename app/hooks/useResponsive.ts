// Responsive Hook - Real-time device adaptation
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { 
  getDeviceSize, 
  getOrientation, 
  isTablet, 
  isPhone,
  getResponsiveValue,
  getResponsiveSpacing,
  getResponsiveFontSize,
  getContainerPadding,
  DeviceSize,
  DeviceOrientation
} from '../utils/responsiveness';

export interface ResponsiveData {
  width: number;
  height: number;
  deviceSize: DeviceSize;
  orientation: DeviceOrientation;
  isTablet: boolean;
  isPhone: boolean;
  containerPadding: number;
  getValue: <T>(values: {
    phoneSmall?: T;
    phoneMedium?: T;
    phoneLarge?: T;
    tabletSmall?: T;
    tabletLarge?: T;
    default: T;
  }) => T;
  getSpacing: (base: number) => number;
  getFontSize: (base: number) => number;
}

export const useResponsive = (): ResponsiveData => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const deviceSize = getDeviceSize();
  const orientation = getOrientation();
  const tablet = isTablet();
  const phone = isPhone();
  const containerPadding = getContainerPadding();
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    deviceSize,
    orientation,
    isTablet: tablet,
    isPhone: phone,
    containerPadding,
    getValue: getResponsiveValue,
    getSpacing: getResponsiveSpacing,
    getFontSize: getResponsiveFontSize,
  };
};