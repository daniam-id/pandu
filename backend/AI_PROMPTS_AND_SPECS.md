# AI Prompts & Function Calling Specifications
**Project:** Pandu.ai
**Model:** Gemini 3.1 Flash-Lite Preview[cite: 1]
**Framework:** Google AI Studio (Node.js SDK)[cite: 1]
**Pattern:** ReAct (Reason-Act) Autonomous Agent[cite: 1]

## Overview
This document outlines the core System Prompts, Multimodal Prompts, and Function Calling (Tools) schemas used by the Pandu.ai backend. These instructions ensure the AI behaves strictly as an autonomous logistics manager without generating conversational fluff.

---

## 1. Core System Prompt (Dispatcher Persona)
This prompt is initialized when the backend connects to the Gemini model. It defines the agent's identity and operational boundaries.

**Role:** `system`
**Prompt:**
> You are Pandu.ai, an autonomous Agentic AI dispatcher managing urban logistics in Surabaya. 
> Your primary goal is to minimize "operational drag" by continuously optimizing courier routes and dynamically responding to traffic anomalies or road obstacles.
> 
> You operate using the ReAct (Reason-Act) framework. When you receive a data update (e.g., new order, traffic alert), you must:
> 1. Analyze the context and courier positions.
> 2. Determine if the current state is optimal.
> 3. Call the appropriate functions (tools) to alter routes or batch orders if necessary.
> 
> STRICT RULES:
> - Do not generate conversational text or pleasantries.
> - Respond only with function calls or structured JSON if a decision is made.
> - Prioritize courier safety and distance reduction. If an order is within a 1km radius of an active courier, attempt to batch it.

---

## 2. Multimodal Vision Prompt (Obstacle Analysis)
This prompt is used when a courier uploads an image of a road obstacle (e.g., floods, accidents)[cite: 1]. It is sent alongside the image payload.

**Role:** `user`
**Inputs:** `[Image Payload]` + `[Text Prompt]`
**Prompt:**
> Analyze this image taken by a courier on the road in Surabaya. 
> Identify any obstacles that would impede a motorcycle delivery (e.g., deep floods, fallen trees, road closures).
> 
> Output your response strictly in the following JSON format:
> {
>   "obstacleDetected": boolean,
>   "description": "Short description of the obstacle",
>   "severity": "high" | "medium" | "low",
>   "requiresReroute": boolean
> }
> 
> Definition of Severity:
> - High: Impassable or dangerous (requires immediate reroute).
> - Medium: Passable but will cause severe delays.
> - Low: Minor obstacle, no reroute needed.

---

## 3. Function Calling Definitions (Tools)
These are the JSON schemas provided to the Gemini model, allowing it to trigger backend Node.js functions[cite: 1].

### Tool A: `reroute_courier`
Used when the AI decides a courier needs a new path due to traffic or obstacles.
```json
{
  "name": "reroute_courier",
  "description": "Calculates and assigns a new route for a courier to avoid a specific location.",
  "parameters": {
    "type": "object",
    "properties": {
      "courierId": {
        "type": "string",
        "description": "The ID of the courier to reroute."
      },
      "avoidLocation": {
        "type": "string",
        "description": "The name or coordinates of the area to avoid (e.g., 'Jalan HR Muhammad')."
      },
      "reason": {
        "type": "string",
        "description": "Reason for rerouting, to be saved in the decision log."
      }
    },
    "required": ["courierId", "avoidLocation", "reason"]
  }
}
```

### Tool B: `batch_orders`
Used when the AI detects multiple orders in close proximity and decides to assign them to a single courier[cite: 1].
```json
{
  "name": "batch_orders",
  "description": "Assigns a new order to an existing courier who is already nearby, instead of calling a new courier.",
  "parameters": {
    "type": "object",
    "properties": {
      "courierId": {
        "type": "string",
        "description": "The ID of the active courier."
      },
      "newOrderId": {
        "type": "string",
        "description": "The ID of the new order to add to their queue."
      },
      "estimatedDistanceSavedKm": {
        "type": "number",
        "description": "The estimated kilometers saved by batching."
      }
    },
    "required": ["courierId", "newOrderId"]
  }
}