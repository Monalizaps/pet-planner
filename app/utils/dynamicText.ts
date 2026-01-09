// Dynamic Text Support - iOS Dynamic Type / Android Font Scale
import { PixelRatio, Platform } from 'react-native';

// Get the current font scale from the system
export const getFontScale = () => {
  return PixelRatio.getFontScale();
};

// Calculate responsive font size based on system settings
export const getScaledFontSize = (baseFontSize: number): number => {
  const scale = getFontScale();
  
  // Limit the scaling to prevent text from becoming too large or small
  const maxScale = Platform.OS === 'ios' ? 1.5 : 1.3;
  const minScale = 0.85;
  
  const limitedScale = Math.max(minScale, Math.min(maxScale, scale));
  
  return Math.round(baseFontSize * limitedScale);
};

// Font sizes that scale with system settings
export const DYNAMIC_FONT_SIZES = {
  // Extra Small
  XS: getScaledFontSize(12),
  
  // Small
  SM: getScaledFontSize(14),
  
  // Base/Medium
  BASE: getScaledFontSize(16),
  
  // Large
  LG: getScaledFontSize(18),
  
  // Extra Large
  XL: getScaledFontSize(20),
  
  // 2X Large
  XXL: getScaledFontSize(24),
  
  // 3X Large
  XXXL: getScaledFontSize(28),
  
  // Huge
  HUGE: getScaledFontSize(32),
} as const;

// Line heights that scale proportionally
export const DYNAMIC_LINE_HEIGHTS = {
  XS: Math.round(DYNAMIC_FONT_SIZES.XS * 1.4),
  SM: Math.round(DYNAMIC_FONT_SIZES.SM * 1.4),
  BASE: Math.round(DYNAMIC_FONT_SIZES.BASE * 1.5),
  LG: Math.round(DYNAMIC_FONT_SIZES.LG * 1.4),
  XL: Math.round(DYNAMIC_FONT_SIZES.XL * 1.4),
  XXL: Math.round(DYNAMIC_FONT_SIZES.XXL * 1.3),
  XXXL: Math.round(DYNAMIC_FONT_SIZES.XXXL * 1.3),
  HUGE: Math.round(DYNAMIC_FONT_SIZES.HUGE * 1.3),
} as const;

// Check if large text accessibility is enabled
export const isLargeTextEnabled = (): boolean => {
  const scale = getFontScale();
  return scale > 1.15;
};

// Dynamic spacing that adapts to text size
export const getDynamicSpacing = (baseSpacing: number): number => {
  const scale = getFontScale();
  return Math.round(baseSpacing * Math.min(scale, 1.3));
};

// Typography styles with dynamic scaling
export const dynamicTypography = {
  caption: {
    fontSize: DYNAMIC_FONT_SIZES.XS,
    lineHeight: DYNAMIC_LINE_HEIGHTS.XS,
    fontWeight: '400' as const,
  },
  
  body2: {
    fontSize: DYNAMIC_FONT_SIZES.SM,
    lineHeight: DYNAMIC_LINE_HEIGHTS.SM,
    fontWeight: '400' as const,
  },
  
  body1: {
    fontSize: DYNAMIC_FONT_SIZES.BASE,
    lineHeight: DYNAMIC_LINE_HEIGHTS.BASE,
    fontWeight: '400' as const,
  },
  
  subtitle2: {
    fontSize: DYNAMIC_FONT_SIZES.SM,
    lineHeight: DYNAMIC_LINE_HEIGHTS.SM,
    fontWeight: '600' as const,
  },
  
  subtitle1: {
    fontSize: DYNAMIC_FONT_SIZES.BASE,
    lineHeight: DYNAMIC_LINE_HEIGHTS.BASE,
    fontWeight: '600' as const,
  },
  
  h6: {
    fontSize: DYNAMIC_FONT_SIZES.LG,
    lineHeight: DYNAMIC_LINE_HEIGHTS.LG,
    fontWeight: '600' as const,
  },
  
  h5: {
    fontSize: DYNAMIC_FONT_SIZES.XL,
    lineHeight: DYNAMIC_LINE_HEIGHTS.XL,
    fontWeight: '600' as const,
  },
  
  h4: {
    fontSize: DYNAMIC_FONT_SIZES.XXL,
    lineHeight: DYNAMIC_LINE_HEIGHTS.XXL,
    fontWeight: '700' as const,
  },
  
  h3: {
    fontSize: DYNAMIC_FONT_SIZES.XXXL,
    lineHeight: DYNAMIC_LINE_HEIGHTS.XXXL,
    fontWeight: '700' as const,
  },
  
  h2: {
    fontSize: DYNAMIC_FONT_SIZES.HUGE,
    lineHeight: DYNAMIC_LINE_HEIGHTS.HUGE,
    fontWeight: '700' as const,
  },
  
  button: {
    fontSize: DYNAMIC_FONT_SIZES.BASE,
    lineHeight: DYNAMIC_LINE_HEIGHTS.BASE,
    fontWeight: '600' as const,
  },
} as const;