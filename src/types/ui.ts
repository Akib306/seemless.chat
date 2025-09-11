import type { UIMessage } from 'ai';

export type AppMetadata = {
  chatId: string;
  userId: string;
  createdAt: string;          
  modelUsed?: string | null;
  tokensUsed?: number;
};

export type AppUIMessage = UIMessage<AppMetadata>;