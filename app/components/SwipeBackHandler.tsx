import React, { useRef } from 'react';
import { View, Dimensions, PanResponder } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeBackHandlerProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export default function SwipeBackHandler({ children, disabled = false }: SwipeBackHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/(tabs)/';

  // Não aplicar o gesto na página inicial ou se desabilitado
  if (disabled || isHomePage) {
    return <>{children}</>;
  }

  const handleGoBack = () => {
    // Lógica específica baseada na rota atual
    if (pathname.startsWith('/settings/')) {
      router.push('/(tabs)/mais');
    } else if (pathname === '/pets-list') {
      router.push('/(tabs)/');
    } else if (pathname === '/add-pet') {
      router.back();
    } else if (pathname === '/add-task' || pathname.startsWith('/edit-task')) {
      router.push('/(tabs)/jornada');
    } else if (pathname.startsWith('/pet/')) {
      router.back();
    } else if (pathname === '/profile') {
      router.back();
    } else {
      router.back();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Só ativar se começar da borda esquerda e deslizar para a direita
        const isFromLeftEdge = evt.nativeEvent.pageX < 50;
        const isRightSwipe = gestureState.dx > 10 && Math.abs(gestureState.dy) < 50;
        return isFromLeftEdge && isRightSwipe;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        // Gesto iniciado
      },
      onPanResponderMove: (evt, gestureState) => {
        // Durante o movimento do gesto
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Gesto finalizado
        const swipeThreshold = SCREEN_WIDTH * 0.25; // 25% da largura da tela
        const velocityThreshold = 0.5;
        
        if (gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold) {
          handleGoBack();
        }
      },
      onPanResponderTerminate: () => {
        // Gesto cancelado
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}