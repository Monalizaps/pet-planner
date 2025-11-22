import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type PetType = 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'hamster' | 'turtle' | 'other';
type MoodType = 'feliz' | 'calmo' | 'ansioso' | 'triste' | 'irritado' | 'energetico';

interface PetIconProps {
  type: PetType | string;
  size?: number;
  color?: string;
}

interface MoodIconProps {
  mood: MoodType;
  size?: number;
  color?: string;
}

export const PetIcon: React.FC<PetIconProps> = ({ type, size = 24, color = '#6C63FF' }) => {
  const iconMap: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
    dog: 'dog',
    cat: 'cat',
    bird: 'bird',
    fish: 'fish',
    rabbit: 'rabbit',
    hamster: 'rodent',
    turtle: 'turtle',
    other: 'paw',
  };

  const iconName = iconMap[type] || 'paw';
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

export const MoodIcon: React.FC<MoodIconProps> = ({ mood, size = 24, color }) => {
  const iconMap: { [key in MoodType]: { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string } } = {
    feliz: { icon: 'emoticon-happy', color: '#FFD93D' },
    calmo: { icon: 'emoticon-cool', color: '#A8D5BA' },
    ansioso: { icon: 'emoticon-confused', color: '#FFA500' },
    triste: { icon: 'emoticon-sad', color: '#B8B8FF' },
    irritado: { icon: 'emoticon-angry', color: '#FF6B6B' },
    energetico: { icon: 'lightning-bolt', color: '#95E1D3' },
  };

  const moodData = iconMap[mood];
  return <MaterialCommunityIcons name={moodData.icon} size={size} color={color || moodData.color} />;
};

// Ícones decorativos
export const TaskIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#6C63FF' }) => (
  <MaterialCommunityIcons name="clipboard-check" size={size} color={color} />
);

export const CalendarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#6C63FF' }) => (
  <MaterialCommunityIcons name="calendar-heart" size={size} color={color} />
);

export const HeartIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#FF6B9D' }) => (
  <MaterialCommunityIcons name="heart" size={size} color={color} />
);

export const PawIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#6C63FF' }) => (
  <MaterialCommunityIcons name="paw" size={size} color={color} />
);

export const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#6C63FF' }) => (
  <MaterialCommunityIcons name="bell" size={size} color={color} />
);

export const MoodTrackerIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#B8A4E8' }) => (
  <MaterialCommunityIcons name="emoticon-happy-outline" size={size} color={color} />
);
