import axios from 'axios';

const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

export async function summarizeText(text: string): Promise<string> {
  console.log('HUGGINGFACE_API_KEY:', process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);
  if (!process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
    return 'Hugging Face API key is missing';
  }

  try {
    const response = await axios.post(
      API_URL,
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