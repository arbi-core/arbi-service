import { FromSchema } from "json-schema-to-ts";

// Bot response schema for Swagger
export const BotResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", description: "Unique identifier of the bot" },
    name: { type: "string", description: "Name of the bot" },
    type: { type: "string", description: "Type of the bot" },
    status: {
      type: "string",
      enum: ["active", "stopped", "paused"],
      description: "Current status of the bot"
    },
    config: {
      type: "object",
      description: "Configuration settings for the bot"
    },
    created_at: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the bot was created"
    },
    updated_at: {
      type: "string",
      format: "date-time",
      description: "Timestamp when the bot was last updated"
    }
  }
} as const;

// Bot error response schema
export const ErrorResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Error message"
    }
  }
} as const;

export const CreateBotSchema = {
  body: {
    type: "object",
    required: ["name", "type"],
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Name of the bot"
      },
      type: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Type of the bot"
      },
    },
    additionalProperties: false,
  },
  response: {
    201: BotResponseSchema,
    400: ErrorResponseSchema,
  },
  tags: ['Bots'],
  description: 'Create a new bot',
  summary: 'Creates a new bot with the given name and type'
} as const;

export type CreateBotType = FromSchema<typeof CreateBotSchema.body>;

export const UpdateBotSchema = {
  body: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Name of the bot"
      },
      type: {
        type: "string",
        minLength: 1,
        maxLength: 255,
        description: "Type of the bot"
      },
    },
    additionalProperties: false,
  },
  params: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Bot ID",
        format: "uuid"
      }
    },
    required: ["id"]
  },
  response: {
    200: BotResponseSchema,
    404: ErrorResponseSchema,
  },
  tags: ['Bots'],
  description: 'Update an existing bot',
  summary: 'Updates an existing bot by ID'
} as const;

export type UpdateBotType = FromSchema<typeof UpdateBotSchema.body>;

export const GetBotByIdSchema = {
  params: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Bot ID",
        format: "uuid"
      }
    },
    required: ["id"]
  },
  response: {
    200: BotResponseSchema,
    404: ErrorResponseSchema
  },
  tags: ['Bots'],
  description: 'Get a bot by ID',
  summary: 'Retrieves a single bot by its ID'
} as const;

export const GetAllBotsSchema = {
  response: {
    200: {
      type: "array",
      items: BotResponseSchema
    }
  },
  tags: ['Bots'],
  description: 'Get all bots',
  summary: 'Retrieves all bots in the system'
} as const;

export const DeleteBotSchema = {
  params: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Bot ID",
        format: "uuid"
      }
    },
    required: ["id"]
  },
  response: {
    204: {
      type: "null",
      description: "Bot deleted successfully"
    },
    404: ErrorResponseSchema
  },
  tags: ['Bots'],
  description: 'Delete a bot',
  summary: 'Deletes a bot by ID'
} as const;
