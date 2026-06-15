export interface UsageMetric {
  label: string
  used: number
  limit: number
  unit: string
  ratio: number
}

export const USAGE_METRICS: UsageMetric[] = [
  { label: 'Fast Data Transfer', used: 0, limit: 100, unit: '$', ratio: 0 },
  { label: 'Fast Edge Transfer', used: 1, limit: 14, unit: '$', ratio: 0.07 },
  { label: 'Private Data Transfer', used: 0, limit: 0, unit: '$', ratio: 0 },
  { label: 'Edge Requests', used: 1.7, limit: 0, unit: 'k', ratio: 0.12 },
]

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  action: 'Deploy' | 'Import'
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'import',
    name: 'Import Project',
    description: 'Add a repo from any Git provider.',
    action: 'Import',
  },
  {
    id: 'nextjs',
    name: 'Next.js Boilerplate',
    description: 'Scaffolded Next.js App Router project.',
    action: 'Deploy',
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    description: 'Next.js chatbot with AI integration.',
    action: 'Deploy',
  },
  {
    id: 'express',
    name: 'Express.js',
    description: 'Node.js REST API with Express.',
    action: 'Deploy',
  },
  {
    id: 'fastapi',
    name: 'FastAPI Boilerplate',
    description: 'Deploy FastAPI applications with ease.',
    action: 'Deploy',
  },
]
