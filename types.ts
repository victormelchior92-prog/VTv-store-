export type UserRole = 'ADMIN' | 'CLIENT';

export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'BANNED';

export interface User {
  id: string;
  email: string;
  password?: string; // For mock auth
  phone?: string;
  role: UserRole;
  status: UserStatus;
  name?: string;
  avatar?: string;
  subscription?: {
    plan: SubscriptionPlan;
    expiryDate: string; // ISO string
  };
  pendingRenewalPlan?: SubscriptionPlan; // If defined, user requested renewal
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string; // Poster image
  videoUrl?: string; // For demo purposes
  duration?: number; // in minutes
  releaseYear?: number;
  cast?: string[];
  isSeries: boolean;
  episodes?: { title: string; duration: number; id: string }[];
}

export interface Category {
  nom: string;
  elements: string[]; // IDs of contents
}

export interface GeminiEditRequest {
  imageBase64: string;
  prompt: string;
}