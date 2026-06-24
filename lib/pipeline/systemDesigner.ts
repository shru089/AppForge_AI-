import { generateJSON } from "../gemini";
import type { IntentOutput, SystemDesign } from "../../types/pipeline";

const DESIGN_PROMPT = (intent: IntentOutput) => `
You are an expert software architect. Based on the extracted application intent below, generate a comprehensive system design.

Intent:
${JSON.stringify(intent, null, 2)}

Return a JSON object with EXACTLY this structure:
{
  "entities": [
    {
      "name": "EntityName",
      "description": "Purpose of this entity",
      "fields": [
        {
          "name": "fieldName",
          "type": "String | Int | Float | Boolean | DateTime | Json",
          "required": true,
          "unique": false,
          "description": "Field purpose"
        }
      ],
      "indexes": ["fieldName"]
    }
  ],
  "relationships": [
    {
      "from": "EntityA",
      "to": "EntityB",
      "type": "one-to-many",
      "field": "entityBs",
      "description": "EntityA has many EntityBs"
    }
  ],
  "workflows": [
    {
      "name": "WorkflowName",
      "description": "What this workflow accomplishes",
      "roles": ["admin", "user"],
      "steps": [
        {
          "order": 1,
          "action": "Action description",
          "actor": "user",
          "entity": "EntityName"
        }
      ]
    }
  ],
  "permissions": [
    {
      "role": "admin",
      "resource": "EntityName",
      "actions": ["create", "read", "update", "delete"]
    },
    {
      "role": "user",
      "resource": "EntityName",
      "actions": ["read", "update"]
    }
  ]
}

Rules:
- Map all entities from intent to proper DB-compatible types (String, Int, Float, Boolean, DateTime, Json)
- All entities need: id (String @id @default(cuid())), createdAt (DateTime), updatedAt (DateTime)
- Design realistic relationships (User owns many Projects, etc.)
- Permissions must cover every entity for every role
- Workflows must reflect real business processes
- Include 3-8 workflows for a typical app
`;

export async function designSystem(
  intent: IntentOutput
): Promise<SystemDesign> {
  const result = await generateJSON<SystemDesign>(DESIGN_PROMPT(intent));

  return {
    entities: Array.isArray(result.entities) ? result.entities : [],
    relationships: Array.isArray(result.relationships)
      ? result.relationships
      : [],
    workflows: Array.isArray(result.workflows) ? result.workflows : [],
    permissions: Array.isArray(result.permissions) ? result.permissions : [],
  };
}
