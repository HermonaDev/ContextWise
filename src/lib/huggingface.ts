import axios from 'axios';

const API_URL_SUMMARY = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const API_URL_NER = 'https://api-inference.huggingface.co/models/dslim/bert-base-NER';

export async function summarizeText(text: string): Promise<string> {
  console.log('HUGGINGFACE_API_KEY:', process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);
  if (!process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
    return 'Hugging Face API key is missing';
  }

  try {
    const response = await axios.post(
      API_URL_SUMMARY,
      {
        inputs: text,
        parameters: { max_length: 100, min_length: 30 },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data[0]?.summary_text) {
      return response.data[0].summary_text;
    }
    throw new Error('No summary generated');
  } catch (error) {
    console.error('Summarization error:', error);
    return 'Failed to generate summary';
  }
}

export async function extractEntities(text: string): Promise<string[]> {
  if (!process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
    return [];
  }

  try {
    const response = await axios.post(
      API_URL_NER,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && Array.isArray(response.data)) {
      // Extract unique entity words (e.g., PERSON, ORG, LOC)
      const entities = response.data
        .filter((entity: any) => ['PER', 'ORG', 'LOC'].includes(entity.entity_group))
        .map((entity: any) => entity.word.trim())
        .filter((word: string, index: number, self: string[]) => self.indexOf(word) === index);
      return entities;
    }
    return [];
  } catch (error) {
    console.error('NER error:', error);
    return [];
  }
}