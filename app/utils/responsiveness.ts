// Responsiveness Utils - Multi-Device Support
import { Dimensions, Platform, PixelRatio } from 'react-native';

// Device Categories
export enum DeviceSize {
  PHONE_SMALL = 'phone-small',    // < 375w
  PHONE_MEDIUM = 'phone-medium',  // 375-414w
  PHONE_LARGE = 'phone-large',    // 414-480w
  TABLET_SMALL = 'tablet-small',  // 480-768w
  TABLET_LARGE = 'tablet-large',  // > 768w
}

export enum DeviceOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

// Get current device dimensions
export const getDeviceDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Get device category
export const getDeviceSize = (): DeviceSize => {
  const { width } = getDeviceDimensions();
  
  if (width < 375) return DeviceSize.PHONE_SMALL;
  if (width < 414) return DeviceSize.PHONE_MEDIUM;
  if (width < 480) return DeviceSize.PHONE_LARGE;
  if (width < 768) return DeviceSize.TABLET_SMALL;
  return DeviceSize.TABLET_LARGE;
};

// Get device orientation
export const getOrientation = (): DeviceOrientation => {
  const { width, height } = getDeviceDimensions();
  return width > height ? DeviceOrientation.LANDSCAPE : DeviceOrientation.PORTRAIT;
};

// Check if device is tablet
export const isTablet = (): boolean => {
  const deviceSize = getDeviceSize();
  return deviceSize === DeviceSize.TABLET_SMALL || deviceSize === DeviceSize.TABLET_LARGE;
};

// Check if device is phone
export const isPhone = (): boolean => {
  return !isTablet();
};

// Get responsive value based on device size
export const getResponsiveValue = <T>(values: {
  phoneSmall?: T;
  phoneMedium?: T;
  phoneLarge?: T;
  tabletSmall?: T;
  tabletLarge?: T;
  default: T;
}): T => {
  const deviceSize = getDeviceSize();
  
  switch (deviceSize) {
    case DeviceSize.PHONE_SMALL:
      return values.phoneSmall ?? values.default;
    case DeviceSize.PHONE_MEDIUM:
      return values.phoneMedium ?? values.default;
    case DeviceSize.PHONE_LARGE:
      return values.phoneLarge ?? values.default;
    case DeviceSize.TABLET_SMALL:
      return values.tabletSmall ?? values.default;
    case DeviceSize.TABLET_LARGE:
      return values.tabletLarge ?? values.default;
    default:
      return values.default;
  }
};

// Breakpoints
export const BREAKPOINTS = {
  PHONE_SMALL: 375,
  PHONE_MEDIUM: 414,
  PHONE_LARGE: 480,
  TABLET_SMALL: 768,
  TABLET_LARGE: 1024,
} as const;

// Responsive spacing
export const getResponsiveSpacing = (base: number): number => {
  return getResponsiveValue({
    phoneSmall: base * 0.8,
    phoneMedium: base,
    phoneLarge: base * 1.1,
    tabletSmall: base * 1.2,
    tabletLarge: base * 1.4,
    default: base,
  });
};

// Responsive font size
export const getResponsiveFontSize = (base: number): number => {
  const pixelRatio = PixelRatio.get();
  const deviceSize = getDeviceSize();
  
  let scaleFactor = 1;
  
  switch (deviceSize) {
    case DeviceSize.PHONE_SMALL:
      scaleFactor = 0.9;
      break;
    case DeviceSize.PHONE_MEDIUM:
      scaleFactor = 1;
      break;
    case DeviceSize.PHONE_LARGE:
      scaleFactor = 1.05;
      break;
    case DeviceSize.TABLET_SMALL:
      scaleFactor = 1.1;
      break;
    case DeviceSize.TABLET_LARGE:
      scaleFactor = 1.2;
      break;
  }
  
  // Adjust for pixel ratio
  if (pixelRatio > 3) scaleFactor *= 0.95;
  else if (pixelRatio < 2) scaleFactor *= 1.05;
  
  return Math.round(base * scaleFactor);
};

// Grid system
export const getGridColumns = (): number => {
  return getResponsiveValue({
    phoneSmall: 1,
    phoneMedium: 1,
    phoneLarge: 2,
    tabletSmall: 2,
    tabletLarge: 3,
    default: 1,
  });
};

// Container padding
export const getContainerPadding = (): number => {
  return getResponsiveValue({
    phoneSmall: 12,
    phoneMedium: 16,
    phoneLarge: 20,
    tabletSmall: 24,
    tabletLarge: 32,
    default: 16,
  });
};

// Chart size calculation
export const getChartSize = (): number => {
  const { width } = getDeviceDimensions();
  const padding = getContainerPadding() * 2;
  const availableWidth = width - padding;
  
  return getResponsiveValue({
    phoneSmall: Math.min(availableWidth * 0.8, 160),
    phoneMedium: Math.min(availableWidth * 0.7, 180),
    phoneLarge: Math.min(availableWidth * 0.6, 220),
    tabletSmall: Math.min(availableWidth * 0.5, 280),
    tabletLarge: Math.min(availableWidth * 0.4, 320),
    default: Math.min(availableWidth * 0.6, 220),
  });
};

// Store Guidelines Support
export const getMinTouchTarget = (): number => {
  // Apple: 44pt, Android: 48dp
  return Platform.OS === 'ios' ? 44 : 48;
};

// Support matrix checker
export const getSupportedDevices = () => {
  return {
    ios: {
      minimumVersion: '12.0',
      supportedDevices: [
        'iPhone 6s and later',
        'iPhone SE (1st gen) and later', 
        'iPad (5th gen) and later',
        'iPad Air 2 and later',
        'iPad mini 4 and later',
        'iPad Pro (all models)',
      ],
      screenSizes: [
        '375x667 (iPhone 6s/7/8/SE 2nd/3rd gen)',
        '414x736 (iPhone 6s+/7+/8+)',
        '375x812 (iPhone X/XS/11 Pro)',
        '414x896 (iPhone XR/11/12/13/14)',
        '393x852 (iPhone 14 Pro)',
        '430x932 (iPhone 14 Pro Max)',
        '768x1024 (iPad)',
        '834x1194 (iPad Pro 11")',
        '1024x1366 (iPad Pro 12.9")',
      ],
    },
    android: {
      minimumAPI: 21, // Android 5.0 Lollipop
      targetAPI: 34,  // Android 14
      supportedScreens: [
        'Small (426dp x 320dp)',
        'Normal (470dp x 320dp)',  
        'Large (640dp x 480dp)',
        'XLarge (960dp x 720dp)',
      ],
      densities: ['ldpi', 'mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'],
    },
  };
};