import { FastifyInstance } from 'fastify';
import { WebSocketService } from './websocket.service';
import { v4 as uuidv4 } from 'uuid';
import { wsConnectionSchema, botStatusUpdateSchema, subscriptionRequestSchema, unsubscriptionRequestSchema } from './websocket.schema';

/**
 * Register WebSocket routes
 */
export async function websocketRoutes(server: FastifyInstance): Promise<void> {
  const wsService = WebSocketService.getInstance();

  // WebSocket route for bot status updates
  server.get('/ws/bots', {
    websocket: true,
    schema: wsConnectionSchema
  }, (connection, request) => {
    const clientId = uuidv4();

    // Add the client to the WebSocketService
    wsService.addClient(clientId, connection);

    // Handle client messages
    connection.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from client ${clientId}:`, data);

        // You can handle specific commands from the client here
        // For example, a client might request to subscribe to specific bot updates
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    });

    // Send initial connection confirmation
    connection.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      timestamp: Date.now()
    }));
  });
}