---
id: 001
title: Phase III Chatbot Integration Spec
stage: spec
date: 2026-02-09
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-phase3-chatbot
branch: 001-phase3-chatbot
user: shaik
command: /sp.specify
labels: ["phase3", "chatbot", "integration", "spec", "openai-chatkit"]
links:
  spec: specs/001-phase3-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase3-chatbot/spec.md
  - specs/001-phase3-chatbot/checklists/requirements.md
tests:
  - null
---

## Prompt

Create the complete **Phase III specification document** for adding an AI-powered conversational Todo chatbot to the existing full-stack Todo application (Phase II: Next.js frontend + FastAPI backend + SQLModel + Neon PostgreSQL + Better Auth).

This specification focuses exclusively on the integration layer and supporting infrastructure required for a natural-language chat interface that can manage todos. It does NOT include any definition, creation, implementation or configuration of AI agents, runners, MCP servers, or individual tools/functions.

Strict requirements enforced from the hackathon Phase III document:

- Add a stateless conversational interface that allows users to manage todos via natural language
- Frontend must use OpenAI ChatKit for the chat UI
- Backend must expose one stateless POST /api/{user_id}/chat endpoint
- Every request must be fully stateless: server fetches complete conversation history from database on each incoming message
- All conversation state (history, context) must be persisted in Neon PostgreSQL
- Reuse existing Better Auth JWT authentication → verify token and enforce user_id isolation on every chat request
- Support resuming conversations after server restarts (state lives only in DB)
- Chat endpoint must handle both new conversations and continuation of existing ones
- Response must include conversation_id, assistant text response, and any tool call metadata (if applicable)
- Frontend ChatKit integration must be properly configured for production deployment (domain allowlist required)
- All chat interactions must respect user ownership — only the authenticated user's data is accessible

Database schema extensions (add to existing Phase II schema):
- Conversation model: user_id (str), id (int PK), created_at (datetime), updated_at (datetime)
- Message model: user_id (str), id (int PK), conversation_id (int FK), role ("user" | "assistant"), content (text), created_at (datetime)

Chat API Endpoint (exact contract):
- Method: POST
- Path: /api/{user_id}/chat
- Request body:
  - conversation_id: integer (optional — if missing, create new conversation)
  - message: string (required — user's natural language input)
- Response body:
  - conversation_id: integer
  - response: string (assistant's reply text)
  - tool_calls: array (any metadata about backend actions performed)
- Always validate user_id from JWT matches the path parameter

Frontend integration requirements:
- Add a new protected route/page (e.g. /chat or /chatbot) in Next.js App Router
- Embed and configure OpenAI ChatKit UI component on that page
- Use Better Auth session to obtain user_id and JWT token
- Pass messages and conversation_id to the /api/{user_id}/chat endpoint
- Handle loading states, error display, and conversation persistence in the UI

Production deployment notes:
- Before using hosted ChatKit in production, add frontend domain(s) to OpenAI domain allowlist
- Set environment variable: NEXT_PUBLIC_OPENAI_DOMAIN_KEY

## Response snapshot

Created comprehensive Phase III specification document at `specs/001-phase3-chatbot/spec.md` with all required sections:

- Overview & Objective with clear scope boundaries
- Architecture diagram (text-based) showing ChatKit → FastAPI → Neon DB flow
- Technology additions (OpenAI ChatKit only, noting existing Phase II stack)
- Database schema extensions for Conversation and Message models
- Chat API endpoint contract (POST /api/{user_id}/chat) with request/response schemas
- 10-step stateless request/response flow
- Frontend ChatKit integration with route, component setup, domain allowlist steps
- Authentication & user isolation rules with 5 security invariants
- Environment variables (NEXT_PUBLIC_OPENAI_DOMAIN_KEY)
- 4 user stories with acceptance scenarios
- 15 functional requirements
- 7 measurable success criteria
- Deliverables listing backend/frontend files

Specification validated against quality checklist - all items passed. No [NEEDS CLARIFICATION] markers.

## Outcome

- ✅ Impact: Complete Phase III integration specification ready for planning
- 🧪 Tests: N/A - specification phase
- 📁 Files: spec.md, checklists/requirements.md created
- 🔁 Next prompts: /sp.plan to create implementation architecture
- 🧠 Reflection: Maintained strict integration-layer scope per user requirements, excluded AI agent/MCP implementation details

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Quality checklist PASS (all items)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
