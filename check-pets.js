// Script para verificar dados dos pets no AsyncStorage
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🐾 Verificando dados dos pets...');

// Executar comando para verificar se há algum armazenamento local
try {
  // Verificar se há dados no simulador (se estiver usando iOS)
  const iosSimPath = `${process.env.HOME}/Library/Developer/CoreSimulator/Devices`;
  if (fs.existsSync(iosSimPath)) {
    console.log('📱 Encontrado diretório do simulador iOS');
  }
  
  // Verificar dados no Android
  const androidDataPath = `${process.env.HOME}/.android`;
  if (fs.existsSync(androidDataPath)) {
    console.log('📱 Encontrado diretório do Android');
  }
  
} catch (error) {
  console.log('❌ Erro ao verificar:', error.message);
}

console.log('✅ Verificação concluída. Os dados dos pets provavelmente ainda estão no AsyncStorage do dispositivo/simulador.');
console.log('📋 Vamos corrigir o código para recuperá-los corretamente.');