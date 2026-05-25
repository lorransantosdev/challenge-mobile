// [SEC-51] IMPORTAÇÕES EXPLÍCITAS — SEM WILDCARD
// Cada função importada individualmente de expo-haptics.
import { Platform } from 'react-native';
import {
  impactAsync,
  selectionAsync,
  ImpactFeedbackStyle,
} from 'expo-haptics';

// [SEC-52] GUARD DE PLATAFORMA — HAPTICS APENAS EM DISPOSITIVOS FÍSICOS
// A chamada é ignorada silenciosamente na web para evitar erros de runtime.
export const impact = (style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium) => {
  if (Platform.OS === 'web') return;
  impactAsync(style).catch(() => {});
};

export const selection = () => {
  if (Platform.OS === 'web') return;
  selectionAsync().catch(() => {});
};

// [SEC-53] REEXPORTAÇÃO NOMEADA — SEM ALIAS DESNECESSÁRIO
export { ImpactFeedbackStyle as ImpactStyle };
