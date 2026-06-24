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
        { name: "User", description: "System user", attributes: ["email", "name"] },
        { name: entityName, description: `Core ${entityName.toLowerCase()}`, attributes: ["title", "content"] }
      ],
      roles: ["admin", "user"],
      features: [
        { name: `Manage ${entityName}s`, description: `CRUD for ${entityName}`, complexity: "medium" }
      ]
    },
    systemDesign: {
      entities: [
        { name: "User", fields: ["id", "email", "createdAt", "updatedAt"] },
        { name: entityName, fields: ["id", "title", "userId", "createdAt", "updatedAt"] }
      ],
      relationships: [
        { from: "User", to: entityName, type: "1:N" }
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
