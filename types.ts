import { Type } from '@google/genai';

// A schema to guide the Gemini model in generating a valid n8n workflow structure.
export const N8N_WORKFLOW_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The name of the workflow.",
    },
    nodes: {
      type: Type.ARRAY,
      description: "An array of node objects that make up the workflow.",
      items: {
        type: Type.OBJECT,
        properties: {
          parameters: {
            type: Type.OBJECT,
            description: "Configuration parameters for the node. This is a complex object with dynamic keys.",
            properties: {}, // Must be present for OBJECT type, even if empty for dynamic keys.
          },
          name: {
            type: Type.STRING,
            description: "The display name of the node.",
          },
          type: {
            type: Type.STRING,
            description: "The type of the node, e.g., 'n8n-nodes-base.start'.",
          },
          typeVersion: {
            type: Type.NUMBER,
            description: "The version of the node type.",
          },
          position: {
            type: Type.ARRAY,
            description: "An array with two numbers representing the [x, y] coordinates on the canvas.",
            items: { type: Type.NUMBER },
          },
          id: {
            type: Type.STRING,
            description: "A unique identifier for the node, preferably a UUID.",
          },
        },
        required: ["parameters", "name", "type", "typeVersion", "position", "id"],
      },
    },
    connections: {
      type: Type.OBJECT,
      description: "An object describing the connections between nodes. The key is the source node ID, and the value describes the output and input connections. This object has dynamic keys.",
      properties: {}, // Must be present for OBJECT type, even if empty for dynamic keys.
    },
  },
  required: ["name", "nodes", "connections"],
};