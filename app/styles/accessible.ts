// Accessible Styles - Store Guidelines Compliance
import { StyleSheet, Platform } from 'react-native';
import { TOUCH_TARGET, SPACING, SAFE_AREA } from '../constants/accessibility';
import { colors } from '../theme/colors';

export const accessibleStyles = StyleSheet.create({
  // Touch Targets
  touchTarget: {
    minWidth: TOUCH_TARGET.MIN_SIZE,
    minHeight: TOUCH_TARGET.MIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button Styles
  buttonPrimary: {
    minWidth: TOUCH_TARGET.MIN_SIZE,
    minHeight: TOUCH_TARGET.MIN_SIZE,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonSecondary: {
    minWidth: TOUCH_TARGET.MIN_SIZE,
    minHeight: TOUCH_TARGET.MIN_SIZE,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonDanger: {
    minWidth: TOUCH_TARGET.MIN_SIZE,
    minHeight: TOUCH_TARGET.MIN_SIZE,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Icon Button
  iconButton: {
    width: TOUCH_TARGET.MIN_SIZE,
    height: TOUCH_TARGET.MIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TOUCH_TARGET.MIN_SIZE / 2,
  },

  // Text Styles with High Contrast
  textPrimary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  },

  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textLight,
    lineHeight: 20,
  },

  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },

  textButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
    textAlign: 'center',
  },

  textButtonSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  // Input Styles
  textInput: {
    minHeight: TOUCH_TARGET.MIN_SIZE,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.text,
  },

  textInputFocused: {
    borderColor: colors.primary,
  },

  // Card Styles
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: SPACING.MD,
    marginVertical: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.MIN_SIZE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },

  // Safe Area
  safeContainer: {
    flex: 1,
    paddingTop: SAFE_AREA.VERTICAL,
    paddingBottom: SAFE_AREA.BOTTOM,
    paddingHorizontal: SAFE_AREA.HORIZONTAL,
  },

  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH_TARGET.MIN_SIZE + SPACING.MD,
    paddingHorizontal: SPACING.MD,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textWhite,
    textAlign: 'center',
    flex: 1,
  },

  // Chip/Tag Styles
  chip: {
    minHeight: 32,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    backgroundColor: colors.gray200,
    borderRadius: 16,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipSelected: {
    backgroundColor: colors.primary,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  chipTextSelected: {
    color: colors.textWhite,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: SPACING.LG,
    maxWidth: '90%',
    maxHeight: '80%',
  },

  // Form Group
  formGroup: {
    marginBottom: SPACING.MD,
  },

  // Error States
  inputError: {
    borderColor: colors.error,
  },

  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: SPACING.SM,
  },

  // Loading State
  loading: {
    opacity: 0.6,
  },

  // Disabled State
  disabled: {
    opacity: 0.5,
  },
});

export default accessibleStyles;