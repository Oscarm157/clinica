import { GoogleGenAI } from '@google/genai'

let genai: GoogleGenAI | null = null

export function getGenAI() {
  if (!genai) genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  return genai
}

export const IMAGE_MODEL = 'gemini-3-pro-image-preview'

/**
 * Extrae la primera imagen (base64) de una respuesta de generateContent.
 */
export function extractImage(response: {
  candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>
}): string | null {
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return part.inlineData.data
  }
  return null
}
