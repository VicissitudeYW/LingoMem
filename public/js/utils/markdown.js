// Markdown渲染工具
// 支持常用的Markdown格式: 粗体、斜体、列表、代码等

export class MarkdownRenderer {
  /**
   * 渲染Markdown文本为HTML
   * @param {string} text - 原始Markdown文本
   * @returns {string} - 渲染后的HTML
   */
  static render(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let html = text;

    // 1. 转义HTML特殊字符(防止XSS)
    html = this.escapeHtml(html);

    // 2. 处理代码块 (```)
    html = this.renderCodeBlocks(html);

    // 3. 处理行内代码 (`)
    html = this.renderInlineCode(html);

    // 4. 处理粗体 (**** 或 __)
    html = this.renderBold(html);

    // 5. 处理斜体 (** 或 _)
    html = this.renderItalic(html);

    // 6. 处理删除线 (~~)
    html = this.renderStrikethrough(html);

    // 7. 处理有序列表
    html = this.renderOrderedList(html);

    // 8. 处理无序列表
    html = this.renderUnorderedList(html);

    // 9. 处理链接
    html = this.renderLinks(html);

    // 10. 处理换行
    html = this.renderLineBreaks(html);

    return html;
  }

  /**
   * 转义HTML特殊字符
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 渲染代码块
   */
  static renderCodeBlocks(text) {
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });
  }

  /**
   * 渲染行内代码
   */
  static renderInlineCode(text) {
    return text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  }

  /**
   * 渲染粗体
   */
  static renderBold(text) {
    // 处理 **** 和 __
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    return text;
  }

  /**
   * 渲染斜体
   */
  static renderItalic(text) {
    // 处理 ** 和 _ (但不是 __ 或 ****)
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
    return text;
  }

  /**
   * 渲染删除线
   */
  static renderStrikethrough(text) {
    return text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  /**
   * 渲染有序列表
   */
  static renderOrderedList(text) {
    // 匹配连续的有序列表项
    const lines = text.split('\n');
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\d+)\.\s+(.+)$/);

      if (match) {
        if (!inList) {
          result.push('<ol class="markdown-list">');
          inList = true;
        }
        result.push(`<li>${match[2]}</li>`);
      } else {
        if (inList) {
          result.push('</ol>');
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push('</ol>');
    }

    return result.join('\n');
  }

  /**
   * 渲染无序列表
   */
  static renderUnorderedList(text) {
    // 匹配连续的无序列表项 (-, *, +)
    const lines = text.split('\n');
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^[-*+]\s+(.+)$/);

      if (match) {
        if (!inList) {
          result.push('<ul class="markdown-list">');
          inList = true;
        }
        result.push(`<li>${match[1]}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push('</ul>');
    }

    return result.join('\n');
  }

  /**
   * 渲染链接
   */
  static renderLinks(text) {
    // [文本](URL)
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  /**
   * 渲染换行
   */
  static renderLineBreaks(text) {
    // 将单个换行符转换为<br>,但保留列表和代码块的换行
    return text.replace(/\n(?!<[uo]l|<\/[uo]l|<li|<\/li|<pre|<\/pre)/g, '<br>');
  }
}