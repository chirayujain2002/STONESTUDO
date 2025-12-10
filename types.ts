
export enum RoomType {
  BEDROOM = 'Bedroom',
  KITCHEN = 'Kitchen',
  LIVING_ROOM = 'Living Room',
  BATHROOM = 'Bathroom',
  GUEST_ROOM = 'Guest Room',
  OFFICE = 'Office',
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectedObject {
  label: string;
  boundingBox: BoundingBox;
}

export interface MaterialOption {
  id: string; // Added for robust identification
  name: string;
  prompt: string;
  imageUrl: string; // Changed from imageUrls: string[]
  category?: 'Marble' | 'Granite' | 'Tiles';
  subCategory?: string;
  price?: number;
  height?: number;
  width?: number;
  savedDesigns?: string[]; // To store visualized examples
}

export interface CatalogueProduct {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  finish?: 'Polished' | 'Unpolished';
  width?: number;
  height?: number;
}

export interface DesignHistoryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  timestamp: number;
  actionDescription: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
