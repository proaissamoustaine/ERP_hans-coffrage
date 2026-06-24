// Tokens couleur repris fidèlement de la maquette Hans Coffrage (objet `C`).
export const C = {
  primary: '#1F4E4A',
  primaryDark: '#163834',
  primaryLight: '#2A6B66',
  primarySoft: '#E5EBE9',
  accent: '#C9A961',
  accentLight: '#D9BD7E',
  accentSoft: '#F5EDD8',
  bg: '#FFFFFF',
  bgSoft: '#F5F2ED',
  bgWarm: '#FAF7F2',
  bgCool: '#F8F9F7',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  textLight: '#9A9A9A',
  border: '#E5E1DA',
  borderSoft: '#EFEAE2',
  success: '#2D7D5F',
  successSoft: '#E0F1E8',
  danger: '#C44536',
  dangerSoft: '#FBE2DC',
  warning: '#D4A017',
  warningSoft: '#FEF3D7',
  info: '#4A6B8A',
  infoSoft: '#E3EAF1',
} as const;

export type ColorToken = keyof typeof C;
