import { WebSocketService, BotEventType, BotEvent } from '../modules/websocket/websocket.service';
import { EventEmitter } from 'events';
import { Bot } from '../modules/database/entities/Bot.entity';

// Create a mock WebSocket class
class MockWebSocket {
  public readyState: number = 1; // 1 = OPEN
  public sentMessages: any[] = [];

  constructor(public id: string) { }

  send(message: string) {
    this.sentMessages.push(JSON.parse(message));
  }

  close() {
    this.readyState = 3; // 3 = CLOSED
  }

  // Mock the EventEmitter's on method for 'close' events
  on(event: string, callback: () => void) {
    if (event === 'close') {
      this.closeCallback = callback;
    }
  }

  closeCallback() {
    // Will be set by the service during addClient
  }

  triggerClose() {
    this.readyState = 3; // 3 = CLOSED
    this.closeCallback();
  }
}

// Mock Bot class that implements all required properties from Bot entity
class MockBot implements Bot {
  id: string;
  name: string;
  type: string;
  status: "active" | "stopped" | "paused";  // Match the exact status types
  config: any;
  created_at: Date;
  updated_at: Date;

  constructor(props: Partial<Bot> = {}) {
    this.id = props.id || 'mock-bot-id';
    this.name = props.name || 'Mock Bot';
    this.type = props.type || 'mock';
    this.status = props.status || 'stopped';
    this.config = props.config || {};
    this.created_at = props.created_at || new Date();
    this.updated_at = props.updated_at || new Date();
  }
}

describe('WebSocketService Unit Tests', () => {
  let wsService: WebSocketService;
  let mockWs1: MockWebSocket;
  let mockWs2: MockWebSocket;

  // Clean up resources before each test
  beforeEach(() => {
    // Hack to reset the singleton instance
    (WebSocketService as any).instance = undefined;
    wsService = WebSocketService.getInstance();

    // Create mock WebSocket clients
    mockWs1 = new MockWebSocket('client-1');
    mockWs2 = new MockWebSocket('client-2');
  });

  // Clean up resources after each test
  afterEach(() => {
    // Clean up any listeners on the event emitter
    const eventEmitter = (wsService as any).eventEmitter as EventEmitter;
    eventEmitter.removeAllListeners();

    // Clear all clients
    const clients = (wsService as any).clients;
    clients.clear();

    // Close mock WebSockets
    mockWs1.close();
    mockWs2.close();
  });

  describe('Client management', () => {
    it('should add a client', () => {
      wsService.addClient('client-1', mockWs1);

      // Use private property access for testing - this is fragile but necessary
      // for unit testing without modifying the service code
      const clients = (wsService as any).clients;
      expect(clients.has('client-1')).toBe(true);
      expect(clients.size).toBe(1);
    });

    it('should remove a client', () => {
      wsService.addClient('client-1', mockWs1);
      wsService.removeClient('client-1');

      const clients = (wsService as any).clients;
      expect(clients.has('client-1')).toBe(false);
      expect(clients.size).toBe(0);
    });

    it('should handle client disconnect automatically', () => {
      wsService.addClient('client-1', mockWs1);

      // Trigger close event
      mockWs1.triggerClose();

      const clients = (wsService as any).clients;
      expect(clients.has('client-1')).toBe(false);
    });
  });

  describe('Event broadcasting', () => {
    beforeEach(() => {
      wsService.addClient('client-1', mockWs1);
      wsService.addClient('client-2', mockWs2);
    });

    it('should broadcast status change events to all clients', () => {
      const mockBot = new MockBot();
      wsService.emitBotStatusChange(mockBot, 'stopped');

      expect(mockWs1.sentMessages.length).toBe(1);
      expect(mockWs2.sentMessages.length).toBe(1);

      const message1 = mockWs1.sentMessages[0];
      expect(message1.type).toBe(BotEventType.STATUS_CHANGED);
      expect(message1.botId).toBe(mockBot.id);
      expect(message1.data.previousStatus).toBe('stopped');
      expect(message1.data.currentStatus).toBe('stopped');
    });

    it('should broadcast error events to all clients', () => {
      const error = new Error('Test error');
      wsService.emitBotError('mock-bot-id', error);

      expect(mockWs1.sentMessages.length).toBe(1);
      expect(mockWs2.sentMessages.length).toBe(1);

      const message1 = mockWs1.sentMessages[0];
      expect(message1.type).toBe(BotEventType.ERROR);
      expect(message1.botId).toBe('mock-bot-id');
      expect(message1.data.message).toBe('Test error');
    });

    it('should handle closed connections during broadcast', () => {
      // Close one client connection
      mockWs1.readyState = 3; // CLOSED

      const mockBot = new MockBot();
      wsService.emitBotStatusChange(mockBot, 'active');

      // Only the open client should receive the message
      expect(mockWs1.sentMessages.length).toBe(0);
      expect(mockWs2.sentMessages.length).toBe(1);

      // The closed client should be removed
      const clients = (wsService as any).clients;
      expect(clients.has('client-1')).toBe(false);
      expect(clients.has('client-2')).toBe(true);
    });

    it('should handle errors during message sending', () => {
      // Make the first client throw an error on send
      const originalSend = mockWs1.send;
      mockWs1.send = () => { throw new Error('Send error'); };

      const mockBot = new MockBot();
      wsService.emitBotStatusChange(mockBot, 'active');

      // The problematic client should be removed
      const clients = (wsService as any).clients;
      expect(clients.has('client-1')).toBe(false);
      expect(clients.has('client-2')).toBe(true);

      // Restore original function
      mockWs1.send = originalSend;
    });
  });

  describe('Event subscription', () => {
    it('should allow subscribing to events', () => {
      const mockCallback = jest.fn();
      wsService.subscribe(BotEventType.STATUS_CHANGED, mockCallback);

      // Get the event emitter to test
      const eventEmitter = (wsService as any).eventEmitter as EventEmitter;
      expect(eventEmitter.listenerCount(BotEventType.STATUS_CHANGED)).toBe(1);

      // Emit an event
      const mockBot = new MockBot();
      wsService.emitBotStatusChange(mockBot, 'active');

      // The callback should have been called
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        type: BotEventType.STATUS_CHANGED,
        botId: mockBot.id
      }));
    });

    it('should allow unsubscribing from events', () => {
      const mockCallback = jest.fn();
      wsService.subscribe(BotEventType.STATUS_CHANGED, mockCallback);
      wsService.unsubscribe(BotEventType.STATUS_CHANGED, mockCallback);

      // Get the event emitter to test
      const eventEmitter = (wsService as any).eventEmitter as EventEmitter;
      expect(eventEmitter.listenerCount(BotEventType.STATUS_CHANGED)).toBe(0);

      // Emit an event
      const mockBot = new MockBot();
      wsService.emitBotStatusChange(mockBot, 'active');

      // The callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});