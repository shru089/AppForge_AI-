# AppForge AI: Architecture & Tradeoffs

To ensure an exceptional and highly reliable generation system, AppForge AI was designed with several deliberate architectural choices and tradeoffs. This document highlights our system thinking, execution awareness, and the strategies we use to strictly control the LLM.

## 1. Multi-Stage Pipeline Design
AppForge treats the generation process exactly like a compiler:
1. **Intent Extraction**: (Lexical parsing) We distill the user's messy natural language into a highly structured `IntentOutput` representation.
2. **System Design Layer**: (Syntax tree) We establish architectural bounds (entities, relationships, roles) before generating explicit schemas.
3. **Schema Generation**: (Bytecode generation) Using the bounded system design, we generate the API, DB, UI, and Auth schemas.
4. **Validation**: (Static typing) The schemas are strictly validated against rules (e.g. API endpoints must reference existing DB tables).
5. **Auto-Repair Engine**: (Error recovery) Rather than a brute-force retry, we send specific validation errors back to the LLM to patch localized issues.

## 2. Tradeoffs: Cost vs Quality vs Latency
- **Cost vs Quality**: We use a powerful model (`gemini-1.5-flash`) with constrained JSON decoding. While using smaller models could save costs, complex nested schemas require high reasoning capacity to avoid cross-layer mismatches.
- **Sequential vs Parallel Generation**: The first two stages (Intent and Design) must be sequential because Design heavily depends on Intent. However, during the Schema stage, we could generate the UI, API, and DB schemas in parallel. Currently, they are generated as one payload for maximum coherence, which slightly increases latency but massively reduces hallucinated mismatches. This was a deliberate tradeoff favoring Quality over Latency.

## 3. Strict Control & Deterministic Behavior
We avoid ambiguous text generation. Every prompt specifically uses `responseMimeType: "application/json"` and strict typings. 
- The schema rules are explicitly provided in the prompts (e.g. "Every entity MUST have an id, createdAt, updatedAt"). 
- We heavily enforce cross-layer consistency: The UI config fields must precisely map to the API definition.

## 4. Advanced Failure Handling (Vague Input Rejection)
LLMs tend to aggressively hallucinate if a user prompt is underspecified (e.g. "make an app"). Instead of guessing, our Intent Extractor incorporates a "Rejection Mechanism".
- If the prompt lacks actionable detail, the LLM is instructed to return `{"requiresClarification": true}`.
- The pipeline catches this and fails fast with a request for clarification, preventing wasted tokens and nonsensical outputs.

## 5. Execution Awareness
The outputs from AppForge AI aren't just theoretical documentation. They are highly structured JSON blueprints.
To prove their execution readiness:
- The system includes a **Live Preview Runtime**.
- The frontend dynamically iterates over the `GeneratedSchemas` and translates the UI configuration directly into React components on the screen.
- If the schemas were malformed or lacked execution awareness, the Preview runtime would instantly crash. By successfully rendering, we validate that the generated application is viable.

## 6. Evaluation Framework
We built an automated evaluation script (`scripts/evaluate.ts`) that runs 10 real-world scenarios and 10 extreme edge cases through the entire pipeline.
- It tracks **Latency**, **Success Rate**, **Retries (Auto-Repairs)**, and **Failure Types**.
- This proves the system is resilient against messy real-world inputs and predictably rejects contradictory edge cases.
