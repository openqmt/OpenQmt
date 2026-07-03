import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

/** 将 markdown 转为 HTML，用于 v-html 渲染 */
export function renderMarkdown(content: string): string {
  if (!content) return "";
  return marked.parse(content) as string;
}
