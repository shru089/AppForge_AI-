import { generateJSON } from "../gemini";
import type { IntentOutput } from "../../types/pipeline";

const INTENT_PROMPT = (userPrompt: string) => `
You are an expert software architect. Analyze the following natural language application requirement and extract structured intent.

User Requirement:
"${userPrompt}"

Return a JSON object with EXACTLY this structure:
{
  "appType": "string (e.g. 'e-commerce', 'crm', 'saas', 'blog', 'marketplace', 'social-network', 'task-manager', 'analytics-dashboard')",
  "entities": [
    {
      "name": "EntityName",
      "description": "What this entity represents",
      "fields": [
        {
          "name": "fieldName",
          "type": "string | number | boolean | date | uuid | email | json | text",
          "required": true,
          "unique": false,
          "description": "Field purpose"
        }
      ]
    }
  ],
  "roles": ["admin", "user", "guest"],
  "features": [
    {
      "name": "Feature Name",
      "description": "What this feature does",
      "entities": ["EntityName"],
      "roles": ["admin", "user"]
    }
  ],
  "description": "Brief one-paragraph description of the app"
}

Rules:
- Every entity MUST have at minimum: id (uuid), createdAt (date), updatedAt (date)
- Extract ALL implied entities even if not explicitly mentioned
- Be thorough — include 4-10 entities for a typical SaaS
- Roles must always include at least ["admin", "user"]
- Features must cover CRUD for each entity plus business logic features
`;

export async function extractIntent(prompt: string): Promise<IntentOutput> {
  const result = await generateJSON<IntentOutput>(INTENT_PROMPT(prompt));

  // Ensure required fields exist
  const sanitized: IntentOutput = {
    appType: result.appType ?? "web-app",
    entities: Array.isArray(result.entities) ? result.entities : [],
    roles: Array.isArray(result.roles) ? result.roles : ["admin", "user"],
    features: Array.isArray(result.features) ? result.features : [],
    description: result.description,
  };

  // Ensure every entity has id, createdAt, updatedAt
  sanitized.entities = sanitized.entities.map((entity) => {
    const hasId = entity.fields.some((f) => f.name === "id");
    const hasCreatedAt = entity.fields.some((f) => f.name === "createdAt");
    const hasUpdatedAt = entity.fields.some((f) => f.name === "updatedAt");

    const baseFields = [];
    if (!hasId)
      baseFields.push({
        name: "id",
        type: "uuid",
        required: true,
        unique: true,
        description: "Primary key",
      });
    if (!hasCreatedAt)
      baseFields.push({
        name: "createdAt",
        type: "date",
        required: true,
        unique: false,
        description: "Creation timestamp",
      });
    if (!hasUpdatedAt)
      baseFields.push({
        name: "updatedAt",
        type: "date",
        required: true,
        unique: false,
        description: "Last update timestamp",
      });

    return { ...entity, fields: [...baseFields, ...entity.fields] };
  });

  return sanitized;
}
