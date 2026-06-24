import type { CompleteArchitecture } from "./megaGenerator";

export function generateDemoArchitecture(prompt: string): CompleteArchitecture {
  const isEcom = prompt.toLowerCase().includes("ecommerce") || prompt.toLowerCase().includes("shop");
  const isSocial = prompt.toLowerCase().includes("social") || prompt.toLowerCase().includes("forum");
  
  let appType = "saas";
  let entityName = "Project";
  
  if (isEcom) {
    appType = "e-commerce";
    entityName = "Product";
  } else if (isSocial) {
    appType = "social-network";
    entityName = "Post";
  }

  return {
    intent: {
      requiresClarification: false,
      appType,
      entities: [
        { name: "User", description: "System user", fields: [{ name: "email", type: "string", required: true }, { name: "name", type: "string", required: true }] },
        { name: entityName, description: `Core ${entityName.toLowerCase()}`, fields: [{ name: "title", type: "string", required: true }, { name: "content", type: "string", required: true }] }
      ],
      roles: ["admin", "user"],
      features: [
        { name: `Manage ${entityName}s`, description: `CRUD for ${entityName}` }
      ]
    },
    systemDesign: {
      entities: [
        { name: "User", fields: [{ name: "id", type: "string", required: true }, { name: "email", type: "string", required: true }, { name: "createdAt", type: "string", required: true }, { name: "updatedAt", type: "string", required: true }] },
        { name: entityName, fields: [{ name: "id", type: "string", required: true }, { name: "title", type: "string", required: true }, { name: "userId", type: "string", required: true }, { name: "createdAt", type: "string", required: true }, { name: "updatedAt", type: "string", required: true }] }
      ],
      relationships: [
        { from: "User", to: entityName, type: "one-to-many", field: "userId" }
      ],
      workflows: [],
      permissions: [
        { role: "user", resource: entityName, actions: ["read", "create"] }
      ]
    },
    schemas: {
      uiSchema: {
        pages: [
          { name: "Dashboard", path: "/dashboard", auth: true, roles: ["user", "admin"], components: [`${entityName}List`] }
        ],
        components: [
          { name: `${entityName}List`, type: "Table", entity: entityName, fields: ["title", "createdAt"], props: {} }
        ],
        theme: { primaryColor: "#3b82f6", mode: "system" }
      },
      apiSchema: {
        version: "v1",
        middleware: ["auth"],
        endpoints: [
          { method: "GET", path: `/api/v1/${entityName.toLowerCase()}s`, entity: entityName, auth: true, roles: ["user", "admin"], description: `List ${entityName}s` }
        ]
      },
      dbSchema: {
        tables: [
          { name: "User", columns: [{ name: "id", type: "TEXT", nullable: false, unique: true }], indexes: [] },
          { name: entityName, columns: [{ name: "id", type: "TEXT", nullable: false, unique: true }, { name: "title", type: "TEXT", nullable: false, unique: false }], indexes: [] }
        ],
        enums: []
      },
      authSchema: {
        providers: ["google"],
        roles: ["admin", "user"],
        strategy: "NextAuth v5",
        sessionType: "database",
        protectedRoutes: ["/dashboard"]
      }
    }
  };
}
