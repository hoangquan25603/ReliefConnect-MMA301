import { http } from '@/lib/api/http'
import type { InventoryCategory } from '@/features/inventory/inventory.types'

export interface AiStatus {
  available: boolean
  provider: string
  modelVersion: string
  trainingExamples: number
  categories: string[]
  description: string
}

export interface AiAnalysis {
  category: InventoryCategory
  categoryLabel: string
  confidence: number
  probabilities: { category: string; label: string; probability: number }[]
  suggestedItems: { itemName: string; unit: string; availableQuantity: number; warehouseName: string }[]
  explanation: string
  modelVersion: string
  requiresHumanReview: boolean
}

export async function getAiStatus(): Promise<AiStatus> {
  return (await http.get<AiStatus>('/ai/status')).data
}

export async function analyzeReliefText(text: string): Promise<AiAnalysis> {
  return (await http.post<AiAnalysis>('/ai/analyze', { text })).data
}
