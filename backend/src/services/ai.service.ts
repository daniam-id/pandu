// filepath: src/services/ai.service.ts
/**
 * AI Service - Gemini Orchestration
 * Handles system prompts, function calling, and multimodal analysis
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, FunctionDeclaration, Tool } from '@google/generative-ai';
import { config, getGeminiClient } from '../config/index.js';
import {
  ObstacleAnalysisResult,
  RerouteCourierParams,
  BatchOrdersParams,
} from '../types/index.js';

// ============ System Prompt ============

const SYSTEM_PROMPT = `You are Pandu.ai, an autonomous Agentic AI dispatcher managing urban logistics in Surabaya. 
Your primary goal is to minimize "operational drag" by continuously optimizing courier routes and dynamically responding to traffic anomalies or road obstacles.

You operate using the ReAct (Reason-Act) framework. When you receive a data update (e.g., new order, traffic alert), you must:
1. Analyze the context and courier positions.
2. Determine if the current state is optimal.
3. Call the appropriate functions (tools) to alter routes or batch orders if necessary.

STRICT RULES:
- Do not generate conversational text or pleasantries.
- Respond only with function calls or structured JSON if a decision is made.
- Prioritize courier safety and distance reduction. If an order is within a 1km radius of an active courier, attempt to batch it.`;

// ============ Vision Prompt ============

const VISION_PROMPT = `Analyze this image taken by a courier on the road in Surabaya. 
Identify any obstacles that would impede a motorcycle delivery (e.g., deep floods, fallen trees, road closures).

Output your response strictly in the following JSON format:
{
  "obstacleDetected": boolean,
  "description": "Short description of the obstacle",
  "severity": "high" | "medium" | "low",
  "requiresReroute": boolean
}

Definition of Severity:
- High: Impassable or dangerous (requires immediate reroute).
- Medium: Passable but will cause severe delays.
- Low: Minor obstacle, no reroute needed.`;

// ============ Function Calling Tools ============

const TOOLS: FunctionDeclaration[] = [
  {
    name: 'reroute_courier',
    description: 'Calculates and assigns a new route for a courier to avoid a specific location.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courierId: {
          type: SchemaType.STRING,
          description: 'The ID of the courier to reroute.',
        },
        avoidLocation: {
          type: SchemaType.STRING,
          description: 'The name or coordinates of the area to avoid (e.g., \'Jalan HR Muhammad\').',
        },
        reason: {
          type: SchemaType.STRING,
          description: 'Reason for rerouting, to be saved in the decision log.',
        },
      },
      required: ['courierId', 'avoidLocation', 'reason'],
    },
  },
  {
    name: 'batch_orders',
    description: 'Assigns a new order to an existing courier who is already nearby, instead of calling a new courier.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courierId: {
          type: SchemaType.STRING,
          description: 'The ID of the active courier.',
        },
        newOrderId: {
          type: SchemaType.STRING,
          description: 'The ID of the new order to add to their queue.',
        },
        estimatedDistanceSavedKm: {
          type: SchemaType.NUMBER,
          description: 'The estimated kilometers saved by batching.',
        },
      },
      required: ['courierId', 'newOrderId'],
    },
  },
];

// ============ AIService Class ============

export class AIService {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.client = getGeminiClient();
    // Use Gemini 1.5 Flash for function calling
    this.model = this.client.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: TOOLS }],
    });
  }

  /**
   * Analyze an obstacle image using Gemini Vision
   */
  async analyzeObstacle(imageUrl: string): Promise<ObstacleAnalysisResult> {
    try {
      // For image analysis, we use a simpler model without function calling
      const visionModel = this.client.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
      });

      const prompt = [
        { text: VISION_PROMPT },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageUrl, // In production, this would be base64 or a URL
          },
        },
      ];

      const result = await visionModel.generateContent(prompt);
      const response = result.response;

      // Parse JSON response
      const text = response.text();
      const parsed = JSON.parse(text);

      return {
        obstacleDetected: parsed.obstacleDetected ?? false,
        description: parsed.description ?? '',
        severity: parsed.severity ?? 'low',
        requiresReroute: parsed.requiresReroute ?? false,
      };
    } catch (error) {
      console.error('Error analyzing obstacle:', error);
      return {
        obstacleDetected: false,
        description: 'Failed to analyze image',
        severity: 'low',
        requiresReroute: false,
      };
    }
  }

  /**
   * Process a message with function calling enabled
   */
  async processMessage(
    message: string,
    context?: {
      couriers?: any[];
      orders?: any[];
      trafficData?: any;
    }
  ): Promise<{ text?: string; functionCalls?: any[] }> {
    try {
      // Build context for the AI
      let contextText = '';
      if (context) {
        if (context.couriers?.length) {
          contextText += `\nActive Couriers: ${JSON.stringify(context.couriers)}\n`;
        }
        if (context.orders?.length) {
          contextText += `\nPending Orders: ${JSON.stringify(context.orders)}\n`;
        }
        if (context.trafficData) {
          contextText += `\nTraffic Alert: ${JSON.stringify(context.trafficData)}\n`;
        }
      }

      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: message + (contextText ? '\n\nContext: ' + contextText : '') }],
          },
        ],
      });

      const result = await chat.sendMessage(message);
      const response = result.response;

      // Check for function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        return {
          functionCalls: response.functionCalls,
        };
      }

      return {
        text: response.text(),
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return { text: 'Error processing request' };
    }
  }

  /**
   * Execute reroute_courier function
   */
  async executeReroute(params: RerouteCourierParams): Promise<{
    success: boolean;
    newRoute?: string;
    message: string;
  }> {
    // This would integrate with Maps service
    console.log('Executing reroute:', params);
    return {
      success: true,
      newRoute: 'encoded_polyline_here',
      message: `Rerouted courier ${params.courierId} to avoid ${params.avoidLocation}`,
    };
  }

  /**
   * Execute batch_orders function
   */
  async executeBatchOrders(params: BatchOrdersParams): Promise<{
    success: boolean;
    message: string;
  }> {
    // This would integrate with Firestore service
    console.log('Executing batch orders:', params);
    return {
      success: true,
      message: `Batched order ${params.newOrderId} to courier ${params.courierId}`,
    };
  }
}

// Export singleton instance
export const aiService = new AIService();