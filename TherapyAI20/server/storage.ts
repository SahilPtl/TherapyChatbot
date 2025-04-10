import { User, InsertUser, ChatSession, Message } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createSession(userId: number, name: string): Promise<ChatSession>;
  getSessions(userId: number): Promise<ChatSession[]>;
  getSession(id: number): Promise<ChatSession | undefined>;
  archiveSession(id: number): Promise<void>;
  renameSession(id: number, name: string): Promise<void>;

  createMessage(sessionId: number, content: string, isAi: boolean): Promise<Message>;
  getMessages(sessionId: number): Promise<Message[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, ChatSession>;
  private messages: Map<number, Message>;
  sessionStore: session.Store;
  private currentUserId: number = 1;
  private currentSessionId: number = 1;
  private currentMessageId: number = 1;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSession(userId: number, name: string): Promise<ChatSession> {
    const id = this.currentSessionId++;
    const session: ChatSession = {
      id,
      userId,
      name,
      isArchived: false,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessions(userId: number): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async getSession(id: number): Promise<ChatSession | undefined> {
    return this.sessions.get(id);
  }

  async archiveSession(id: number): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.isArchived = true;
      this.sessions.set(id, session);
    }
  }

  async renameSession(id: number, name: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.name = name;
      this.sessions.set(id, session);
    }
  }

  async createMessage(
    sessionId: number,
    content: string,
    isAi: boolean,
  ): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      sessionId,
      content,
      isAi,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(sessionId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.sessionId === sessionId,
    );
  }
}

export const storage = new MemStorage();