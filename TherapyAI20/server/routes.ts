import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { generateTherapyResponse } from "./services/ai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Session management routes
  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const session = await storage.createSession(req.user.id, parsed.data.name);
    res.status(201).json(session);
  });

  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessions = await storage.getSessions(req.user.id);
    res.json(sessions);
  });

  app.get("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessionId = parseInt(req.params.id);
    const session = await storage.getSession(sessionId);

    if (!session) return res.sendStatus(404);
    if (session.userId !== req.user.id) return res.sendStatus(403);

    res.json(session);
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessionId = parseInt(req.params.id);
    const session = await storage.getSession(sessionId);

    if (!session) return res.sendStatus(404);
    if (session.userId !== req.user.id) return res.sendStatus(403);

    const parsed = insertSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    await storage.renameSession(sessionId, parsed.data.name);
    res.sendStatus(200);
  });

  app.post("/api/sessions/:id/archive", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const session = await storage.getSession(id);

    if (!session) return res.sendStatus(404);
    if (session.userId !== req.user.id) return res.sendStatus(403);

    await storage.archiveSession(id);
    res.sendStatus(200);
  });

  // Message routes
  app.post("/api/sessions/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const sessionId = parseInt(req.params.id);
    const session = await storage.getSession(sessionId);

    if (!session) return res.sendStatus(404);
    if (session.userId !== req.user.id) return res.sendStatus(403);

    // Save user message
    const message = await storage.createMessage(
      sessionId,
      parsed.data.content,
      false
    );

    try {
      // Get chat history for context
      const history = await storage.getMessages(sessionId);
      const chatHistory = history.map(msg => msg.content);

      // Generate AI response
      const aiResponseText = await generateTherapyResponse(parsed.data.content, chatHistory);

      // Save AI response
      const aiResponse = await storage.createMessage(
        sessionId,
        aiResponseText,
        true
      );

      res.json([message, aiResponse]);
    } catch (error) {
      console.error('Error in message processing:', error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  app.get("/api/sessions/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const sessionId = parseInt(req.params.id);
    const session = await storage.getSession(sessionId);

    if (!session) return res.sendStatus(404);
    if (session.userId !== req.user.id) return res.sendStatus(403);

    const messages = await storage.getMessages(sessionId);
    res.json(messages);
  });

  const httpServer = createServer(app);
  return httpServer;
}