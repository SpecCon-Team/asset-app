import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAuthenticated?: boolean;
    createdAt?: Date;
    lastActivity?: Date;
  }
}
