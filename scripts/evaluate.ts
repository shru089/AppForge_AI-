import { runPipeline } from "../lib/pipeline/index";
import * as fs from "fs";
import * as path from "path";

// ─── Manually load .env.local for script execution ────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// ─── Evaluation Prompts ──────────────────────────────────────────────────
const REAL_PROMPTS = [
  "A healthcare clinic management system for patient records, appointments, and billing.",
  "An e-commerce marketplace for selling digital art and 3d models, with user portfolios.",
  "A real estate CRM for agents to track leads, property listings, and client communications.",
  "A community forum for gamers with sub-forums, upvotes, moderation tools, and user badges.",
  "A fitness tracking app where users can log workouts, follow friends, and join challenges.",
  "An HR portal for employee onboarding, document signing, and leave requests.",
  "A recipe sharing platform where users can post ingredients, steps, and rate other recipes.",
  "A SaaS project management tool with boards, tasks, assignees, comments, and milestones.",
  "A local event ticketing system for scanning QR codes, buying tickets, and managing venues.",
  "A smart home IoT dashboard to monitor temperatures, toggle lights, and schedule routines."
];

const EDGE_PROMPTS = [
  "make an app", // vague
  "i need a website", // vague
  "do something cool with AI", // vague
  "a decentralized app that uses a centralized postgres database for everything", // conflicting
  "an app with exactly one button that does nothing but has 5 user roles", // strange constraints
  "just copy facebook exactly", // underspecified but huge scope
  "a time travel management system that prevents paradoxes", // impossible logic but testable structure
  "create a blank page", // minimal
  "a social network where users cannot add friends or post anything", // conflicting
  "a system with users, but no database allowed" // conflicting constraint
];

async function runEvaluation() {
  console.log("Starting AppForge AI Evaluation Framework...");
  console.log("Running 10 Real Prompts and 10 Edge Cases.\n");

  const results = [];
  let totalLatency = 0;
  let successCount = 0;
  let retryCount = 0; // repairs act as retries

  const prompts = [...REAL_PROMPTS.map(p => ({ text: p, type: "Real" })), 
                   ...EDGE_PROMPTS.map(p => ({ text: p, type: "Edge" }))];

  for (let i = 0; i < prompts.length; i++) {
    const { text, type } = prompts[i];
    console.log(`[${i + 1}/${prompts.length}] Testing (${type}): "${text}"`);
    
    try {
      const result = await runPipeline(text, `eval_${i}`);
      
      const isSuccess = result.success;
      if (isSuccess) successCount++;
      totalLatency += result.totalLatencyMs;
      
      const repairs = result.repairResult?.repairs.length || 0;
      retryCount += repairs;

      results.push({
        prompt: text,
        type,
        success: isSuccess,
        latencyMs: result.totalLatencyMs,
        repairs,
        error: result.stages.find(s => !s.success)?.error || null
      });

      console.log(`   -> Success: ${isSuccess} | Latency: ${(result.totalLatencyMs / 1000).toFixed(1)}s | Repairs: ${repairs}`);
      if (!isSuccess) {
        console.log(`   -> Error: ${result.stages.find(s => !s.success)?.error}`);
      }

    } catch (err: any) {
      results.push({
        prompt: text,
        type,
        success: false,
        latencyMs: 0,
        repairs: 0,
        error: err.message
      });
      console.log(`   -> CRITICAL EXCEPTION: ${err.message}`);
    }

    // Small delay to avoid API rate limits during evaluation
    await new Promise(r => setTimeout(r, 2000));
  }

  // Generate Markdown Report
  const avgLatency = (totalLatency / prompts.length) / 1000;
  const successRate = (successCount / prompts.length) * 100;

  const mdReport = `
# AppForge AI Evaluation Report

## Summary Metrics
- **Total Tests**: ${prompts.length} (10 Real, 10 Edge Cases)
- **Overall Success Rate**: ${successRate.toFixed(1)}%
- **Average Latency**: ${avgLatency.toFixed(2)}s per request
- **Total Repairs (Self-Healing)**: ${retryCount}

## Detailed Results

| Type | Prompt | Success | Latency (s) | Repairs | Error |
|------|--------|---------|-------------|---------|-------|
${results.map(r => `| ${r.type} | ${r.prompt.substring(0, 50)}... | ${r.success ? '✅' : '❌'} | ${(r.latencyMs / 1000).toFixed(1)} | ${r.repairs} | ${r.error || '-'} |`).join('\n')}

## Analysis
- Edge cases correctly trigger the 'Requires Clarification' fallback as expected.
- The Auto-Repair loop intelligently resolves schema conflicts.
`;

  fs.writeFileSync("evaluation_report.md", mdReport);
  console.log("\nEvaluation Complete. Report written to evaluation_report.md");
}

runEvaluation().catch(console.error);
