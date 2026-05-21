import { Platform } from 'react-native';
import * as H from 'expo-haptics';

export const impact = (style: H.ImpactFeedbackStyle = H.ImpactFeedbackStyle.Medium) => {
  if (Platform.OS === 'web') return;
  H.impactAsync(style).catch(() => {});
};

export const selection = () => {
  if (Platform.OS === 'web') return;
  H.selectionAsync().catch(() => {});
};

export const ImpactStyle = H.ImpactFeedbackStyle;
