import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

// Hook personalizado para gerenciar navegação com histórico inteligente
export function useSmartNavigation() {
  const router = useRouter();
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

  // Função para navegar salvando o histórico
  const navigateTo = (route: string) => {
    setNavigationStack(prev => [...prev, route]);
    router.push(route as any);
  };

  // Função para voltar de forma inteligente
  const goBack = (fallbackRoute?: string) => {
    if (navigationStack.length > 0) {
      // Remove a rota atual do stack
      const newStack = [...navigationStack];
      newStack.pop();
      setNavigationStack(newStack);
      
      // Se ainda há rotas no stack, volta para a anterior
      if (newStack.length > 0) {
        const previousRoute = newStack[newStack.length - 1];
        router.push(previousRoute as any);
      } else if (fallbackRoute) {
        // Se não há histórico, usa a rota de fallback
        router.push(fallbackRoute as any);
      } else {
        // Como último recurso, usa router.back()
        router.back();
      }
    } else if (fallbackRoute) {
      // Se não há histórico e há fallback, usa o fallback
      router.push(fallbackRoute as any);
    } else {
      // Como último recurso, usa router.back()
      router.back();
    }
  };

  return {
    navigateTo,
    goBack,
    navigationStack,
  };
}

// Hook mais simples que detecta a aba atual e volta para ela
export function useTabAwareNavigation() {
  const router = useRouter();

  const goBackToTab = (currentTab: 'index' | 'jornada' | 'ranking' | 'mais') => {
    const tabRoutes = {
      index: '/(tabs)/',
      jornada: '/(tabs)/jornada',
      ranking: '/(tabs)/ranking',
      mais: '/(tabs)/mais',
    };

    router.push(tabRoutes[currentTab] as any);
  };

  return { goBackToTab };
}