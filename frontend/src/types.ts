export interface Message {
    id: number;
    text?: string;
    sender: 'user' | 'bot';
    file?: File | null;
    image?: string;
    audio?: string;
    timestamp: Date;
    languageInfo?: string;
    originalMessage?: string;
  }
  
  export interface OrderField {
    field: string;
    description: string;
  }
  
  export type PageType = 'chat' | 'government' | 'reservations' | 'calendar' | 'orders' | 'travel' | 'profile';