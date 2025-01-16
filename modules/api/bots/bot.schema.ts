import { FromSchema } from "json-schema-to-ts";

export const CreateBotSchema = {
  type: "object",
  required: ["name", "type"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    type: { type: "string", minLength: 1, maxLength: 255 },
  },
  additionalProperties: false,
} as const;

export type CreateBotType = FromSchema<typeof CreateBotSchema>;

export const UpdateBotSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    type: { type: "string", minLength: 1, maxLength: 255 },
  },
  additionalProperties: false,
} as const;

export type UpdateBotType = FromSchema<typeof UpdateBotSchema>;
