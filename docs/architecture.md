# Architecture v2

Health Pilot is an AI-first decision-support system.

Health Score remains an internal metric for model calibration and trend interpretation.

Today's Capacity is the primary user-facing concept.

---

## System Layers

Health Pilot

├── External Inputs

├── Health Signal Processing

├── Daily Context Intake

├── Context Understanding

├── AI Thought Engine

├── Recommendation Engine

├── Mission Builder

├── Explanation Engine

└── Today UI

---

## Architecture Flow

External Inputs

↓

Health Signals

Daily Context

Calendar

Weather

History

↓

Daily Context Intake

↓

Context Understanding

↓

AI Thought Engine

↓

Daily Context Signal Extraction

↓

Recommendation Engine

↓

Mission Builder

↓

Mission Schema

↓

Explanation Engine

↓

Today's Capacity

↓

Today UI

---

## Core Philosophy

Understand first.

Think second.

Recommend third.

Explain only when asked.

---

## Daily Context Layer

Daily Context captures user-provided, non-sensor information about today's real constraints.

It is required because many high-impact decision factors cannot be inferred from wearable or passive health data.

### Required Categories

1. Physical
	- Headache
	- Ankle pain
	- Cold symptoms
	- Fatigue
	- Muscle soreness

2. Mental
	- Feeling stressed
	- Feeling motivated
	- Feeling anxious
	- Feeling calm

3. Work / Study
	- Important presentation
	- Heavy workload
	- Deadline today
	- Business trip

4. Personal / Family
	- Family event
	- Child care
	- Poor sleep because of baby
	- Social event

5. Free Notes
	- Users can write anything in natural language
	- Example: "My left ankle hurts."
	- Example: "I have an important customer presentation next week."
	- Example: "I'll probably work until 10 PM."
	- Example: "I feel much better today."

### Processing Rules

- The AI must never rely on predefined keywords only.
- Daily Context is treated as natural-language input, not as fixed tags.
- The AI Thought Engine extracts relevant signals from Daily Context before recommendation generation.
- Extracted signals are combined with health signals, calendar, weather, and history in a unified reasoning state.

---

## Product Vision

Health Pilot helps people make better decisions by understanding today's capacity, not by maximizing health metrics.
