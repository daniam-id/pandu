// filepath: src/config/index.ts
/**
 * Pandu.ai Configuration Module
 * Environment variables and Firebase initialization
 */

import dotenv from 'dotenv';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// ============ Environment Config ============

export interface AppConfig {
  port: number;
  apiKey: string;
  firebase: {
    projectId: string;
    privateKeyPath: string;
    clientEmail: string;
    storageBucket: string;
  };
  gemini: {
    apiKey: string;
    modelVersion: string;
  };
  maps: {
    apiKey: string;
  };
  corsOrigin: string;
  locationBroadcastIntervalMs: number;
  routeCacheTtlMs: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  apiKey: process.env.API_SECRET_KEY || process.env.API_KEY || '',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyPath: process.env.FIREBASE_PRIVATE_KEY_PATH || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelVersion: process.env.GEMINI_MODEL_VERSION || 'gemini-3.1-flash-lite-preview',
  },
  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  locationBroadcastIntervalMs: parseInt(process.env.LOCATION_BROADCAST_INTERVAL_MS || '15000', 10),
  routeCacheTtlMs: parseInt(process.env.ROUTE_CACHE_TTL_MS || '60000', 10),
};

// ============ Firebase Admin SDK ============

let firebaseApp: App | null = null;
let firestoreDb: Firestore | null = null;

export function initializeFirebase(): App {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  // For local development, try to load from file
  // For Cloud Run, use env vars or base64-encoded service account
  let credential: object;

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    // Cloud Run: service account passed as base64 JSON
    const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    credential = JSON.parse(decoded);
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    // Cloud Run alt: private key is passed directly
    credential = {
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    // Local development: load from file
    try {
      const fs = require('fs');
      const privateKeyPath = config.firebase.privateKeyPath;
      const serviceAccount = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
      credential = serviceAccount;
    } catch {
      throw new Error('Firebase credentials not found. Set FIREBASE_PRIVATE_KEY or provide private key file.');
    }
  }

  firebaseApp = initializeApp({
    credential: cert(credential as object),
  });

  return firebaseApp;
}

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    if (!firebaseApp) {
      initializeFirebase();
    }
    firestoreDb = getFirestore(firebaseApp!);
  firestoreDb.settings({
    ignoreUndefinedProperties: true,
    maxRetries: 3,
  });
  }
  return firestoreDb;
}

// ============ Gemini AI Client ============

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    geminiClient = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return geminiClient;
}

// ============ Validation ============

export function validateConfig(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!config.apiKey) missing.push('API_SECRET_KEY or API_KEY');
  if (!config.firebase.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
  if (!config.maps.apiKey) missing.push('GOOGLE_MAPS_API_KEY');

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 &&
      !process.env.FIREBASE_PRIVATE_KEY &&
      !config.firebase.privateKeyPath) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_PRIVATE_KEY, or FIREBASE_PRIVATE_KEY_PATH');
  }

  if (missing.length > 0) {
    logger.warn(`Environment variable berikut belum di-set: ${missing.join(', ')}`);
  }
}