// filepath: src/config/index.ts
/**
 * Pandu.ai Configuration Module
 * Environment variables and Firebase initialization
 */

import dotenv from 'dotenv';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  };
  gemini: {
    apiKey: string;
  };
  maps: {
    apiKey: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  apiKey: process.env.API_KEY || '',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyPath: process.env.FIREBASE_PRIVATE_KEY_PATH || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  maps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
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
  // For Cloud Run, use JSON string from env
  let credential: object;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Cloud Run: private key is passed as JSON string
    credential = {
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
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

  if (!config.apiKey) missing.push('API_KEY');
  if (!config.firebase.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
  if (!config.maps.apiKey) missing.push('GOOGLE_MAPS_API_KEY');

  if (missing.length > 0) {
    console.warn(`Warning: The following environment variables are not set: ${missing.join(', ')}`);
  }
}