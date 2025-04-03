# WebSocket API Usage Guide

This guide explains how to use the WebSocket API with Postman.

## WebSocket Endpoints

### Bot Status Updates

- **URL**: `/ws/bots`
- **Description**: Connect to receive real-time updates about bot status changes

## Using WebSockets in Postman

1. Open Postman and click on the "New" button
2. Select "WebSocket Request"
3. Enter the WebSocket URL: `ws://localhost:8080/ws/bots`
4. Click "Connect"

### Message Types

Once connected, you can send and receive various types of messages:

#### 1. Connection Established (Received from Server)

This message is sent by the server when your connection is established:

```json
{
  "type": "connection_established",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1616161616161
}
```

#### 2. Subscribe to Bot Updates (Send to Server)

Send this message to subscribe to updates for specific bots:

```json
{
  "type": "subscribe",
  "botIds": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

If you don't provide botIds, you'll subscribe to all bot updates.

#### 3. Unsubscribe from Bot Updates (Send to Server)

Send this message to unsubscribe from updates for specific bots:

```json
{
  "type": "unsubscribe",
  "botIds": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

#### 4. Bot Status Update (Received from Server)

This message is sent by the server when a bot's status changes:

```json
{
  "type": "bot_status_update",
  "botId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "details": {
    "cpu": 0.2,
    "memory": 120000000
  },
  "timestamp": 1616161616161
}
```

## Swagger Documentation

The WebSocket API is documented in the Swagger UI. You can access it at:

```
http://localhost:8080/documentation
```

Look for the "WebSockets" tag to see the WebSocket-related endpoints.

Note that the WebSocket message schemas are shown as fake HTTP endpoints for documentation purposes only.