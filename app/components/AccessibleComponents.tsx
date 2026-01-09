// Accessible Components - Store Guidelines Compliance
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOUCH_TARGET, SPACING } from '../constants/accessibility';
import { colors } from '../theme/colors';

// Accessible Button
interface AccessibleButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  variant = 'primary',
  icon,
  iconSize = 20,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...props
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'secondary' && styles.buttonTextSecondary,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...props}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={iconSize} 
          color={variant === 'secondary' ? colors.primary : colors.textWhite}
          style={styles.buttonIcon}
        />
      )}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

// Accessible Icon Button
interface AccessibleIconButtonProps extends TouchableOpacityProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  backgroundColor?: string;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  size = 24,
  color = colors.primary,
  accessibilityLabel,
  accessibilityHint,
  backgroundColor = 'transparent',
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...props}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
};

// Accessible Chip
interface AccessibleChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AccessibleChip: React.FC<AccessibleChipProps> = ({
  label,
  selected = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      {...props}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Accessible Card
interface AccessibleCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { minHeight: TOUCH_TARGET.MIN_SIZE }, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: TOUCH_TARGET.MIN_SIZE,
    minHeight: TOUCH_TARGET.MIN_SIZE,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },

  buttonDanger: {
    backgroundColor: colors.error,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
    textAlign: 'center',
  },

  buttonTextSecondary: {
    color: colors.primary,
  },

  buttonIcon: {
    marginRight: SPACING.SM,
  },

  iconButton: {
    width: TOUCH_TARGET.MIN_SIZE,
    height: TOUCH_TARGET.MIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: TOUCH_TARGET.MIN_SIZE / 2,
  },

  chip: {
    minHeight: 36,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.gray200,
    borderRadius: 18,
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
});