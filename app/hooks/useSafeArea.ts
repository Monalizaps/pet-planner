// Safe Area Hook - Cross-platform compatibility
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar, Dimensions } from 'react-native';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Custom hook that provides safe area insets with fallbacks
export const useSafeArea = (): SafeAreaInsets => {
  const insets = useSafeAreaInsets();
  
  // Fallback values for devices without safe area support
  const fallbackTop = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
  const fallbackBottom = Platform.OS === 'ios' ? 34 : 0;
  
  return {
    top: insets.top || fallbackTop,
    bottom: insets.bottom || fallbackBottom,
    left: insets.left || 0,
    right: insets.right || 0,
  };
};

// Get safe area padding for containers
export const getSafeAreaPadding = (): {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
} => {
  const insets = useSafeArea();
  
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};

// Get screen dimensions accounting for safe area
export const getUsableScreenDimensions = () => {
  const insets = useSafeArea();
  const { width, height } = Dimensions.get('window');
  
  return {
    width: width - insets.left - insets.right,
    height: height - insets.top - insets.bottom,
  };
};

// Check if device has a notch or safe area
export const hasNotch = (): boolean => {
  const insets = useSafeArea();
  return insets.top > 24 || insets.bottom > 0;
};

// Get minimum header height including safe area
export const getHeaderHeight = (): number => {
  const insets = useSafeArea();
  const baseHeight = 56; // Standard header height
  
  return baseHeight + insets.top;
};