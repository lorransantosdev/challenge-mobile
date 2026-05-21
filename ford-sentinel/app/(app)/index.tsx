import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { impact, selection, ImpactStyle } from '../../utils/haptics';
import VehicleSVG, { Highlight } from '../../components/VehicleSVG';
import HealthGauge from '../../components/HealthGauge';
import MaintenanceCard from '../../components/MaintenanceCard';
import { colors, radii, spacing } from '../../utils/theme';
import {
  MOCK_USER,
  MOCK_VEHICLE,
  MOCK_PARTS,
  MOCK_MAINTENANCES,
  MOCK_DEALER,
  QUICK_STATS,
} from '../../utils/mockData';
import { logout } from '../../services/auth';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

export default function HomeScreen() {
  const router = useRouter();

  const highlights: Highlight[] = MOCK_PARTS.map((p) => ({
    x: p.position.x,
    y: p.position.y,
    color:
      p.status === 'critical'
        ? colors.red
        : p.status === 'warning'
        ? colors.yellow
        : colors.green,
    pulse: p.status === 'critical',
  }));

  const sortedMaintenances = [...MOCK_MAINTENANCES].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  async function handleLogout() {
    impact(ImpactStyle.Light);
    await logout();
    router.replace('/login');
  }

  function handleMap() {
    selection();
    const { lat, lng } = MOCK_DEALER.coords;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Mapa', MOCK_DEALER.address));
  }

  function handleSchedule() {
    impact(ImpactStyle.Medium);
    Alert.alert('Agendamento', `Horário solicitado em ${MOCK_DEALER.name}.`);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>
              Olá, <Text style={{ color: colors.cyan }}>{MOCK_USER.name.split(' ')[0]}</Text>. Seu Ranger está bem.
            </Text>
            <Text style={styles.subHeader}>
              {MOCK_VEHICLE.model} {MOCK_VEHICLE.year} · {MOCK_VEHICLE.km.toLocaleString('pt-BR')} km
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable hitSlop={10} style={styles.bell}>
              <Ionicons name="notifications-outline" size={22} color={colors.text1} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>
            <Pressable hitSlop={10} onPress={handleLogout} style={styles.bell}>
              <Ionicons name="log-out-outline" size={22} color={colors.text2} />
            </Pressable>
          </View>
        </View>

        {/* Vehicle blueprint + gauge */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Ionicons name="scan-outline" size={14} color={colors.cyan} />
            <Text style={styles.vehicleHeaderText}>DIAGNÓSTICO EM TEMPO REAL</Text>
            <View style={styles.live}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.svgWrap}>
            <VehicleSVG width={340} height={170} highlights={highlights} />
          </View>
          <View style={styles.gaugeWrap}>
            <HealthGauge value={MOCK_VEHICLE.healthScore} size={150} />
          </View>
          <View style={styles.legend}>
            <LegendDot color={colors.red} text="Crítico" />
            <LegendDot color={colors.yellow} text="Atenção" />
            <LegendDot color={colors.green} text="Saudável" />
          </View>
        </View>

        {/* Maintenances */}
        <SectionTitle title="PRÓXIMAS MANUTENÇÕES" />
        {sortedMaintenances.map((m) => (
          <MaintenanceCard
            key={m.id}
            title={m.title}
            description={m.description}
            daysUntil={m.daysUntil}
            confidence={m.confidence}
            estimatedCost={m.estimatedCost}
            severity={m.severity}
            icon={m.icon as never}
          />
        ))}

        {/* Quick stats */}
        <SectionTitle title="RESUMO" />
        <View style={styles.statsRow}>
          <StatCard icon="calendar-outline" label="Última revisão" value={QUICK_STATS.lastService} />
          <StatCard icon="time-outline" label="Próxima" value={QUICK_STATS.nextService} />
          <StatCard
            icon="wallet-outline"
            label="Gasto total"
            value={`R$ ${QUICK_STATS.totalSpent.toLocaleString('pt-BR')}`}
          />
        </View>

        {/* Dealer */}
        <SectionTitle title="CONCESSIONÁRIA" />
        <View style={styles.dealerCard}>
          <View style={styles.dealerIcon}>
            <Ionicons name="storefront-outline" size={22} color={colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dealerName}>{MOCK_DEALER.name}</Text>
            <Text style={styles.dealerMeta}>
              {MOCK_DEALER.distanceKm} km · ★ {MOCK_DEALER.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.dealerActions}>
            <Pressable onPress={handleMap} style={styles.dealerBtn}>
              <Ionicons name="map-outline" size={14} color={colors.text1} />
              <Text style={styles.dealerBtnText}>Mapa</Text>
            </Pressable>
            <Pressable onPress={handleSchedule} style={[styles.dealerBtn, styles.dealerBtnPrimary]}>
              <Ionicons name="calendar-outline" size={14} color={colors.cyan} />
              <Text style={[styles.dealerBtnText, { color: colors.cyan }]}>Agendar</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>Ford Sentinel v1.0 · FIAP × Ford Challenge 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function LegendDot({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{text}</Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={colors.cyan} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  hello: {
    color: colors.text1,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  subHeader: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  vehicleCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  vehicleHeaderText: {
    flex: 1,
    color: colors.text2,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00E67615',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  liveText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  svgWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  gaugeWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.text2,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sectionTitleWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionLine: {
    height: 1,
    width: 32,
    backgroundColor: colors.cyan,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  statLabel: {
    color: colors.text2,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text1,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dealerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dealerIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.cyanGlow,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerName: {
    color: colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  dealerMeta: {
    color: colors.text2,
    fontSize: 12,
    marginTop: 2,
  },
  dealerActions: {
    flexDirection: 'column',
    gap: 6,
  },
  dealerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dealerBtnPrimary: {
    borderColor: colors.cyan,
  },
  dealerBtnText: {
    color: colors.text1,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    color: colors.text2,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xl,
    letterSpacing: 0.5,
  },
});
