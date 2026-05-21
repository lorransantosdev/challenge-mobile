export const colors = {
  bg: '#080C18',
  card: '#0F1628',
  glass: 'rgba(15,22,40,0.75)',
  cyan: '#00E5FF',
  cyanGlow: '#00E5FF15',
  ford: '#003478',
  green: '#00E676',
  yellow: '#FFAB00',
  red: '#FF1744',
  text1: '#E8EDF5',
  text2: '#7B8CA8',
  border: '#1A2744',
  borderSubtle: '#1A274440',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  bold: 'System',
  regular: 'System',
  mono: 'Courier',
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const severityColor = (s: 'critical' | 'warning' | 'info' | 'ok') => {
  switch (s) {
    case 'critical':
      return colors.red;
    case 'warning':
      return colors.yellow;
    case 'info':
      return colors.cyan;
    case 'ok':
      return colors.green;
  }
};
