---
id: 002
title: Phase III Chatbot Implementation Plan
stage: plan
date: 2026-02-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-phase3-chatbot
branch: 001-phase3-chatbot
user: shaik
command: /sp.plan
labels: ["phase3", "chatbot", "plan", "architecture", "integration"]
links:
  spec: specs/001-phase3-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase3-chatbot/plan.md
  - specs/001-phase3-chatbot/research.md
  - specs/001-phase3-chatbot/data-model.md
  - specs/001-phase3-chatbot/quickstart.md
  - specs/001-phase3-chatbot/contracts/openapi-chat.yaml
tests:
  - null
---

## Prompt

You have just generated the Phase III chatbot integration specification in specs/features/phase3-chatbot.md (or similar).

Now create a **detailed implementation plan / architecture blueprint** for adding the AI-powered conversational Todo chatbot feature to the existing Phase II full-stack application.

This plan MUST remain focused **only** on the integration layer described in the specification:
- Extending the database with Conversation and Message models
- Implementing the stateless POST /api/{user_id}/chat endpoint in FastAPI
- Adding and configuring OpenAI ChatKit UI in the Next.js frontend
- Wiring authentication (Better Auth JWT) for user isolation
- Ensuring fully stateless request/response cycle with DB persistence
- Handling production domain allowlist and environment variables

Do NOT include any planning, architecture, code structure, configuration or implementation details for:
- AI agents, runners, OpenAI Agents SDK setup
- MCP servers or tools
- Any natural language processing logic
- Tool calling or agent behavior

Goal: Provide a clear, incremental, production-grade blueprint that Claude Code can follow during /sp.tasks and /sp.implement to produce secure, scalable, judge-friendly integration code.

## Response snapshot

Created comprehensive implementation plan with 8 main sections:

1. **Overall Integration Architecture** - ASCII flow diagram showing ChatKit UI → FastAPI → Neon DB, key principles (stateless, DB-only state, JWT isolation)

2. **Database Extensions** - Complete SQLModel definitions for Conversation and Message models with relationships, indexes, and constraints

3. **Backend Chat Endpoint** - Full implementation outline for POST /api/{user_id}/chat with 7-step stateless flow, Pydantic schemas, error handling

4. **Authentication & Security** - Reuse of existing CurrentUser dependency, ownership enforcement patterns, security invariants

5. **Frontend ChatKit Integration** - Page component structure, ChatContainer component, chat API client, TypeScript types

6. **Production & Deployment** - Domain allowlist steps, environment variables, CORS configuration

7. **Phased Implementation Order** - 6 phases with 17 atomic tasks for /sp.tasks

8. **Quality & Verification Gates** - Type safety requirements, manual test cases (curl + browser), statelessness/isolation tests

Also generated supporting artifacts:
- research.md - Technical decisions and rationale
- data-model.md - Entity definitions with ERD
- quickstart.md - Setup and verification steps
- contracts/openapi-chat.yaml - OpenAPI 3.1 specification

## Outcome

- ✅ Impact: Complete implementation plan ready for task breakdown
- 🧪 Tests: Manual test cases defined for backend (curl) and frontend (browser)
- 📁 Files: plan.md + 4 supporting artifacts created
- 🔁 Next prompts: /sp.tasks to break into atomic implementation steps
- 🧠 Reflection: Maintained strict integration-layer scope, included detailed code outlines for implementation

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution check PASS (all gates)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
