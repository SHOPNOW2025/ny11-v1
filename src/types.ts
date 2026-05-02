export type UserRole = "ADMIN" | "USER" | "TRAINER" | "LAB_MANAGER";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  language?: "ar" | "en";
  walletBalance: number;
  profilePic?: string;
  image?: string;
  createdAt: number;
  age?: number;
  goal?: "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN" | "MUSCLE";
  currentWeight?: number;
  height?: number;
  aiInsights?: string;
  currency?: "USD" | "JOD";
  serviceCurrency?: "USD" | "JOD";
  rating?: number;
  price?: number;
  bio?: string;
  bio_ar?: string;
  bio_en?: string;
  online?: boolean;
}

export interface KnowledgeBaseItem {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
}

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface MenuItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  currency?: "USD" | "JOD";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  category: string;
  image: string;
}

export interface LabTest {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  currency?: "USD" | "JOD";
  category: string;
  image?: string;
}

export interface Expert {
  id: string;
  name: LocalizedString;
  role: "TRAINER" | "LAB_MANAGER";
  rating: number;
  price: number;
  currency?: "USD" | "JOD";
  image: string;
  bio: LocalizedString;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: "TEXT" | "QUOTE";
  quoteAmount?: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: number;
  type: "EXPERT" | "AI";
  expertId?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  expiryDate: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: number;
}
