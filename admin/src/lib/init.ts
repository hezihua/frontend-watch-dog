import { initElasticsearchIndex } from '@/lib/elasticsearch';

// 初始化 Elasticsearch
initElasticsearchIndex().catch((error) => {
  console.error('Failed to initialize Elasticsearch:', error);
});

export {}; // 确保这是一个模块
