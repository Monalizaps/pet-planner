// Accessibility Constants - Store Guidelines Compliance
import { Platform } from 'react-native';

// Minimum Touch Targets
// Apple HIG: 44pt x 44pt minimum
// Android Material: 48dp x 48dp minimum
export const TOUCH_TARGET = {
  MIN_SIZE: Platform.OS === 'ios' ? 44 : 48,
  RECOMMENDED_SIZE: Platform.OS === 'ios' ? 44 : 48,
  SMALL_BUTTON: Platform.OS === 'ios' ? 32 : 36, // Para casos específicos com justificativa
} as const;

// Typography Scale - Dynamic Type Support
export const FONT_SCALE = {
  SMALL: 14,
  MEDIUM: 16,
  LARGE: 18,
  X_LARGE: 20,
  XX_LARGE: 24,
  XXX_LARGE: 28,
} as const;

// Color Contrast Ratios (WCAG AA)
export const CONTRAST_RATIO = {
  NORMAL_TEXT: 4.5,      // 4.5:1 for normal text
  LARGE_TEXT: 3.0,       // 3:1 for large text (18pt+ or 14pt+ bold)
  NON_TEXT: 3.0,         // 3:1 for UI components
} as const;

// Safe Area Padding
export const SAFE_AREA = {
  HORIZONTAL: 16,
  VERTICAL: Platform.OS === 'ios' ? 44 : 24,
  BOTTOM: Platform.OS === 'ios' ? 34 : 24,
} as const;

// Spacing Scale
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 40,
} as const;

// Accessibility Roles
export const A11Y_ROLE = {
  BUTTON: 'button',
  IMAGE: 'image',
  TEXT: 'text',
  LINK: 'link',
  HEADER: 'header',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  TAB: 'tab',
  TABLIST: 'tablist',
  SWITCH: 'switch',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SEARCH: 'search',
} as const;

// Animation Durations (Accessible)
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;