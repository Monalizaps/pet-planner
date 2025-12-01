// Script de teste para verificar a geração de PDF
import { generateMoodPDF } from './app/services/pdfGenerator';

// Dados de exemplo para teste
const mockPet = {
  id: 'test-pet-1',
  tutorId: 'test-tutor',
  name: 'Buddy',
  type: 'dog' as const,
  breed: 'Labrador',
  createdAt: new Date(),
};

const mockAnalysis = {
  currentMonth: {
    feliz: 15,
    calmo: 8,
    ansioso: 3,
    triste: 1,
    irritado: 2,
    energetico: 1,
  },
  previousMonth: {
    feliz: 10,
    calmo: 6,
    ansioso: 5,
    triste: 3,
    irritado: 4,
    energetico: 2,
  },
  alertLevel: 'normal' as const,
  message: 'Seu pet está com um humor muito positivo este mês!',
  commonSymptoms: ['Brincalhão', 'Apetite normal', 'Energético'],
};

// Função de tradução mock
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    moodReport: 'Relatório de Humor',
    current: 'Atual',
    totalDays: 'Total de Dias',
    totalEntries: 'Total de Registros',
    positiveDays: 'Dias Positivos',
    moodDistribution: 'Distribuição de Humor',
    periodComparison: 'Comparação por Período',
    last7Days: 'Últimos 7 Dias',
    last30Days: 'Últimos 30 Dias',
    averageScore: 'Pontuação Média',
    recentEntries: 'Registros Recentes',
    date: 'Data',
    mood: 'Humor',
    symptoms: 'Sintomas',
    analysis: 'Análise',
    normal: 'Normal',
    atencao: 'Atenção',
    alerta: 'Alerta',
    commonSymptoms: 'Sintomas Comuns',
    reportGeneratedBy: 'Relatório gerado por',
    days: 'dias',
    happy: 'Feliz',
    calm: 'Calmo',
    anxious: 'Ansioso',
    sad: 'Triste',
    irritated: 'Irritado',
    energetic: 'Energético',
  };
  return translations[key] || key;
};

export const testPDFGeneration = async () => {
  try {
    console.log('🔄 Testando geração de PDF...');
    await generateMoodPDF(mockPet, mockAnalysis, mockTranslation);
    console.log('✅ PDF gerado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
  }
};