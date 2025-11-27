import { Category, ContentItem, User } from "./types";

export const ADMIN_EMAIL = "victormelchior92@gmail.com";
export const ADMIN_PIN = "03/03/2008"; // Simple check for demo

export const SUBSCRIPTION_PRICES = {
  BASIC: { price: 5000, label: "Basic", currency: "FCFA" },
  STANDARD: { price: 10500, label: "Standard", currency: "FCFA" },
  PREMIUM: { price: 15000, label: "Premium", currency: "FCFA" },
};

export const INITIAL_CATEGORIES: Category[] = [
  { nom: "Films populaires", elements: [] },
  { nom: "Nouveautés / Films récents", elements: [] },
  { nom: "Action", elements: [] },
  { nom: "Séries populaires", elements: [] },
  { nom: "Animés tendances", elements: [] },
  { nom: "Exclusivités VTV", elements: [] },
];

// Mock Users for Auth Simulation
export const MOCK_USERS: User[] = [
  {
    id: 'admin',
    email: ADMIN_EMAIL,
    role: 'ADMIN',
    status: 'ACTIVE',
    password: ADMIN_PIN
  },
  {
    id: 'user-active',
    email: 'client@vtv.com',
    password: '123',
    role: 'CLIENT',
    status: 'ACTIVE',
    name: 'Client Fidèle',
    phone: '+24100000001',
    subscription: {
      plan: 'PREMIUM',
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days left
    }
  },
  {
    id: 'user-expired',
    email: 'expired@vtv.com',
    password: '123',
    role: 'CLIENT',
    status: 'EXPIRED',
    name: 'Client Expiré',
    phone: '+24100000002',
    subscription: {
      plan: 'BASIC',
      expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Expired 5 days ago
    }
  },
  {
    id: 'user-pending',
    email: 'nouveau@vtv.com',
    password: '123',
    role: 'CLIENT',
    status: 'PENDING',
    name: 'Nouveau Venu',
    phone: '+24100000003',
    subscription: { // Proposed plan
      plan: 'STANDARD',
      expiryDate: new Date().toISOString()
    }
  }
];

// Mock Content to populate the UI initially
export const MOCK_CONTENT: ContentItem[] = [
  {
    id: "1",
    title: "Cyber Africa",
    description: "In a futuristic Lagos, a young hacker discovers a conspiracy that threatens the entire continent.",
    category: "Science-fiction",
    thumbnailUrl: "https://picsum.photos/seed/cyber/300/450",
    isSeries: false,
    duration: 120,
    releaseYear: 2024,
    cast: ["John Doe", "Jane Smith"]
  },
  {
    id: "2",
    title: "Savannah Kings",
    description: "A documentary following the life of a lion pride in the Serengeti.",
    category: "Documentaires films",
    thumbnailUrl: "https://picsum.photos/seed/lion/300/450",
    isSeries: true,
    episodes: [{id: "e1", title: "The Beginning", duration: 45}, {id: "e2", title: "Survival", duration: 48}],
    releaseYear: 2023,
  },
  {
    id: "3",
    title: "Neon Nights",
    description: "A thriller set in the underground racing scene of Tokyo.",
    category: "Action",
    thumbnailUrl: "https://picsum.photos/seed/cars/300/450",
    isSeries: false,
    duration: 110,
    releaseYear: 2024,
  }
];