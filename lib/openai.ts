import OpenAI from 'openai'

// Make OpenAI optional - only initialize if API key is present
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function suggestDivision(
  documentText: string,
  availableDivisions: string[]
): Promise<{ division: string; confidence: number; reasoning: string }> {
  try {
    // If OpenAI not configured, return first division
    if (!openai) {
      console.warn('OpenAI API key not configured, skipping AI suggestion')
      return {
        division: availableDivisions[0] || 'General',
        confidence: 0,
        reasoning: 'OpenAI API key not configured',
      }
    }
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

