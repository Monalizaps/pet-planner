// Pet Planner - Paleta de Cores Pastéis Fofas

export const colors = {
  // Primary Colors - Tons Pastéis Suaves
  primary: '#B8A4E8',        // Lavanda suave
  primaryLight: '#D4C5F9',   // Lavanda mais claro
  secondary: '#FFB5C5',      // Rosa bebê
  tertiary: '#A8D5E2',       // Azul céu pastel
  
  // Background - Fundos Degradê
  background: '#FAF7FF',     // Branco lilás muito suave
  surface: '#FFF8FC',        // Rosa muito claro
  card: '#FFFFFF',           // Branco puro
  
  // Accent Colors - Cores de Destaque
  mint: '#B8F3D8',           // Verde menta
  peach: '#FFD4B2',          // Pêssego
  lavender: '#E0D4F7',       // Lavanda
  skyBlue: '#C5E3F6',        // Azul céu
  blush: '#FFD0E0',          // Rosa blush
  lemon: '#FFF4C4',          // Limão suave
  
  // Pet Colors - Cores por tipo de pet
  dog: '#FFE0B5',            // Laranja pastel (cachorro)
  cat: '#E8D4F8',            // Roxo pastel (gato)
  bird: '#B8F0E8',           // Turquesa pastel (pássaro)
  
  // Text
  text: '#5A4E7A',           // Roxo escuro suave
  textLight: '#9B8FB8',      // Roxo médio
  textWhite: '#FFFFFF',      // Branco
  
  // Status
  success: '#B8F3D8',        // Verde menta
  warning: '#FFDFA8',        // Amarelo pastel
  error: '#FFB8C8',          // Rosa pastel
  info: '#C5E3F6',           // Azul pastel
  
  // Grays pastéis
  gray100: '#FAF9FC',
  gray200: '#F3F1F8',
  gray300: '#E8E5F0',
  gray400: '#D4CFE3',
  gray500: '#B8B3C8',
  gray600: '#9B8FB8',
  gray700: '#7E6FA3',
  gray800: '#5A4E7A',
  gray900: '#3D3456',
  
  // Transparent
  overlay: 'rgba(184, 164, 232, 0.2)',      // Lavanda transparente
  overlayMedium: 'rgba(184, 164, 232, 0.4)',
  overlayDark: 'rgba(90, 78, 122, 0.6)',
  
  // Shadows suaves
  shadowLight: 'rgba(184, 164, 232, 0.08)',
  shadowMedium: 'rgba(184, 164, 232, 0.15)',
  shadowDark: 'rgba(90, 78, 122, 0.2)',
};

export const gradients = {
  // Gradientes principais
  primary: ['#E0D4F7', '#FFE0F0'],           // Lavanda → Rosa
  secondary: ['#FFE0F0', '#FFD4B2'],         // Rosa → Pêssego
  tertiary: ['#C5E3F6', '#E0D4F7'],          // Azul → Lavanda
  
  // Gradientes de fundo
  background: ['#FAF7FF', '#FFF8FC'],        // Branco lilás → Rosa claro
  backgroundAlt: ['#FFF8FC', '#FFFEF8'],     // Rosa → Amarelo muito claro
  
  // Gradientes coloridos
  rainbow: ['#E0D4F7', '#FFE0F0', '#FFD4B2', '#B8F3D8', '#C5E3F6'],
  sunset: ['#FFE0F0', '#FFD4B2', '#FFF4C4'],  // Rosa → Pêssego → Limão
  ocean: ['#C5E3F6', '#B8F0E8', '#B8F3D8'],   // Azul → Turquesa → Verde
  lavender: ['#E0D4F7', '#D4C5F9', '#C5E3F6'], // Tons de lavanda
  
  // Gradientes por tipo de pet
  dog: ['#FFE0B5', '#FFD4B2'],               // Laranja pastel
  cat: ['#E8D4F8', '#E0D4F7'],               // Roxo pastel
  bird: ['#B8F0E8', '#C5E3F6'],              // Turquesa → Azul
  
  // Gradientes de card
  card1: ['#FFFFFF', '#FAF7FF'],             // Branco → Lilás
  card2: ['#FFFFFF', '#FFF8FC'],             // Branco → Rosa
  card3: ['#FFFFFF', '#FFFEF8'],             // Branco → Amarelo
};

// URLs de ilustrações de pets fofas (uso público)
export const petIllustrations = {
  // Ilustrações de gatos
  catSleeping: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f63a.svg',
  catHappy: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f638.svg',
  catLove: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f63b.svg',
  
  // Ilustrações de cachorros
  dogFace: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f436.svg',
  dogHappy: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f415.svg',
  
  // Ilustrações de pássaros
  bird: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f426.svg',
  
  // Patas e elementos decorativos
  pawPrints: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f43e.svg',
  
  // Emojis decorativos
  heart: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f49c.svg', // Coração roxo
  star: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2b50.svg',
  sparkles: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2728.svg',
};

export default colors;
