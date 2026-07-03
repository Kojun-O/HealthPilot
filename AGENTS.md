# AGENTS.md

# Health Pilot AI Development Guide

This document defines the development rules for all AI coding agents working on Health Pilot.

---

# Mission

Build the simplest AI Health Copilot.

Health Pilot is not a dashboard.

Health Pilot is a decision-support product.

Its purpose is to reduce cognitive load by transforming health data into one clear daily action.

---

# Core Principles

## Reduce cognition.

Process more information.

Show less information.

---

## Action first.

Always prioritize today's action.

Never prioritize today's data.

---

## People decide.

AI recommends.

Humans decide.

Never remove user autonomy.

---

# Mission First

Every Home screen must answer one question:

> What should I do today?

Mission

↓

Reason

↓

Data

Never reverse this order.

---

# UI Rules

Mission is always the largest component.

Health Score supports the Mission.

AI Comment provides context.

Why is collapsed by default.

Avoid unnecessary cards.

Avoid dashboards.

Avoid charts.

---

# Coding Principles

Keep architecture simple.

Refactor before adding complexity.

Prefer readability over cleverness.

Do not introduce frameworks unless explicitly requested.

Avoid duplicate rendering logic.

Avoid duplicated UI text.

---

# Design Philosophy

Calm.

Minimal.

Confident.

Whitespace is part of the design.

---

# Review Checklist

Before considering a task complete, verify:

- Mission First
- One Mission only
- No duplicated information
- Minimal UI
- Accessible
- Maintainable
- Matches README

---

# Product Rules

Health Pilot is not a health tracker.

Health Pilot is not a dashboard.

Health Pilot is not a medical device.

Health Pilot is an AI Health Copilot.

Its purpose is to recommend the single most valuable health action for today.

---

# Decision Rules

When multiple implementation options exist:

1. Reduce cognitive load.
2. Prefer simplicity.
3. Preserve Mission First.
4. Avoid adding UI unless it clearly improves decision making.

---

# Architecture Rules

Business logic should remain independent from UI.

Mission generation should be isolated from rendering.

Future AI providers should be replaceable without changing UI.

Keep modules loosely coupled.