import { SourceMapConsumer } from 'source-map';
import fs from 'fs/promises';
import path from 'path';

// SourceMap 文件存储目录
const SOURCEMAP_DIR = path.join(process.cwd(), '.sourcemaps');

/**
 * 确保 SourceMap 目录存在
 */
async function ensureSourceMapDir() {
  try {
    await fs.access(SOURCEMAP_DIR);
  } catch {
    await fs.mkdir(SOURCEMAP_DIR, { recursive: true });
  }
}

/**
 * 保存 SourceMap 文件
 */
export async function saveSourceMap(
  appId: string,
  filename: string,
  content: string
): Promise<void> {
  await ensureSourceMapDir();
  const appDir = path.join(SOURCEMAP_DIR, appId);
  await fs.mkdir(appDir, { recursive: true });
  
  const filepath = path.join(appDir, filename);
  await fs.writeFile(filepath, content, 'utf-8');
}

/**
 * 获取 SourceMap 文件
 */
export async function getSourceMap(
  appId: string,
  filename: string
): Promise<string | null> {
  try {
    const filepath = path.join(SOURCEMAP_DIR, appId, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

/**
 * 解析错误堆栈位置
 */
export async function parseErrorStack(
  appId: string,
  filename: string,
  line: number,
  column: number
): Promise<{
  source: string;
  line: number;
  column: number;
  name?: string;
} | null> {
  try {
    // 获取 SourceMap 文件
    const sourcemapContent = await getSourceMap(appId, `${filename}.map`);
    if (!sourcemapContent) {
      return null;
    }

    // 解析 SourceMap
    const consumer = await new SourceMapConsumer(JSON.parse(sourcemapContent));
    
    // 查找原始位置
    const originalPosition = consumer.originalPositionFor({
      line,
      column,
    });

    consumer.destroy();

    if (!originalPosition.source) {
      return null;
    }

    return {
      source: originalPosition.source,
      line: originalPosition.line || 0,
      column: originalPosition.column || 0,
      name: originalPosition.name || undefined,
    };
  } catch (error) {
    console.error('解析 SourceMap 失败:', error);
    return null;
  }
}

/**
 * 获取原始代码附近的代码行
 */
export async function getSourceContext(
  appId: string,
  filename: string,
  line: number,
  contextLines: number = 5
): Promise<{
  before: string[];
  current: string;
  after: string[];
} | null> {
  try {
    const sourcemapContent = await getSourceMap(appId, `${filename}.map`);
    if (!sourcemapContent) {
      return null;
    }

    const sourcemap = JSON.parse(sourcemapContent);
    const consumer = await new SourceMapConsumer(sourcemap);

    // 获取源代码内容
    const sources = sourcemap.sources || [];
    const sourcesContent = sourcemap.sourcesContent || [];
    
    if (sourcesContent.length === 0) {
      consumer.destroy();
      return null;
    }

    // 找到对应的源文件
    const sourceIndex = 0; // 简化处理，使用第一个源文件
    const sourceCode = sourcesContent[sourceIndex];
    
    if (!sourceCode) {
      consumer.destroy();
      return null;
    }

    const lines = sourceCode.split('\n');
    const targetLine = line - 1; // 转换为0索引

    if (targetLine < 0 || targetLine >= lines.length) {
      consumer.destroy();
      return null;
    }

    const start = Math.max(0, targetLine - contextLines);
    const end = Math.min(lines.length, targetLine + contextLines + 1);

    consumer.destroy();

    return {
      before: lines.slice(start, targetLine),
      current: lines[targetLine],
      after: lines.slice(targetLine + 1, end),
    };
  } catch (error) {
    console.error('获取源代码上下文失败:', error);
    return null;
  }
}

/**
 * 列出应用的所有 SourceMap 文件
 */
export async function listSourceMaps(appId: string): Promise<string[]> {
  try {
    const appDir = path.join(SOURCEMAP_DIR, appId);
    const files = await fs.readdir(appDir);
    return files.filter(f => f.endsWith('.map'));
  } catch {
    return [];
  }
}

/**
 * 删除 SourceMap 文件
 */
export async function deleteSourceMap(
  appId: string,
  filename: string
): Promise<boolean> {
  try {
    const filepath = path.join(SOURCEMAP_DIR, appId, filename);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}
