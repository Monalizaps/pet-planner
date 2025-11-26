import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollEnabled?: boolean;
  contentContainerStyle?: ViewStyle;
}

export function ResponsiveContainer({
  children,
  style,
  scrollEnabled = true,
  contentContainerStyle,
}: ResponsiveContainerProps) {
  const { height } = useWindowDimensions();
  
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={scrollEnabled}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
});
