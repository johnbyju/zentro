import Dexie, { type Table } from 'dexie';

export interface Chat {
  id?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  type?: 'builder' | 'assistant';
}

export interface Message {
  id?: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  // Details of the 5-pass pipeline
  passDetails?: {
    pass1?: string; // Analysis
    pass2?: string; // Planning
    pass3?: string; // Code Generation
    pass4?: string; // Self Review
    pass5?: string; // UX Polish
  };
  // Code content generated or edited
  files?: {
    html: string;
    css: string;
    js: string;
  };
}

export interface ProjectDraft {
  id?: string;
  name: string;
  html: string;
  css: string;
  js: string;
  updatedAt: number;
}

class AIBuilderDatabase extends Dexie {
  chats!: Table<Chat, string>;
  messages!: Table<Message, string>;
  projects!: Table<ProjectDraft, string>;

  constructor() {
    super('AIBuilderDatabase');
    this.version(1).stores({
      chats: 'id, title, type, createdAt, updatedAt',
      messages: 'id, chatId, role, createdAt',
      projects: 'id, name, updatedAt',
    });
  }
}

export const db = new AIBuilderDatabase();

// Helper functions to manage database operations
export async function createNewChat(title: string, type: 'builder' | 'assistant' = 'builder'): Promise<string> {
  const chatId = crypto.randomUUID();
  await db.chats.add({
    id: chatId,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    type,
  });
  return chatId;
}

export async function addMessageToChat(message: Omit<Message, 'id'>): Promise<string> {
  const messageId = crypto.randomUUID();
  await db.messages.add({
    ...message,
    id: messageId,
  });
  
  // Update chat's updatedAt timestamp
  await db.chats.update(message.chatId, {
    updatedAt: Date.now(),
  });
  
  return messageId;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  return await db.messages.where('chatId').equals(chatId).sortBy('createdAt');
}

export async function getAllChats(): Promise<Chat[]> {
  return await db.chats.orderBy('updatedAt').reverse().toArray();
}

export async function deleteChat(chatId: string): Promise<void> {
  await db.transaction('rw', [db.chats, db.messages], async () => {
    await db.chats.delete(chatId);
    await db.messages.where('chatId').equals(chatId).delete();
  });
}
