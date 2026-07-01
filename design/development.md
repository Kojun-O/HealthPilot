# 🌿 Health Pilot Development Standards

Version 1.0

July 1, 2026

---

# Philosophy

Build software that lasts.

Prefer long-term maintainability over short-term speed.

Every contribution should respect the Manifesto.

---

# Development Flow

Vision

↓

Architecture

↓

Issue

↓

Design

↓

Implementation

↓

Review

↓

Release

---

# Git Workflow

1. Create an Issue
2. Implement the feature
3. Test locally
4. Commit
5. Push
6. Close the Issue

No code should be written without an Issue.

---

# Code Principles

- Small files
- Single responsibility
- Clear naming
- No duplicated logic
- Readability over cleverness

---

# Project Structure

design/
Project documents

docs/
GitHub Pages

docs/js/
Application source code

assets/
Brand assets

---

# AI Principles

Health Pilot always supports:

- Built-in AI
- Replaceable AI Providers

AI providers must never be tightly coupled.

---

# Product Principles

Every feature must answer:

"Does this help today's decision?"

If not,

don't build it.

---

# Release Strategy

Small releases.

Continuous improvement.

Never stop shipping.