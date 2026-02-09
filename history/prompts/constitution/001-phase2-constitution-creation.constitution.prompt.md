---
id: 001
title: Phase II Constitution Creation
stage: constitution
date: 2025-02-07
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: shaik
command: /sp.constitution
labels: ["constitution", "phase2", "governance", "hackathon"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (governance document)
---

## Prompt

Create or update the project constitution.md file (in .specify/memory/ or appropriate location) with the following as the governing, immutable principles and rules for the entire project. This constitution is the foundational rulebook — every specification, plan, task, and implementation MUST adhere to it strictly. Do NOT deviate without explicit constitution update (which should be rare and justified).

Project Name: hackathon-todo-phase2
Phase: II – Full-Stack Multi-User Todo Web Application
Description: Build a secure, responsive, multi-user Todo web app from scratch (new folder, no Phase I console code carry-over). Users can sign up/sign in, manage only their own tasks via a REST API, with persistent Neon PostgreSQL storage.

Core Workflow Requirement:
Strict spec-driven development using Spec-Kit Plus commands in exact order:
1. /sp.constitution (this file — principles & non-negotiables)
2. /sp.specify (define what & why — user stories, acceptance criteria)
3. /sp.clarify (if needed — resolve ambiguities)
4. /sp.plan (how — architecture, tech choices, detailed design)
5. /sp.tasks (break into small, testable, atomic tasks)
6. /sp.implement (execute code generation per task, one at a time or batched)

Non-Negotiable Rules (these are immutable for Phase II):

1. Technology Stack (must use exactly this — no substitutions):
   - Frontend: Next.js 16+ (App Router), TypeScript, Tailwind CSS
   - Backend: Python FastAPI + SQLModel (ORM) + Pydantic
   - Database: Neon Serverless PostgreSQL
   - Authentication: Better Auth (frontend) issuing JWT tokens

2. Security & Data Isolation (critical — never violate):
   - IDOR prevention, JWT enforcement, input validation

3. API Design (exact endpoints, under /api/):
   - GET/POST/PUT/DELETE/PATCH for task CRUD

4. Database Schema (core tables):
   - users (Better Auth managed), tasks (with user_id FK)

5. Code Quality & Best Practices:
   - Type safety, clean code, error handling, atomic commits

6. Scope Limitation:
   - Phase II only: task CRUD + authentication + data persistence

7. Judging & Traceability Focus:
   - Maximize workflow visibility, docker-compose demo support

## Response snapshot

Created constitution.md v1.0.0 with 7 core principles:
- I. Technology Stack (Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL, Better Auth)
- II. Security & Data Isolation (IDOR prevention, JWT enforcement)
- III. API Design (6 endpoints for task CRUD)
- IV. Database Schema (users, tasks tables with indexes)
- V. Code Quality & Best Practices
- VI. Scope Limitation (Phase II boundaries)
- VII. Judging & Traceability Focus

Includes Development Workflow section (6-step Spec-Kit Plus flow), Monorepo Structure, and Governance rules with amendment procedure and versioning policy.

## Outcome

- Impact: Created foundational governance document for Phase II hackathon project
- Tests: N/A (governance document)
- Files: .specify/memory/constitution.md (created)
- Next prompts: /sp.specify (define authentication or task-crud feature)
- Reflection: Constitution establishes clear boundaries and non-negotiables for consistent implementation

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
