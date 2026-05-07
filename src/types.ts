export type UserRole = "ADMIN" | "USER" | "TRAINER" | "LAB_MANAGER" | "ACCOUNTANT";

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  amount: number;
  method: "BANK" | "WALLET";
  details: {
    phoneNumber: string;
    alias: string;
    bankName?: string;
    accountIban?: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  createdAt: number;
}

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
  bio_en_en?: string;
  online?: boolean;
  savedGifs?: string[];
  blockedUsers?: string[];
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

export type MenuCategory = "MENU" | "SUPPLEMENTS" | "BASIL";

export interface CategorySettings {
  id: MenuCategory;
  image: string;
  name: LocalizedString;
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
  category: MenuCategory;
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
  text?: string;
  timestamp: number;
  type: "TEXT" | "QUOTE" | "IMAGE" | "GIF" | "VIDEO";
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  quoteAmount?: number;
  read?: boolean;
  readAt?: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: number;
  type: "EXPERT" | "AI";
  expertId?: string;
  unreadCount?: { [userId: string]: number };
  pinnedBy?: string[];
  blockedBy?: string[];
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
