import { DEFAULT_SEEDREAM_IMAGE_MODEL, volcanoEngineConfig, validateConfig, getHeaders } from './config';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  VolcanoEngineError 
} from './types';

type ImageGenerationOptions = {
  size?: 'adaptive' | '1K' | '2K' | '4K';
  inputImages?: string[];
  model?: string;
  watermark?: boolean;
};

export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  validateConfig();

  const model = options?.model || volcanoEngineConfig.imageModel || DEFAULT_SEEDREAM_IMAGE_MODEL;
  const size = options?.size || 'adaptive';
  const images = options?.inputImages?.filter(Boolean);

  const endpoint = volcanoEngineConfig.apiUrl.endsWith('/images/generations')
    ? volcanoEngineConfig.apiUrl
    : `${volcanoEngineConfig.apiUrl.replace(/\/$/, '')}/images/generations`;

  const request: ImageGenerationRequest = {
    model,
    prompt,
    image: images && images.length > 0 ? images : undefined,
    response_format: 'url',
    size,
    sequential_image_generation: 'disabled',
    stream: false,
    watermark: options?.watermark !== undefined ? options.watermark : true,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (response.ok) {
    return response.json();
  }

  const error = (await response.json().catch(() => null)) as VolcanoEngineError | null;
  throw new Error(`Volcano Engine API error: ${error?.error?.message || response.statusText || 'Unknown error'}`);
}

export async function generateImageFromText(
  prompt: string
): Promise<{
  url: string;
  revisedPrompt?: string;
}> {
  const response = await generateImage(prompt);
  
  if (!response.data || response.data.length === 0) {
    throw new Error('No image generated');
  }

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
}
