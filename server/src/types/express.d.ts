import { User } from '@prisma/client';
import { Query, ParamsDictionary } from 'express-serve-static-core';

declare module 'express' {
  export interface Request {
    user?: User;
    params: ParamsDictionary;
    query: Query;
    file?: Express.Multer.File; // For multer
    // Add specific body types for whatsapp routes to avoid "ReadableStream" error
    body: {
      phoneNumber?: string;
      message?: string;
      ticketData?: object; // Will define a more specific interface later
      assetData?: object;  // Will define a more specific interface later
      // Add other common body properties here if they are truly global
      id?: string; // For bulk operations, etc.
      ids?: string[]; // For bulk delete
      category?: string; // For ticketTemplates query
      isActive?: boolean; // For ticketTemplates query
      // For tickets
      createdById?: string;
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      assignedToId?: string;
      assetId?: string;
    } | any; // Fallback to any for other untyped bodies
  }
}
