import { generateJSON } from "../gemini";
import type { IntentOutput, SystemDesign, GeneratedSchemas } from "../../types/pipeline";

export interface CompleteArchitecture {
  intent: IntentOutput;
  systemDesign: SystemDesign;
  schemas: GeneratedSchemas;
}

const MEGA_PROMPT = (userPrompt: string) => `
You are an expert full-stack architect. The user wants to build an application based on this requirement:
"${userPrompt}"

Analyze the intent, design the system, and generate the complete UI, API, Database, and Auth schemas.
Return a JSON object with EXACTLY this structure:

{
  "intent": {
    "requiresClarification": false,
    "appType": "string",
    "entities": [
      { "name": "string", "description": "string", "attributes": ["string"] }
    ],
    "roles": ["admin", "user"],
    "features": [
      { "name": "string", "description": "string", "complexity": "low|medium|high" }
    ]
  },
  "systemDesign": {
    "entities": [
      { "name": "string", "fields": ["id", "createdAt", "updatedAt"] }
    ],
    "relationships": [
      { "from": "string", "to": "string", "type": "1:1|1:N|N:M" }
    ],
    "workflows": [
      { "name": "string", "steps": ["string"] }
    ],
    "permissions": [
      { "role": "string", "resource": "string", "actions": ["create", "read", "update", "delete"] }
    ]
  },
  "schemas": {
    "uiSchema": {
      "pages": [{ "name": "string", "path": "string", "auth": true, "roles": ["string"], "components": ["string"] }],
      "components": [{ "name": "string", "type": "string", "entity": "string", "fields": ["string"], "props": {} }]
    },
    "apiSchema": {
      "version": "v1",
      "middleware": ["string"],
      "endpoints": [{ "method": "string", "path": "string", "entity": "string", "auth": true, "roles": ["string"], "description": "string" }]
    },
    "dbSchema": {
      "tables": [{ "name": "string", "columns": [{ "name": "string", "type": "string", "nullable": false, "unique": false }], "indexes": ["string"] }],
      "enums": [{ "name": "string", "values": ["string"] }]
    },
    "authSchema": {
      "providers": ["string"],
      "roles": ["string"],
      "strategy": "string",
      "sessionType": "database",
      "protectedRoutes": ["string"]
    }
  }
}

Rules:
- IF the prompt is completely lacking detail (e.g. "make an app"), set intent.requiresClarification to true.
- DB tables must match system design entities exactly.
- Include all relationship columns.
`;

export async function generateCompleteArchitecture(prompt: string): Promise<CompleteArchitecture> {
  return await generateJSON<CompleteArchitecture>(MEGA_PROMPT(prompt));
}
