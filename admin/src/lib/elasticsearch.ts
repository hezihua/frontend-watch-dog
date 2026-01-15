import { Client } from '@elastic/elasticsearch';

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
});
