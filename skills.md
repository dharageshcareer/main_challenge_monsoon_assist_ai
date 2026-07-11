# Agent Skills & Hackathon Execution Guidelines

This document governs the operational execution, coding standards, and qualification protocols for this repository. The agent must strictly evaluate every code generation, modification, and terminal execution against these rules.

## Core Directives

### 1. High-Impact Evaluation Metrics
*   **Problem Statement Alignment:** Before generating a feature, trace it directly back to the hackathon's core problem statement. Eliminate scope creep and fluff.
*   **Code Quality:** 
    *   Maintain strict modularity and separation of concerns (keep UI components separate from business and API logic).
    *   Adhere strictly to linting rules, typed safety, clear naming conventions, and inline documentation for complex functions.

### 2. Elimination of Static/Hardcoded Elements
*   **Dynamic Data Pipelines:** Never build static frontend pages containing hardcoded tables, charts, or mock text blocks meant to simulate real app state. 
*   **State Management:** Utilize appropriate local or global state managers to bind UI components to real backend data schemas or live external services.

### 3. Live Gen AI Orchestration
*   **Real SDK Integration:** All AI features must invoke the official live Google Gen AI SDK or standard Gemini REST endpoints.
*   **Zero Hallucination Paradigm:** 
    *   Always enforce structured outputs (e.g., using Gemini's JSON schema constraints or validation tools like Pydantic).
    *   Implement fallback handlers, text sanitization, and verification pipelines to catch and gracefully retry or handle invalid AI returns before exposing them to the application UI.

### 4. Robust Testing & Code Verification
*   **No False Positives:** Write integration and end-to-end (E2E) tests that check the actual UI states and real network conditions.
*   **Assertion Integrity:** Never use empty or trivial catch blocks, placeholder assertions (`expect(true).toBe(true)`), or skipped tests. If a feature is built, its corresponding test suite must natively run and pass end-to-end in the Antigravity local environment.
*   **Chrome DevTools/Puppeteer Skills:** Use built-in accessibility (a11y) and automated auditing to verify UI flows before declaring a task complete.

### 5. Accessibility (a11y) & Security
*   **Compliance:** UI components must use correct semantic HTML tags, have appropriate ARIA attributes, ensure sufficient color contrast, and support keyboard navigation natively.
*   **Data Security:** Secure all API keys and environment variables using `.env` configurations. Never leak credentials or plaintext keys into code blocks or tracked Git repositories.
