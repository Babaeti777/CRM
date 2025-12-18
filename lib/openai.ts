import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function suggestDivision(
  documentText: string,
  availableDivisions: string[]
): Promise<{ division: string; confidence: number; reasoning: string }> {
  try {
    const prompt = `You are an AI assistant helping to categorize construction/project bid documents.

Available divisions: ${availableDivisions.join(', ')}

Document content:
${documentText.substring(0, 2000)}

Based on the document content, suggest the most appropriate division and provide your reasoning.

Respond in JSON format:
{
  "division": "suggested division name",
  "confidence": 0.0-1.0,
  "reasoning": "explanation for your choice"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in construction project management and bid categorization.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      division: result.division || availableDivisions[0],
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'No reasoning provided',
    }
  } catch (error) {
    console.error('Error suggesting division:', error)
    return {
      division: availableDivisions[0] || 'General',
      confidence: 0,
      reasoning: 'Error occurred during AI analysis',
    }
  }
}

export async function analyzeBidDocument(documentText: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in analyzing construction bid documents. Extract key information.',
        },
        {
          role: 'user',
          content: `Analyze this bid document and extract key information:

${documentText.substring(0, 3000)}

Provide a JSON response with:
- projectName
- bidDeadline (if mentioned)
- scopeOfWork
- keyRequirements (array)
- estimatedValue (if mentioned)`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Error analyzing document:', error)
    return null
  }
}
