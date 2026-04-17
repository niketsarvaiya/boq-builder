import type { LineItem } from '../types/index';

export type Severity = 'error' | 'warning' | 'info';

export interface Suggestion {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  affectedItems: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTotalQty(item: LineItem): number {
  const fromAllocations = item.roomAllocations.reduce((s, ra) => s + (ra.qty || 0), 0);
  return fromAllocations > 0 ? fromAllocations : 1;
}

function parseNumber(text: string, pattern: RegExp): number {
  const m = text.match(pattern);
  return m ? parseInt(m[1]) : 0;
}

function portCount(item: LineItem): number {
  return (
    parseNumber(item.product, /(\d+)\s*[Pp]ort/) ||
    parseNumber(item.modelNumber, /(\d+)\s*[Pp]ort/)
  );
}

function channelCount(item: LineItem): number {
  return (
    parseNumber(item.product, /(\d+)\s*[Cc][Hh]/) ||
    parseNumber(item.modelNumber, /(\d+)\s*[Cc][Hh]/)
  );
}

function contains(item: LineItem, ...terms: RegExp[]): boolean {
  const haystack = `${item.product} ${item.modelNumber}`.toLowerCase();
  return terms.every((t) => t.test(haystack));
}

// ── Rule 1 + 2: PoE Port Count and Power Budget ──────────────────────────────

function checkPoE(lineItems: LineItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const active = lineItems.filter((i) => i.included);

  const switches = active.filter(
    (i) => i.scope === 'Networking' && contains(i, /poe/i),
  );
  const aps = active.filter(
    (i) =>
      i.scope === 'Networking' &&
      (/access\s*point/i.test(i.product) ||
        /\bap\b/i.test(i.product) ||
        /gwn76/i.test(i.modelNumber)),
  );
  const cameras = active.filter((i) => i.scope === 'Integrated Security');

  const poeDevices = [...aps, ...cameras];

  // ── Port count ──────────────────────────────────────────────────────────
  let totalPorts = 0;
  for (const sw of switches) {
    const ports = portCount(sw);
    if (ports) totalPorts += ports * getTotalQty(sw);
  }

  const totalPoeDeviceQty = poeDevices.reduce((s, d) => s + getTotalQty(d), 0);

  if (switches.length > 0 && totalPorts > 0) {
    if (totalPoeDeviceQty > totalPorts) {
      suggestions.push({
        id: 'poe-port-overflow',
        severity: 'error',
        category: 'PoE Infrastructure',
        title: 'PoE port count insufficient',
        detail: `${totalPoeDeviceQty} PoE devices vs ${totalPorts} available ports. Add more PoE switches or upgrade to a higher port-count model.`,
        affectedItems: [...switches, ...poeDevices].map((i) => i.product).filter(Boolean),
      });
    } else if (totalPoeDeviceQty > totalPorts * 0.8) {
      suggestions.push({
        id: 'poe-port-near-full',
        severity: 'warning',
        category: 'PoE Infrastructure',
        title: 'PoE ports nearly full',
        detail: `${totalPoeDeviceQty} PoE devices vs ${totalPorts} available ports (${Math.round((totalPoeDeviceQty / totalPorts) * 100)}% utilisation). Consider adding headroom.`,
        affectedItems: switches.map((i) => i.product).filter(Boolean),
      });
    }
  }

  // ── Power budget ────────────────────────────────────────────────────────
  let totalBudgetW = 0;
  for (const sw of switches) {
    const model = sw.modelNumber.toUpperCase();
    const ports = portCount(sw);
    let budget = 0;
    if (model.includes('GWN7701PA')) budget = 65;
    else if (model.includes('GWN7702P')) budget = 130;
    else if (ports === 8) budget = 65;
    else if (ports === 16) budget = 130;
    else if (ports === 24) budget = 185;
    else if (ports === 48) budget = 370;
    totalBudgetW += budget * getTotalQty(sw);
  }

  let totalDrawW = 0;
  for (const dev of poeDevices) {
    const qty = getTotalQty(dev);
    const prod = dev.product.toLowerCase();
    const model = dev.modelNumber.toLowerCase();
    let draw = 10;
    if (/camera/i.test(prod)) draw = 8;
    else if (/access\s*point/i.test(prod) || /gwn766/i.test(model)) draw = 15;
    totalDrawW += draw * qty;
  }

  if (totalBudgetW > 0) {
    if (totalDrawW > totalBudgetW) {
      suggestions.push({
        id: 'poe-power-overflow',
        severity: 'error',
        category: 'PoE Infrastructure',
        title: 'PoE power budget exceeded',
        detail: `Estimated draw: ${totalDrawW}W vs total budget: ${totalBudgetW}W. Upgrade to higher-wattage PoE switches.`,
        affectedItems: [...switches, ...poeDevices].map((i) => i.product).filter(Boolean),
      });
    } else if (totalDrawW > totalBudgetW * 0.8) {
      suggestions.push({
        id: 'poe-power-near-full',
        severity: 'warning',
        category: 'PoE Infrastructure',
        title: 'PoE power budget nearly full',
        detail: `Estimated draw: ${totalDrawW}W vs total budget: ${totalBudgetW}W (${Math.round((totalDrawW / totalBudgetW) * 100)}% utilisation).`,
        affectedItems: switches.map((i) => i.product).filter(Boolean),
      });
    }
  }

  return suggestions;
}

// ── Rule 3: Relay Channel Count ───────────────────────────────────────────────

function checkRelayChannels(lineItems: LineItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const active = lineItems.filter((i) => i.included);

  const relays = active.filter(
    (i) =>
      /relay/i.test(i.product) ||
      /relay/i.test(i.modelNumber) ||
      /itr516/i.test(i.modelNumber),
  );

  const controlled = active.filter((i) =>
    ['Backend Lighting', 'Temp / AC', 'Motors'].includes(i.scope),
  );

  let totalChannels = 0;
  for (const r of relays) {
    const ch = channelCount(r) || 8;
    totalChannels += ch * getTotalQty(r);
  }

  const totalDevices = controlled.reduce((s, d) => s + getTotalQty(d), 0);

  if (relays.length > 0 && totalDevices > 0) {
    if (totalDevices > totalChannels) {
      suggestions.push({
        id: 'relay-channel-overflow',
        severity: 'error',
        category: 'Relay / Backend',
        title: 'Relay channel count insufficient',
        detail: `${totalDevices} relay-controlled devices vs ${totalChannels} available channels. Add more relay modules.`,
        affectedItems: relays.map((i) => i.product).filter(Boolean),
      });
    } else if (totalDevices > totalChannels * 0.85) {
      suggestions.push({
        id: 'relay-channel-near-full',
        severity: 'warning',
        category: 'Relay / Backend',
        title: 'Relay channels nearly full',
        detail: `${totalDevices} devices vs ${totalChannels} relay channels (${Math.round((totalDevices / totalChannels) * 100)}% utilisation).`,
        affectedItems: relays.map((i) => i.product).filter(Boolean),
      });
    }
  }

  return suggestions;
}

// ── Rule 4: DALI Channel Count ────────────────────────────────────────────────

function checkDALI(lineItems: LineItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const active = lineItems.filter((i) => i.included);

  const daliInterfaces = active.filter(
    (i) => /dali/i.test(i.product) || /dli/i.test(i.modelNumber),
  );
  const daliDevices = active.filter(
    (i) => i.scope === 'Backend Lighting' && /dali/i.test(i.product),
  );

  const totalCapacity = daliInterfaces.reduce(
    (s, d) => s + getTotalQty(d) * 64,
    0,
  );
  const totalDevices = daliDevices.reduce((s, d) => s + getTotalQty(d), 0);

  if (daliInterfaces.length > 0 && totalDevices > totalCapacity) {
    suggestions.push({
      id: 'dali-overflow',
      severity: 'error',
      category: 'DALI Lighting',
      title: 'DALI capacity exceeded',
      detail: `${totalDevices} DALI devices vs ${totalCapacity} available capacity (${daliInterfaces.length} interface${daliInterfaces.length > 1 ? 's' : ''} × 64 devices).`,
      affectedItems: daliInterfaces.map((i) => i.product).filter(Boolean),
    });
  }

  return suggestions;
}

// ── Rule 5: NVR Channel vs Camera Count ──────────────────────────────────────

function checkNVR(lineItems: LineItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const active = lineItems.filter((i) => i.included);

  const nvrs = active.filter((i) => /nvr/i.test(i.product));
  const cameras = active.filter(
    (i) => i.scope === 'Integrated Security' && /camera/i.test(i.product),
  );

  if (nvrs.length === 0 || cameras.length === 0) return [];

  let totalChannels = 0;
  for (const nvr of nvrs) {
    const m = `${nvr.product} ${nvr.modelNumber}`.match(/(\d+)[- ]?ch/i);
    const ch = m ? parseInt(m[1]) : 8;
    totalChannels += ch * getTotalQty(nvr);
  }

  const totalCameras = cameras.reduce((s, c) => s + getTotalQty(c), 0);

  if (totalCameras > totalChannels) {
    suggestions.push({
      id: 'nvr-channel-overflow',
      severity: 'error',
      category: 'Security / CCTV',
      title: 'NVR channel count insufficient',
      detail: `${totalCameras} cameras vs ${totalChannels} NVR channels. Upgrade to a higher-channel NVR or add another unit.`,
      affectedItems: [...nvrs, ...cameras].map((i) => i.product).filter(Boolean),
    });
  }

  return suggestions;
}

// ── Rule 6: Missing Items Check ───────────────────────────────────────────────

function checkMissingItems(lineItems: LineItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const active = lineItems.filter((i) => i.included);

  const hasCameras = active.some(
    (i) => i.scope === 'Integrated Security' && /camera/i.test(i.product),
  );
  const hasNVR = active.some((i) => /nvr/i.test(i.product));
  const hasAPs = active.some(
    (i) =>
      i.scope === 'Networking' &&
      (/access\s*point/i.test(i.product) || /\bap\b/i.test(i.product)),
  );
  const hasRouter = active.some(
    (i) =>
      i.scope === 'Networking' &&
      (/router/i.test(i.product) || /switch/i.test(i.product)),
  );
  const hasKeypads = active.some((i) => i.scope === 'Front End');
  const hasProcessor = active.some((i) => i.scope === 'Processors');
  const hasRelays = active.some(
    (i) => /relay/i.test(i.product) || /itr516/i.test(i.modelNumber),
  );

  if (hasCameras && !hasNVR) {
    suggestions.push({
      id: 'missing-nvr',
      severity: 'warning',
      category: 'Missing Items',
      title: 'Cameras in BOQ but no NVR specified',
      detail: 'Add an NVR with sufficient channel count to record all cameras.',
      affectedItems: active
        .filter((i) => i.scope === 'Integrated Security' && /camera/i.test(i.product))
        .map((i) => i.product),
    });
  }

  if (hasAPs && !hasRouter) {
    suggestions.push({
      id: 'missing-router',
      severity: 'warning',
      category: 'Missing Items',
      title: 'Access Points in BOQ but no router/switch found',
      detail:
        'Access Points require a managed switch or router for proper network segmentation.',
      affectedItems: active
        .filter((i) => /access\s*point/i.test(i.product))
        .map((i) => i.product),
    });
  }

  if (hasKeypads && !hasProcessor) {
    suggestions.push({
      id: 'missing-processor',
      severity: 'warning',
      category: 'Missing Items',
      title: 'Keypads found but no control processor in BOQ',
      detail:
        'Keypads require a control processor (e.g. KNX IP Router or home automation controller).',
      affectedItems: active
        .filter((i) => i.scope === 'Front End')
        .map((i) => i.product)
        .slice(0, 3),
    });
  }

  if (hasRelays && !hasProcessor) {
    suggestions.push({
      id: 'relay-no-processor',
      severity: 'warning',
      category: 'Missing Items',
      title: 'Relay modules without a processor',
      detail:
        'Relay modules need a control processor or KNX bus coupler to function.',
      affectedItems: active
        .filter((i) => /relay/i.test(i.product))
        .map((i) => i.product)
        .slice(0, 3),
    });
  }

  return suggestions;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function runIntelligenceRules(lineItems: LineItem[]): Suggestion[] {
  return [
    ...checkPoE(lineItems),
    ...checkRelayChannels(lineItems),
    ...checkDALI(lineItems),
    ...checkNVR(lineItems),
    ...checkMissingItems(lineItems),
  ];
}
