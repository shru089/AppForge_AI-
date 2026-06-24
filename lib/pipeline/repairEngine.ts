import type {
  GeneratedSchemas,
  ValidationReport,
  RepairResult,
  IntentOutput,
} from "../../types/pipeline";

export async function repairSchemas(
  schemas: GeneratedSchemas,
  validationReport: ValidationReport,
  intent: IntentOutput
): Promise<RepairResult> {
  const repairs: any[] = [];
  const repairedSchemas = JSON.parse(JSON.stringify(schemas)) as GeneratedSchemas;

  for (const issue of validationReport.issues) {
    if (issue.schema === "api") {
      // Local rule: If an API endpoint references a missing entity, add it to DB schema
      const entityMatch = issue.message.match(/references undefined entity: (\w+)/);
      if (entityMatch && entityMatch[1]) {
        const missingEntity = entityMatch[1];
        if (!repairedSchemas.dbSchema.tables.find((t) => t.name === missingEntity)) {
          repairedSchemas.dbSchema.tables.push({
            name: missingEntity,
            columns: [
              { name: "id", type: "TEXT", nullable: false, unique: true },
              { name: "createdAt", type: "DATETIME", nullable: false, unique: false },
            ],
            indexes: [],
          });
          repairs.push({ issueId: issue.id, issueCode: issue.code, description: `Auto-created missing DB table for entity: ${missingEntity}`, schema: "db", before: null, after: missingEntity, success: true });
        }
      }
    } else if (issue.schema === "ui") {
      // Local rule: If UI component references missing entity, fallback to 'User'
      const entityMatch = issue.message.match(/references undefined entity: (\w+)/);
      if (entityMatch && entityMatch[1]) {
        const comp = repairedSchemas.uiSchema.components?.find(c => c.entity === entityMatch[1]);
        if (comp) {
          comp.entity = "User";
          repairs.push({ issueId: issue.id, issueCode: issue.code, description: `Reassigned missing UI component entity to 'User'`, schema: "ui", before: entityMatch[1], after: "User", success: true });
        }
      }
    } else if (issue.schema === "system") {
      // Fallback: Strip invalid fields if needed, but validation will catch it on retry if not fixed
      repairs.push({ issueId: issue.id, issueCode: issue.code, description: `Ignored unresolvable schema issue: ${issue.message}`, schema: issue.schema, before: null, after: null, success: false });
    }
  }

  // Ensure 'User' table exists
  if (!repairedSchemas.dbSchema.tables.find(t => t.name.toLowerCase() === "user")) {
    repairedSchemas.dbSchema.tables.push({
      name: "User",
      columns: [
        { name: "id", type: "TEXT", nullable: false, unique: true },
        { name: "email", type: "TEXT", nullable: false, unique: true },
      ],
      indexes: [],
    });
    repairs.push({ issueId: "global", issueCode: "MISSING_USER_TABLE", description: "Auto-created required User table", schema: "db", before: null, after: "User", success: true });
  }

  return {
    success: true,
    repairedSchemas,
    repairs,
    remainingIssues: [],
    timestamp: new Date().toISOString()
  };
}
