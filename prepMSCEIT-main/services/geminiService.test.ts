import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAssessment } from './geminiService';
import { Branch } from '../types';
import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(),
    Type: {
        OBJECT: 'OBJECT',
        ARRAY: 'ARRAY',
        STRING: 'STRING',
        NUMBER: 'NUMBER',
    },
}));

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.API_KEY = 'test-api-key';
    });

    it('should return mock data if no API key is found', async () => {
        delete process.env.API_KEY;
        const result = await generateAssessment(Branch.Perceiving);
        expect(result).toEqual([]);
    });

    it('should handle successful AI response', async () => {
        const mockGenerateContent = vi.fn().mockResolvedValue({
            text: JSON.stringify([
                {
                    scenario: 'Test Scenario',
                    type: 'MC',
                    options: [
                        { id: '1', text: 'Option 1', score: 1.0 },
                        { id: '2', text: 'Option 2', score: 0.5 },
                    ],
                },
            ]),
        });

        vi.mocked(GoogleGenAI).mockImplementation(function () {
            return {
                models: {
                    generateContent: mockGenerateContent,
                },
            } as any;
        });

        const result = await generateAssessment(Branch.Perceiving);
        expect(result).toHaveLength(1);
        expect(result[0].scenario).toBe('Test Scenario');
        expect(result[0].branch).toBe(Branch.Perceiving);
        expect(result[0].id).toContain('gen-');
    });

    it('should sanitize AI response with markdown blocks', async () => {
        const mockGenerateContent = vi.fn().mockResolvedValue({
            text: '```json\n[{"scenario": "Sanitized", "type": "MC", "options": []}]\n```',
        });

        vi.mocked(GoogleGenAI).mockImplementation(function () {
            return {
                models: {
                    generateContent: mockGenerateContent,
                },
            } as any;
        });

        const result = await generateAssessment(Branch.Understanding);
        expect(result[0].scenario).toBe('Sanitized');
    });

    it('should return empty array on failure', async () => {
        vi.mocked(GoogleGenAI).mockImplementation(function () {
            return {
                models: {
                    generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
                },
            } as any;
        });

        const result = await generateAssessment(Branch.Managing);
        expect(result).toEqual([]);
    });
});
