import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { impact, ImpactStyle } from '../utils/haptics';
import { colors, radii, severityColor, spacing } from '../utils/theme';
import type { Severity } from '../utils/mockData';

interface Props {
  title: string;
  description: string;
  daysUntil: number;
  confidence: number;
  estimatedCost: number;
  severity: Severity;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function MaintenanceCard({
  title,
  description,
  confidence,
  estimatedCost,
  severity,
  icon = 'construct-outline',
}: Props) {
  const color = severityColor(severity);

  const handlePress = () => {
    impact(ImpactStyle.Medium);
    Alert.alert('Agendamento', `Serviço "${title}" será agendado em Ford Pinheiros.`, [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={[styles.sideBar, { backgroundColor: color }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons name={icon} size={18} color={color} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.desc}>{description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Confiança</Text>
            <Text style={styles.metaValue}>{confidence}%</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Custo est.</Text>
            <Text style={styles.metaValue}>R$ {estimatedCost.toLocaleString('pt-BR')}</Text>
          </View>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.btn,
              { borderColor: color, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={[styles.btnText, { color }]}>AGENDAR</Text>
            <Ionicons name="arrow-forward" size={12} color={color} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  sideBar: {
    width: 3,
  },
  body: {
    flex: 1,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text1,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  desc: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaCol: {
    flexDirection: 'column',
  },
  metaLabel: {
    color: colors.text2,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.text1,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  btn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
