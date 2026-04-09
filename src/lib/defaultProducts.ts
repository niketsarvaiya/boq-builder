import type { LineItem } from '../types/index';

export const DEFAULT_PRODUCTS: Omit<LineItem, 'id'>[] = [
  // Backend Lighting
  { scope: 'Backend Lighting', product: 'On/Off Lights', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Lighting', product: 'Phasecut (Non-Dali Decorative)', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Lighting', product: 'Dali Dimmable', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Lighting', product: 'Dali Tunable', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Lighting', product: 'Fan - On/Off', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Lighting', product: 'Fan - Speed Control', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Temp / AC
  { scope: 'Temp / AC', product: 'AC', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Front End
  { scope: 'Front End', product: '8 Button Keypad', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Front End', product: '4 Button Keypad', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Front End', product: 'Lira Push Button', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Front End', product: 'Electrical Push Button', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Front End', product: 'Remotes / Wireless Keypads', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Front End', product: 'iPad Docking Station', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // IR
  { scope: 'IR', product: 'IR AV Controller', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Motors
  { scope: 'Motors', product: 'Roman Blinds', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Motors', product: 'Roller Blinds', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Motors', product: 'American Curtains', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Motors', product: 'Ripple Fold Curtains', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Motors', product: 'Bar Lift', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // AV
  { scope: 'AV', product: 'Motorized Screen', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Fixed Screen', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Projector Lift', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Motorized Drawer', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'TV Lift', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'AVR / Streamer', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Amplifier', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Projector', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'TV', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Speakers', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'AV', product: 'Woofer / Subwoofer', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Networking
  { scope: 'Networking', product: 'Access Point', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Networking', product: 'POE Switch', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Networking', product: 'Non POE Switch', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Networking', product: 'Dual WAN Firewall', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Integrated Security
  { scope: 'Integrated Security', product: 'IPBX', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Integrated Security', product: 'CCTV', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Integrated Security', product: 'VDP', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Integrated Security', product: 'Readers', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Integrated Security', product: 'Exit Button', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Integrated Security', product: 'Locks', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Cables
  { scope: 'Cables', product: 'HDMI', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Cables', product: 'Speaker Cable', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Cables', product: 'Woofer Cable', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Cables', product: 'Optical', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Cables', product: 'Stereo', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Backend Infrastructure
  { scope: 'Backend Infrastructure', product: 'Networking Rack', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Backend Infrastructure', product: 'Automation DB', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // General
  { scope: 'General', product: 'Alexa Integration', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'General', product: 'Apple HomeKit', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'General', product: 'Crestron App', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'General', product: 'Basalte Processor', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Sensors
  { scope: 'Sensors', product: 'Motion Sensors', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  // Processors
  { scope: 'Processors', product: 'Crestron', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Processors', product: 'Basalte', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Processors', product: 'Parriot', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
  { scope: 'Processors', product: 'Cue', brand: '', modelNumber: '', specs: '', notes: '', roomAllocations: [], included: false, isCustom: false },
];

export const SCOPE_ORDER: string[] = [
  'Backend Lighting',
  'Temp / AC',
  'Front End',
  'IR',
  'Motors',
  'AV',
  'Networking',
  'Integrated Security',
  'Cables',
  'Backend Infrastructure',
  'General',
  'Sensors',
  'Processors',
];

export const SCOPE_COLORS: Record<string, string> = {
  'Backend Lighting': '#f59e0b',
  'Temp / AC': '#3b82f6',
  'Front End': '#8b5cf6',
  'IR': '#06b6d4',
  'Motors': '#f97316',
  'AV': '#6366f1',
  'Networking': '#0ea5e9',
  'Integrated Security': '#ef4444',
  'Cables': '#14b8a6',
  'Backend Infrastructure': '#d97706',
  'General': '#10b981',
  'Sensors': '#a855f7',
  'Processors': '#ec4899',
};

export function createDefaultLineItems(): LineItem[] {
  return DEFAULT_PRODUCTS.map((p, i) => ({
    ...p,
    id: `default_${i}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    roomAllocations: [],
  }));
}

