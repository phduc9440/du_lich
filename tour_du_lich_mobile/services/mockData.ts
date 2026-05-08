export interface Tour {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  description: string;
}

export const CATEGORIES = [
  { id: '1', name: 'Mountain', icon: 'landscape' },
  { id: '2', name: 'Beach', icon: 'beach-access' },
  { id: '3', name: 'City', icon: 'location-city' },
  { id: '4', name: 'Forest', icon: 'park' },
  { id: '5', name: 'Desert', icon: 'wb-sunny' },
];

export const MOCK_TOURS: Tour[] = [
  {
    id: '1',
    title: 'Hạ Long Bay Cruise',
    location: 'Quảng Ninh, Vietnam',
    price: 150,
    rating: 4.8,
    reviews: 1240,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    category: 'Beach',
    description: 'Experience the breathtaking beauty of Ha Long Bay on a luxury cruise. Explore hidden caves, swim in turquoise waters, and enjoy fresh seafood under the stars.',
  },
  {
    id: '2',
    title: 'Sapa Trekking Adventure',
    location: 'Lào Cai, Vietnam',
    price: 85,
    rating: 4.9,
    reviews: 850,
    image: 'https://images.unsplash.com/photo-1502252430442-aac78f397426?auto=format&fit=crop&w=800&q=80',
    category: 'Mountain',
    description: 'Trek through the stunning rice terraces of Sapa, visit ethnic minority villages, and conquer Fansipan - the roof of Indochina.',
  },
  {
    id: '3',
    title: 'Hội An Ancient Town Tour',
    location: 'Quảng Nam, Vietnam',
    price: 45,
    rating: 4.7,
    reviews: 2100,
    image: 'https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&w=800&q=80',
    category: 'City',
    description: 'Discover the charm of Hoi An, a UNESCO World Heritage site. Walk through lantern-lit streets, visit ancient houses, and taste the best local street food.',
  },
  {
    id: '4',
    title: 'Phú Quốc Island Escape',
    location: 'Kiên Giang, Vietnam',
    price: 200,
    rating: 4.6,
    reviews: 980,
    image: 'https://images.unsplash.com/photo-1589394815804-964ed9be2eb3?auto=format&fit=crop&w=800&q=80',
    category: 'Beach',
    description: 'Relax on the pristine white sands of Phu Quoc Island. Enjoy snorkeling in coral reefs, sunset cocktails, and world-class resort hospitality.',
  },
];
