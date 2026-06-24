import { generateJSON } from "../gemini";
import type {
  IntentOutput,
  SystemDesign,
  GeneratedSchemas,
} from "../../types/pipeline";

const SCHEMA_PROMPT = (
  intent: IntentOutput,
  design: SystemDesign
) => `
You are an expert full-stack architect. Generate complete UI, API, Database, and Auth schemas.

Application Intent:
${JSON.stringify(intent, null, 2)}

System Design:
${JSON.stringify(design, null, 2)}

Return a JSON object with EXACTLY this structure:
{
  "uiSchema": {
    "pages": [
      {
        "name": "PageName",
        "path": "/path",
        "auth": true,
        "roles": ["admin", "user"],
        "components": ["ComponentName"]
      }
    ],
    "components": [
      {
        "name": "ComponentName",
        "type": "Form | Table | Dashboard | Card | Input | Button | Modal | Chart",
        "entity": "EntityName",
        "fields": ["field1", "field2"],
        "props": {
          "title": "Component Title",
          "description": "Component description"
        }
      }
    ],
    "theme": {
      "primaryColor": "#7c3aed",
      "mode": "dark"
    }
  },
  "apiSchema": {
    "version": "v1",
    "middleware": ["auth", "rateLimit", "cors"],
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/v1/entities",
        "entity": "EntityName",
        "auth": true,
        "roles": ["admin", "user"],
        "description": "Get all entities"
      },
      {
        "method": "POST",
        "path": "/api/v1/entities",
        "entity": "EntityName",
        "auth": true,
        "roles": ["admin"],
        "description": "Create entity"
      }
    ]
  },
  "dbSchema": {
    "tables": [
      {
        "name": "table_name",
        "columns": [
          {
            "name": "id",
            "type": "TEXT",
            "nullable": false,
            "unique": true,
            "default": "cuid()"
          }
        ],
        "indexes": ["column_name"]
      }
    ],
    "enums": [
      {
        "name": "EnumName",
        "values": ["VALUE1", "VALUE2"]
      }
    ]
  },
  "authSchema": {
    "providers": ["google", "email"],
    "roles": ["admin", "user", "guest"],
    "strategy": "NextAuth v5",
    "sessionType": "database",
    "protectedRoutes": ["/dashboard", "/project"]
  }
}

Rules:
- Create pages: login, dashboard, and one page per main entity (list + detail)
- Every entity needs CRUD API endpoints (GET all, GET one, POST, PUT, DELETE)
- DB tables must match system design entities exactly
- Include all relationship columns (userId, projectId, etc.) in tables
`;

export async function generateSchemas(
  intent: IntentOutput,
  design: SystemDesign
): Promise<GeneratedSchemas> {
  const result = await generateJSON<GeneratedSchemas>(
    SCHEMA_PROMPT(intent, design)
  );

  return {
    uiSchema: result.uiSchema ?? { pages: [], components: [], theme: undefined },
    apiSchema: result.apiSchema ?? {
      endpoints: [],
      middleware: [],
      version: "v1",
    },
    dbSchema: result.dbSchema ?? { tables: [], enums: [] },
    authSchema: result.authSchema ?? {
      providers: ["google"],
      roles: ["admin", "user"],
      strategy: "NextAuth v5",
      sessionType: "database",
      protectedRoutes: ["/dashboard"],
    },
  };
}
