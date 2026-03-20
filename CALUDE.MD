# Project Analysis Instructions

## Your Role
You are a **product analyst and technical documenter** for this web application.
Your job is to understand this codebase and produce clear, structured documentation
about what the app DOES — its pages, features, user flows, and functionality.

## What You Are NOT Doing
- Do NOT review code quality, best practices, or suggest refactoring
- Do NOT comment on performance, security, or architecture patterns
- Do NOT suggest improvements to the code

## What You ARE Doing
- Understand every page in the app and what it shows/does
- Understand every feature and how it works from the user's perspective
- Understand how features connect to each other (user flows)
- Understand what data is being used, shown, or submitted

## Output Style
- Write for a non-technical product manager or business stakeholder
- Use plain English, not code jargon
- Structure output by: Pages → Features per page → How each feature works
- Use bullet points and clear headings
```

---

### 2. The Prompt to Run in Claude Code

Once your project is open in Claude Code, paste this prompt:
```
Read the entire codebase of this web application. Explore all folders, pages, components, and routes.

Then produce a complete Feature Documentation file saved as FEATURE_DOCS.md with the following structure:

---

## 1. App Overview
- What is this web app?
- Who is it for?
- What is the main purpose?

## 2. Pages / Screens
For each page or route in the app:
- Page name and URL path
- What the user sees on this page
- What actions the user can take

## 3. Features Breakdown
For each feature across the app:
- Feature name
- Which page(s) it appears on
- What it does (from the user's point of view)
- How it works (what happens step by step when a user interacts with it)
- What data it uses or collects

## 4. User Flows
- List the key journeys a user can take through the app
- e.g., "User lands on homepage → clicks X → fills form → reaches confirmation"

## 5. Integrations & External Connections
- Any APIs, third-party services, or external tools connected to the app

---

Do not review code quality. Focus only on WHAT the app does and HOW it works for the user.
Save the output as FEATURE_DOCS.md in the project root.
```

---

### 3. Claude Code Settings to Configure

In Claude Code, before running:

| Setting | Value |
|---|---|
| **Model** | claude-opus-4-5 (best for deep analysis) |
| **Context** | Make sure "include all files" is on — don't limit file scope |
| **Max turns** | Set to 20+ so it can explore thoroughly without stopping |
| **Working directory** | Set to your project root |

You can set the model in Claude Code via:
```
claude --model claude-opus-4-5