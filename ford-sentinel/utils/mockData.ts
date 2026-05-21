export type Role = 'customer' | 'analyst' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tier: 'Silver' | 'Gold' | 'Platinum';
  xp: number;
}

export interface Vehicle {
  id: string;
  model: string;
  year: number;
  vin: string;
  km: number;
  healthScore: number;
  ownerId: string;
}

export interface Part {
  id: string;
  name: string;
  health: number;
  position: { x: number; y: number };
  status: 'ok' | 'warning' | 'critical';
}

export type Severity = 'critical' | 'warning' | 'info';

export interface Maintenance {
  id: string;
  title: string;
  description: string;
  daysUntil: number;
  confidence: number;
  estimatedCost: number;
  severity: Severity;
  icon: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  dealer: string;
  description: string;
  cost: number;
}

export interface Dealer {
  id: string;
  name: string;
  distanceKm: number;
  rating: number;
  address: string;
  coords: { lat: number; lng: number };
}

export const MOCK_USER: User = {
  id: 'u_001',
  name: 'João Silva',
  email: 'joao@ford.com',
  role: 'customer',
  tier: 'Gold',
  xp: 15420,
};

export const MOCK_VEHICLE: Vehicle = {
  id: 'v_001',
  model: 'Ford Ranger Raptor',
  year: 2024,
  vin: '9BWAG45N5MT001234',
  km: 28450,
  healthScore: 87,
  ownerId: 'u_001',
};

export const MOCK_PARTS: Part[] = [
  { id: 'p1', name: 'Pastilhas Dianteiras', health: 15, position: { x: 0.28, y: 0.78 }, status: 'critical' },
  { id: 'p2', name: 'Óleo Motor', health: 60, position: { x: 0.22, y: 0.45 }, status: 'warning' },
  { id: 'p3', name: 'Pneu Traseiro RR', health: 55, position: { x: 0.78, y: 0.78 }, status: 'warning' },
  { id: 'p4', name: 'Bateria', health: 78, position: { x: 0.18, y: 0.35 }, status: 'ok' },
  { id: 'p5', name: 'Suspensão Dianteira', health: 92, position: { x: 0.30, y: 0.62 }, status: 'ok' },
  { id: 'p6', name: 'Suspensão Traseira', health: 88, position: { x: 0.75, y: 0.62 }, status: 'ok' },
  { id: 'p7', name: 'Pneu Dianteiro', health: 84, position: { x: 0.28, y: 0.78 }, status: 'ok' },
  { id: 'p8', name: 'Motor', health: 91, position: { x: 0.25, y: 0.50 }, status: 'ok' },
  { id: 'p9', name: 'Câmbio', health: 95, position: { x: 0.50, y: 0.55 }, status: 'ok' },
  { id: 'p10', name: 'Escapamento', health: 89, position: { x: 0.65, y: 0.70 }, status: 'ok' },
  { id: 'p11', name: 'Faróis', health: 97, position: { x: 0.12, y: 0.42 }, status: 'ok' },
  { id: 'p12', name: 'Lanternas', health: 96, position: { x: 0.88, y: 0.42 }, status: 'ok' },
];

export const MOCK_MAINTENANCES: Maintenance[] = [
  {
    id: 'm1',
    title: 'Pastilhas de Freio Dianteiras',
    description: '15% restante · Substituir em 18 dias',
    daysUntil: 18,
    confidence: 94,
    estimatedCost: 450,
    severity: 'critical',
    icon: 'construct-outline',
  },
  {
    id: 'm2',
    title: 'Troca de Óleo Sintético',
    description: '60% restante · Substituir em 12 dias',
    daysUntil: 12,
    confidence: 91,
    estimatedCost: 280,
    severity: 'warning',
    icon: 'water-outline',
  },
  {
    id: 'm3',
    title: 'Pneu Traseiro RR',
    description: '55% restante · Substituir em 30 dias',
    daysUntil: 30,
    confidence: 87,
    estimatedCost: 800,
    severity: 'warning',
    icon: 'disc-outline',
  },
  {
    id: 'm4',
    title: 'Bateria 12V',
    description: 'Vida útil restante: 60 dias',
    daysUntil: 60,
    confidence: 82,
    estimatedCost: 350,
    severity: 'info',
    icon: 'battery-half-outline',
  },
];

export const MOCK_HISTORY: ServiceRecord[] = [
  { id: 's1', date: '2026-03-10', dealer: 'Ford Pinheiros', description: 'Revisão 25.000 km', cost: 1280 },
  { id: 's2', date: '2025-11-22', dealer: 'Ford Pinheiros', description: 'Troca de óleo', cost: 320 },
  { id: 's3', date: '2025-08-14', dealer: 'Ford Morumbi', description: 'Alinhamento + balanceamento', cost: 280 },
  { id: 's4', date: '2025-05-02', dealer: 'Ford Pinheiros', description: 'Revisão 15.000 km', cost: 1450 },
  { id: 's5', date: '2025-02-18', dealer: 'Ford Pinheiros', description: 'Troca de pneus', cost: 900 },
];

export const MOCK_DEALER: Dealer = {
  id: 'd_001',
  name: 'Ford Pinheiros',
  distanceKm: 2.4,
  rating: 4.8,
  address: 'Av. Faria Lima, 1234 - Pinheiros, São Paulo',
  coords: { lat: -23.5673, lng: -46.6939 },
};

export const QUICK_STATS = {
  lastService: '10/03/2026',
  nextService: '01/06/2026',
  totalSpent: 4230,
};
