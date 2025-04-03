import { FastifySchema } from 'fastify';

/**
 * Schema for WebSocket connection routes
 */
export const wsConnectionSchema: FastifySchema = {
  description: 'WebSocket endpoint for real-time bot status updates',
  tags: ['WebSockets'],
  summary: 'Connect to receive real-time updates about bot status changes',
  response: {
    200: {
      description: 'WebSocket connection established',
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['connection_established'] },
        clientId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'number' }
      }
    }
  }
};

/**
 * Schema for bot status update messages sent from server to client
 */
export const botStatusUpdateSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['bot_status_update'] },
    botId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['active', 'stopped', 'paused', 'error'] },
    details: {
      type: 'object',
      additionalProperties: true
    },
    timestamp: { type: 'number' }
  },
  required: ['type', 'botId', 'status', 'timestamp']
};

/**
 * Schema for subscription request messages sent from client to server
 */
export const subscriptionRequestSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['subscribe'] },
    botIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    }
  },
  required: ['type']
};

/**
 * Schema for unsubscription request messages sent from client to server
 */
export const unsubscriptionRequestSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['unsubscribe'] },
    botIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    }
  },
  required: ['type']
};