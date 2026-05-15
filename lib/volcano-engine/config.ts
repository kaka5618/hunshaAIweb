import { VolcanoEngineConfig } from './types';

export const volcanoEngineConfig: VolcanoEngineConfig = {
  apiKey: process.env.VOLCANO_ENGINE_API_KEY || '',
  apiUrl: process.env.VOLCANO_ENGINE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  textModel: process.env.VOLCANO_ENGINE_TEXT_MODEL || 'doubao-1-5-thinking-pro-250415',
  imageModel: process.env.VOLCANO_ENGINE_IMAGE_MODEL || process.env.SEEDREAM_MODEL || 'doubao-seededit-3-0-i2i-250628',
  videoModel: process.env.VOLCANO_ENGINE_VIDEO_MODEL || 'doubao-seedance-1-0-pro-250528',
};

export function validateConfig(): void {
  if (!volcanoEngineConfig.apiKey) {
    throw new Error('VOLCANO_ENGINE_API_KEY is not configured');
  }
  if (!volcanoEngineConfig.apiUrl) {
    throw new Error('VOLCANO_ENGINE_API_URL is not configured');
  }
}

// 获取模型配置
export function getModelConfig() {
  return {
    text: volcanoEngineConfig.textModel,
    image: volcanoEngineConfig.imageModel,
    video: volcanoEngineConfig.videoModel,
  };
}

export function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${volcanoEngineConfig.apiKey}`,
  };
}
