import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DebugPetsScreen = () => {
  const [debugInfo, setDebugInfo] = useState<string>('Carregando...');

  useEffect(() => {
    debugStorage();
  }, []);

  const debugStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let info = `🔍 Chaves encontradas no AsyncStorage:\n`;
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (key.includes('pet') || key === 'pets') {
            info += `\n📋 ${key}:\n${value ? JSON.stringify(JSON.parse(value), null, 2) : 'null'}\n`;
          } else {
            info += `\n📝 ${key}: ${value ? 'Dados presentes' : 'null'}\n`;
          }
        } catch (e) {
          info += `\n❌ Erro ao ler ${key}: ${e}\n`;
        }
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`❌ Erro ao acessar AsyncStorage: ${error}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <ScrollView>
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {debugInfo}
        </Text>
      </ScrollView>
    </View>
  );
};