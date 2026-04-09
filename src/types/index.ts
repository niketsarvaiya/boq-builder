export interface Room {
  id: string;
  name: string;
  order: number;
}

export interface RoomAllocation {
  roomId: string;
  qty: number;
}

export interface LineItem {
  id: string;
  scope: string;
  product: string;
  brand: string;
  modelNumber: string;
  specs: string;
  notes: string;
  roomAllocations: RoomAllocation[];
  included: boolean;
  isCustom?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  projectCode: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  lineItems: LineItem[];
}

export type ScopeName =
  | 'Backend Lighting'
  | 'Temp / AC'
  | 'Front End'
  | 'IR'
  | 'Motors'
  | 'AV'
  | 'Networking'
  | 'Integrated Security'
  | 'Cables'
  | 'Backend Infrastructure'
  | 'General'
  | 'Sensors'
  | 'Processors';
