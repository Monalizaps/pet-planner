import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MoodAnalysis, Pet, MoodEntry, MoodType } from '../types';
import { getMoodEntries, AVAILABLE_SYMPTOMS } from './storage';

interface PDFReportData {
  pet: Pet;
  analysis: MoodAnalysis;
  recentEntries: MoodEntry[];
  symptoms: string[];
}

// Função para traduzir humor
const translateMood = (mood: MoodType, t: (key: string) => string): string => {
  const moodTranslations: Record<MoodType, string> = {
    feliz: t('happy'),
    calmo: t('calm'),
    ansioso: t('anxious'),
    triste: t('sad'),
    irritado: t('irritated'),
    energetico: t('energetic'),
  };
  return moodTranslations[mood] || mood;
};

// Função para obter cor do humor
const getMoodColor = (mood: MoodType): string => {
  const colors: Record<MoodType, string> = {
    feliz: '#FFD93D',
    calmo: '#A8D5BA',
    ansioso: '#FFA500',
    triste: '#B8B8FF',
    irritado: '#FF6B6B',
    energetico: '#95E1D3',
  };
  return colors[mood] || '#E0E0E0';
};

// Função para formatar data
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Função para calcular estatísticas dos últimos 30 dias
const calculatePeriodStats = (entries: MoodEntry[], days: number) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredEntries = entries.filter(entry => new Date(entry.date) >= cutoffDate);
  
  if (filteredEntries.length === 0) {
    return { averageScore: 0, moodCount: {}, totalEntries: 0 };
  }

  const moodCount: Record<string, number> = {};
  let totalScore = 0;

  filteredEntries.forEach(entry => {
    moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
    
    // Calcular score baseado no humor
    const moodScores = {
      feliz: 10,
      energetico: 9,
      calmo: 8,
      ansioso: 5,
      triste: 3,
      irritado: 2,
    };
    totalScore += moodScores[entry.mood] || 5;
    
    // Adicionar/subtrair pelos sintomas
    entry.symptoms?.forEach(symptom => {
      const symptomData = AVAILABLE_SYMPTOMS.find(s => s.id === symptom);
      if (symptomData?.isPositive === true) {
        totalScore += 0.5;
      } else if (symptomData?.isPositive === false) {
        totalScore -= 0.5;
      }
    });
  });

  return {
    averageScore: totalScore / filteredEntries.length,
    moodCount,
    totalEntries: filteredEntries.length,
  };
};

// Função para gerar gráfico de humor em SVG
const generateMoodChart = (moodCount: Record<string, number>, t: (key: string) => string): string => {
  const totalEntries = Object.values(moodCount).reduce((sum, count) => sum + count, 0);
  if (totalEntries === 0) return '';

  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  let currentAngle = 0;
  let paths = '';
  let legends = '';
  let legendY = 20;

  Object.entries(moodCount).forEach(([mood, count]) => {
    const percentage = (count / totalEntries) * 100;
    const angle = (count / totalEntries) * 360;
    const color = getMoodColor(mood as MoodType);
    
    if (count > 0) {
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + angle) * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      paths += `
        <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" 
              fill="${color}" stroke="#fff" stroke-width="2"/>
      `;
      
      legends += `
        <rect x="250" y="${legendY}" width="15" height="15" fill="${color}"/>
        <text x="275" y="${legendY + 12}" font-size="12" font-family="Arial">${translateMood(mood as MoodType, t)}: ${percentage.toFixed(1)}%</text>
      `;
      
      legendY += 25;
      currentAngle += angle;
    }
  });

  return `
    <svg width="400" height="250" viewBox="0 0 400 250">
      ${paths}
      ${legends}
    </svg>
  `;
};

// Template HTML para o PDF
const generateHTMLTemplate = (data: PDFReportData, t: (key: string) => string): string => {
  const { pet, analysis, recentEntries } = data;
  
  // Calcular estatísticas para diferentes períodos
  const stats7Days = calculatePeriodStats(recentEntries, 7);
  const stats30Days = calculatePeriodStats(recentEntries, 30);
  
  // Calcular distribuição de humor dos dados recentes
  const moodDistribution: Record<string, number> = {};
  recentEntries.forEach(entry => {
    moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
  });
  
  // Gerar gráfico
  const chartSVG = generateMoodChart(moodDistribution, t);
  
  // Entradas recentes (últimas 10)
  const recentEntriesHTML = recentEntries.slice(0, 10).map(entry => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(new Date(entry.date).toISOString())}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${getMoodColor(entry.mood)}; margin-right: 8px;"></span>
        ${translateMood(entry.mood, t)}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${entry.symptoms?.length ? entry.symptoms.map(symptomId => {
        const symptom = AVAILABLE_SYMPTOMS.find(s => s.id === symptomId);
        return symptom ? symptom.label : symptomId;
      }).join(', ') : '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; max-width: 200px; word-wrap: break-word;">${entry.notes ? entry.notes : '-'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t('moodReport')} - ${pet.name}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }
        .pet-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: 18px;
          opacity: 0.9;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #e9ecef;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #495057;
        }
        .stat-label {
          font-size: 14px;
          color: #6c757d;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #495057;
          border-bottom: 2px solid #667eea;
          padding-bottom: 5px;
        }
        .chart-container {
          text-align: center;
          margin: 20px 0;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table th {
          background: #667eea;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        .table td {
          padding: 8px 12px;
          border-bottom: 1px solid #eee;
        }
        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .comparison-card {
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .comparison-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #495057;
        }
        .score-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 15px;
          font-weight: bold;
          color: white;
        }
        .score-good { background-color: #28a745; }
        .score-medium { background-color: #ffc107; }
        .score-low { background-color: #dc3545; }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="pet-name">${pet.name}</div>
        <div class="report-title">${t('moodReport')} - ${formatDate(new Date().toISOString())}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats30Days.averageScore.toFixed(1)}</div>
          <div class="stat-label">${t('averageScore')} (30 ${t('days')})</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${recentEntries.length}</div>
          <div class="stat-label">${t('totalEntries')} (90 ${t('days')})</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${recentEntries.filter(e => ['feliz', 'calmo', 'energetico'].includes(e.mood)).length}</div>
          <div class="stat-label">${t('positiveDays')}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('moodDistribution')}</div>
        <div class="chart-container">
          ${chartSVG}
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('periodComparison')}</div>
        <div class="comparison">
          <div class="comparison-card">
            <div class="comparison-title">${t('last7Days')}</div>
            <p><strong>${t('averageScore')}:</strong> 
              <span class="score-badge ${stats7Days.averageScore >= 7 ? 'score-good' : stats7Days.averageScore >= 5 ? 'score-medium' : 'score-low'}">
                ${stats7Days.averageScore.toFixed(1)}
              </span>
            </p>
            <p><strong>${t('totalEntries')}:</strong> ${stats7Days.totalEntries}</p>
          </div>
          <div class="comparison-card">
            <div class="comparison-title">${t('last30Days')}</div>
            <p><strong>${t('averageScore')}:</strong> 
              <span class="score-badge ${stats30Days.averageScore >= 7 ? 'score-good' : stats30Days.averageScore >= 5 ? 'score-medium' : 'score-low'}">
                ${stats30Days.averageScore.toFixed(1)}
              </span>
            </p>
            <p><strong>${t('totalEntries')}:</strong> ${stats30Days.totalEntries}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t('recentEntries')}</div>
        <table class="table">
          <thead>
            <tr>
              <th>${t('date')}</th>
              <th>${t('mood')}</th>
              <th>${t('symptoms')}</th>
              <th>${t('notes')}</th>
            </tr>
          </thead>
          <tbody>
            ${recentEntriesHTML}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">${t('analysis')}</div>
        <div style="background: ${analysis.alertLevel === 'normal' ? '#e8f5e8' : analysis.alertLevel === 'atencao' ? '#fff3cd' : '#f8d7da'}; 
                    padding: 15px; border-radius: 8px; border-left: 4px solid ${analysis.alertLevel === 'normal' ? '#28a745' : analysis.alertLevel === 'atencao' ? '#ffc107' : '#dc3545'};">
          <strong>${t(analysis.alertLevel)}:</strong> ${analysis.message}
        </div>
        ${analysis.commonSymptoms && analysis.commonSymptoms.length > 0 ? `
          <div style="margin-top: 15px;">
            <strong>${t('commonSymptoms')}:</strong>
            <ul>
              ${analysis.commonSymptoms.map(symptom => `<li>${symptom}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        ${t('reportGeneratedBy')} Pet Planner App - ${new Date().toLocaleString('pt-BR')}
      </div>
    </body>
    </html>
  `;
};

export const generateMoodPDF = async (
  pet: Pet,
  analysis: MoodAnalysis,
  t: (key: string) => string
): Promise<void> => {
  try {
    // Buscar entradas de humor dos últimos 90 dias
    const entries = await getMoodEntries(pet.id);
    const recentEntries = entries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return entryDate >= ninetyDaysAgo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Preparar dados para o PDF
    const pdfData: PDFReportData = {
      pet,
      analysis,
      recentEntries,
      symptoms: AVAILABLE_SYMPTOMS.map(s => s.id),
    };

    // Gerar HTML
    const html = generateHTMLTemplate(pdfData, t);

    // Gerar PDF
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
      base64: false,
    });

    // Compartilhar PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${t('moodReport')} - ${pet.name}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error(t('sharingNotAvailable'));
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};