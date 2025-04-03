import { EventEmitter } from 'events';
import { Bot } from '../database/entities/Bot.entity';

// Define event types
export enum BotEventType {
  STATUS_CHANGED = 'bot_status_changed',
  CONFIG_UPDATED = 'bot_config_updated',
  ERROR = 'bot_error'
}

// Define event payload interface
export interface BotEvent {
  type: BotEventType;
  botId: string;
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private eventEmitter: EventEmitter;
  private clients: Map<string, any> = new Map();

  private constructor() {
    this.eventEmitter = new EventEmitter();
    // Set higher limit for event listeners
    this.eventEmitter.setMaxListeners(100);
    console.log('WebSocketService initialized as singleton');
  }

  /**
   * Get WebSocketService instance (Singleton pattern)
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Add a new WebSocket client
   * @param clientId Unique identifier for the client
   * @param socket WebSocket connection instance
   */
  addClient(clientId: string, socket: any): void {
    this.clients.set(clientId, socket);
    console.log(`Client ${clientId} connected, total clients: ${this.clients.size}`);

    // Setup disconnect handler
    socket.on('close', () => {
      this.removeClient(clientId);
    });
  }

  /**
   * Remove a WebSocket client
   * @param clientId Unique identifier for the client
   */
  removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected, remaining clients: ${this.clients.size}`);
    }
  }

  /**
   * Emit a bot status change event
   * @param bot Bot entity with updated status
   * @param previousStatus Previous bot status
   */
  emitBotStatusChange(bot: Bot, previousStatus: string): void {
    const event: BotEvent = {
      type: BotEventType.STATUS_CHANGED,
      botId: bot.id,
      data: {
        previousStatus,
        currentStatus: bot.status,
        name: bot.name,
        type: bot.type
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(BotEventType.STATUS_CHANGED, event);
    this.broadcastEvent(event);
  }

  /**
   * Emit a bot error event
   * @param botId Bot ID
   * @param error Error details
   */
  emitBotError(botId: string, error: Error): void {
    const event: BotEvent = {
      type: BotEventType.ERROR,
      botId,
      data: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: Date.now()
    };

    this.eventEmitter.emit(BotEventType.ERROR, event);
    this.broadcastEvent(event);
  }

  /**
   * Subscribe to bot events
   * @param eventType Event type to subscribe to
   * @param callback Callback function to execute when event occurs
   */
  subscribe(eventType: BotEventType, callback: (event: BotEvent) => void): void {
    this.eventEmitter.on(eventType, callback);
  }

  /**
   * Unsubscribe from bot events
   * @param eventType Event type to unsubscribe from
   * @param callback Callback function to remove
   */
  unsubscribe(eventType: BotEventType, callback: (event: BotEvent) => void): void {
    this.eventEmitter.off(eventType, callback);
  }

  /**
   * Broadcast an event to all connected clients
   * @param event Event to broadcast
   */
  private broadcastEvent(event: BotEvent): void {
    const message = JSON.stringify(event);

    this.clients.forEach((socket, clientId) => {
      try {
        // Check if socket is still open
        if (socket.readyState === 1) { // OPEN
          socket.send(message);
        } else {
          // Clean up closed connections
          this.removeClient(clientId);
        }
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    });
  }
}