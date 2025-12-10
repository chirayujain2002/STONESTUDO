import { RoomType, MaterialOption } from './types';

export const CATEGORY_STRUCTURE: { [key: string]: string[] } = {
  'Marble': ['Italian Marble', 'Indian Marble', 'Onyx Series', 'Statuario Collection'],
  'Granite': ['Italian Granite', 'Indian Granite', 'Black Galaxy', 'Premium Collection'],
  'Tiles': ['Floor Tiles', 'Parking Tiles', 'Bathroom Tiles', 'Wooden Finish Tiles'],
};

export const ROOM_TYPES: RoomType[] = [
  RoomType.LIVING_ROOM,
  RoomType.BEDROOM,
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.OFFICE,
  RoomType.GUEST_ROOM,
];

export const MATERIAL_OPTIONS: { [key in RoomType]?: MaterialOption[] } = {
  [RoomType.LIVING_ROOM]: [
    { id: 'lr-im', name: 'Italian Marble', prompt: 'classic italian marble flooring', imageUrl: 'https://images.unsplash.com/photo-1543887893-242e23297592?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Italian Marble' },
    { id: 'lr-wmgv', name: 'White Marble Gold Vein', prompt: 'white marble flooring with subtle gold veins', imageUrl: 'https://images.unsplash.com/photo-1619478445452-2a0339-d2c6f3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Statuario Collection' },
    { id: 'lr-btt', name: 'Beige Travertine Tile', prompt: 'beige travertine tile flooring', imageUrl: 'https://images.unsplash.com/photo-1582736342622-c352de43b8c3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'lr-gm', name: 'Grey Marble', prompt: 'elegant grey marble tile flooring', imageUrl: 'https://images.unsplash.com/photo-1621264479391-3f80c6c72852?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Indian Marble' },
    { id: 'lr-bgg', name: 'Black Galaxy Granite', prompt: 'Black Galaxy granite flooring with golden flecks', imageUrl: 'https://images.unsplash.com/photo-1593524931393-2795e13511de?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Black Galaxy' },
    { id: 'lr-mct', name: 'Modern Ceramic Tile', prompt: 'large format modern ceramic tile flooring', imageUrl: 'https://images.unsplash.com/photo-1580974928064-03ae727c6295?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'lr-lowt', name: 'Light Oak Wood Tile', prompt: 'light oak wooden finish tile flooring', imageUrl: 'https://images.unsplash.com/photo-1588854336873-5a1e1b1d9294?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Wooden Finish Tiles' },
  ],
  [RoomType.BEDROOM]: [
    { id: 'br-cmt', name: 'Cream Marble Tile', prompt: 'polished cream marble tile flooring', imageUrl: 'https://images.unsplash.com/photo-1629806413695-97e3a951d3b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Italian Marble' },
    { id: 'br-kwg', name: 'Kashmir White Granite', prompt: 'Kashmir white granite flooring', imageUrl: 'https://images.unsplash.com/photo-1617063493504-8e7a78354674?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Indian Granite' },
    { id: 'br-ppt', name: 'Patterned Porcelain Tile', prompt: 'elegant patterned porcelain tile flooring', imageUrl: 'https://images.unsplash.com/photo-1603952937237-97cf03e85844?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'br-btt', name: 'Beige Travertine Tile', prompt: 'beige travertine tile flooring', imageUrl: 'https://images.unsplash.com/photo-1582736342622-c352de43b8c3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'br-dowt', name: 'Dark Oak Wood Tile', prompt: 'dark oak wooden finish tile flooring', imageUrl: 'https://images.unsplash.com/photo-1594411993248-1855363a35a4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Wooden Finish Tiles' },
  ],
  [RoomType.KITCHEN]: [
    { id: 'kt-ct', name: 'Checkered Tile', prompt: 'classic black and white checkered tile flooring', imageUrl: 'https://images.unsplash.com/photo-1605372351241-3729514e4143?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'kt-tt', name: 'Terracotta Tile', prompt: 'warm terracotta tile flooring', imageUrl: 'https://images.unsplash.com/photo-1627909337795-c12e7546554b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'kt-ug', name: 'Ubatuba Granite', prompt: 'dark Ubatuba granite flooring', imageUrl: 'https://images.unsplash.com/photo-1628795186867-151121d4c2b2?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Premium Collection' },
    { id: 'kt-cm', name: 'Carrara Marble', prompt: 'white Carrara marble flooring', imageUrl: 'https://images.unsplash.com/photo-1617103996236-ec2a5f782335?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Italian Marble' },
    { id: 'kt-dst', name: 'Dark Slate Tile', prompt: 'dark slate stone tile flooring', imageUrl: 'https://images.unsplash.com/photo-1549995424-279c1cb0b428?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
  ],
  [RoomType.BATHROOM]: [
    { id: 'bt-cwt', name: 'Classic White Tile', prompt: 'classic glossy white ceramic tile flooring', imageUrl: 'https://images.unsplash.com/photo-1629806413695-97e3a951d3b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Bathroom Tiles' },
    { id: 'bt-pct', name: 'Patterned Ceramic Tile', prompt: 'blue and white patterned ceramic tile flooring', imageUrl: 'https://images.unsplash.com/photo-1603952937237-97cf03e85844?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Bathroom Tiles' },
    { id: 'bt-gm', name: 'Grey Marble', prompt: 'elegant grey marble tile flooring', imageUrl: 'https://images.unsplash.com/photo-1621264479391-3f80c6c72852?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Indian Marble' },
    { id: 'bt-dst', name: 'Dark Slate Tile', prompt: 'dark slate stone tile flooring', imageUrl: 'https://images.unsplash.com/photo-1549995424-279c1cb0b428?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Bathroom Tiles' },
    { id: 'bt-bpg', name: 'Blue Pearl Granite', prompt: 'blue pearl granite flooring', imageUrl: 'https://images.unsplash.com/photo-1561083313-25531dc17c1e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Premium Collection' },
    { id: 'bt-pom', name: 'Pink Onyx Marble', prompt: 'polished pink onyx marble flooring', imageUrl: 'https://images.unsplash.com/photo-1631745481350-a36c84381389?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Onyx Series' },
  ],
  [RoomType.OFFICE]: [
    { id: 'of-gm', name: 'Grey Marble', prompt: 'elegant grey marble tile flooring', imageUrl: 'https://images.unsplash.com/photo-1621264479391-3f80c6c72852?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Indian Marble' },
    { id: 'of-ppt', name: 'Polished Porcelain Tile', prompt: 'large format polished porcelain tile flooring', imageUrl: 'https://images.unsplash.com/photo-1588280592036-81d74a7b7381?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'of-tbg', name: 'Tan Brown Granite', prompt: 'tan brown granite flooring', imageUrl: 'https://images.unsplash.com/photo-1598993883398-7517a59c95c8?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Indian Granite' },
    { id: 'of-mbt', name: 'Matte Black Tile', prompt: 'large matte black tile flooring', imageUrl: 'https://images.unsplash.com/photo-1605372351241-3729514e4143?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'of-cp', name: 'Cobblestone Pavers', prompt: 'durable cobblestone paver flooring', imageUrl: 'https://images.unsplash.com/photo-1587580193424-d75a8923a1e1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Parking Tiles' },
  ],
  [RoomType.GUEST_ROOM]: [
    { id: 'gr-btt', name: 'Beige Travertine Tile', prompt: 'beige travertine tile flooring', imageUrl: 'https://images.unsplash.com/photo-1582736342622-c352de43b8c3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Floor Tiles' },
    { id: 'gr-cwt', name: 'Classic White Tile', prompt: 'classic glossy white ceramic tile flooring', imageUrl: 'https://images.unsplash.com/photo-1629806413695-97e3a951d3b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Tiles', subCategory: 'Bathroom Tiles' },
    { id: 'gr-em', name: 'Emperador Marble', prompt: 'dark Emperador marble flooring', imageUrl: 'https://images.unsplash.com/photo-1567016432779-1fee8416787d?q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Marble', subCategory: 'Indian Marble' },
    { id: 'gr-abg', name: 'Absolute Black Granite', prompt: 'polished absolute black granite flooring', imageUrl: 'https://images.unsplash.com/photo-1574786577759-aebe0992718b?q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Black Galaxy' },
    { id: 'gr-bag', name: 'Bianco Antico Granite', prompt: 'bianco antico white and grey granite flooring', imageUrl: 'https://images.unsplash.com/photo-1580214686888-a2267685da2c?q=85&fm=jpg&crop=entropy&cs=srgb&w=200', category: 'Granite', subCategory: 'Italian Granite' },
  ]
};

export const DEFAULT_SUGGESTIONS = [
  'floor',
  'wall',
  'ceiling'
];
