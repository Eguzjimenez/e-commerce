# AGENTS.md - Concre Innova Frontend

## Scope

This repository contains the frontend web application for Concre Innova.

- Main app folder: `concre_innova_website`
- Framework: React
- Usual working branch: `Allan`
- Backend API repository: `C:\Users\valve\source\repos\e-commerce-api`

## Project Rules

- Preserve the current architecture and folder structure.
- Do not rewrite the frontend from scratch.
- Keep current functionality and behavior unless the user explicitly asks for a change.
- Business logic belongs in the API. The frontend should consume API services and present results.
- Do not change routes, request payloads, response handling, or UI workflows unless required by the task.
- Acceptance criteria are not required to write code. If they exist, use them to validate behavior. If they do not exist, implement from the user story, task, bug report, current behavior, API contracts, and project context.

## Architecture

Respect the existing React structure:

- Pages handle screen-level composition and route-level behavior.
- Components handle reusable UI pieces.
- Services centralize API calls.
- Route guards and auth helpers control navigation and token-aware behavior.
- Constants and shared utilities should stay centralized when they already exist.

Do not duplicate API rules in components. The frontend may validate inputs for user experience, but final validation and authorization must happen in the API.

## Security And Roles

- Hide admin navigation from users without permission, but do not treat hidden UI as real security.
- `Administrador` should access administrative screens.
- `Cliente` should access catalog, favorites, cart, account, and purchase-related flows.
- `Vendedor` should only access explicitly allowed functionality.
- Handle `401` and `403` responses consistently.
- Do not expose backend secrets, SMTP credentials, JWT secrets, or database connection strings in frontend code.

## API Usage

- Centralize HTTP calls in services instead of calling `fetch` or `axios` directly inside many components.
- Avoid duplicate requests caused by render loops, uncontrolled effects, route changes, or repeated event listeners.
- Use dependency arrays correctly in React effects.
- Use debounce or request cancellation for live search/filter input when appropriate.
- Use pagination for catalog, admin products, users, bitacora, favorites, and similar lists when the API supports it.
- Do not reload full datasets when only one item or page changed.

## UI Quality

- Keep screens consistent with the existing design.
- Include loading, empty, success, and error states for data-driven views.
- Keep controls stable and readable on desktop and mobile.
- Do not add unnecessary landing pages for application workflows.

## Clean Code

- Use clear names that explain intent.
- Keep components focused.
- Extract repeated formatting, mapping, request, and state logic only when reuse is real.
- Avoid large nested render blocks when a small component or function improves readability.

## Validation

Before finishing frontend work:

- Run the existing frontend build command, usually from `concre_innova_website`.
- Run existing tests if present.
- If tests do not exist, run the app and manually validate affected screens when practical.
- Report any command that could not be executed.

## Git

- Work on the branch requested by the user.
- Do not revert user changes.
- Ignore unrelated local files such as `.vs/` unless the user asks to clean them.
- Before commit, check `git status`.
- Before merging to `main`, pull/rebase or merge latest `main` as requested and resolve conflicts carefully.
