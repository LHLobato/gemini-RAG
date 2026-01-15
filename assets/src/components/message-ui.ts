import { Message } from '../types';
import { formatTime, escapeHtml } from '../utils';

export class MessageUI {
  /**
   * Format AI response text with better readability
   * Supports basic markdown and improves text structure
   */
  private static formatAIResponse(text: string): string {
    // Ensure text is a string
    if (!text || typeof text !== 'string') {
      return '<div class="text-paragraph">Unable to display message</div>';
    }

    // Escape HTML first
    let formatted = escapeHtml(text);
    
    // Convert to string if needed
    formatted = String(formatted);

    // Convert markdown-style formatting
    // Bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Inline code: `code` -> <code>code</code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert numbered lists: "1. item" -> proper list
    formatted = formatted.replace(
      /(\d+)\.\s+([^\n]+)/g,
      '<div class="list-item numbered-item"><span class="item-number">$1.</span> $2</div>'
    );

    // Convert bullet lists: "- item" or "• item" -> proper list
    formatted = formatted.replace(
      /[-•]\s+([^\n]+)/g,
      '<div class="list-item bullet-item"><span class="bullet">•</span> $1</div>'
    );

    // Convert line breaks to actual breaks for readability
    formatted = formatted.replace(/\n\n+/g, '</div><div class="text-paragraph">');
    formatted = formatted.replace(/\n/g, '<br />');

    // Wrap in paragraph divs
    formatted = `<div class="text-paragraph">${formatted}</div>`;

    // Convert code blocks: ```code``` -> <pre><code>
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<pre class="code-block"><code>$1</code></pre>'
    );

    return formatted;
  }

  static renderMessage(message: Message): HTMLElement {
    const container = document.createElement('div');
    container.className = `message ${message.sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.sender === 'user' ? 'You' : 'AI';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Ensure message.text is a string
    const messageText = String(message.text || '');
    
    // Use formatted response for AI messages, plain text for user
    if (message.sender === 'assistant') {
      content.innerHTML = this.formatAIResponse(messageText);
    } else {
      content.innerHTML = escapeHtml(messageText);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(message.time);

    wrapper.appendChild(content);
    wrapper.appendChild(time);
    container.appendChild(avatar);
    container.appendChild(wrapper);

    return container;
  }

  static renderLoadingMessage(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'message assistant';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'A';

    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    const content = document.createElement('div');
    content.className = 'message-content';

    const dots = document.createElement('div');
    dots.className = 'loading-dots';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'loading-dot';
      dots.appendChild(dot);
    }

    content.appendChild(dots);
    wrapper.appendChild(content);
    container.appendChild(avatar);
    container.appendChild(wrapper);

    return container;
  }

  static renderStatusMessage(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = `status-message ${type}`;

    const iconMap = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };

    const icon = document.createElement('span');
    icon.textContent = iconMap[type];

    const text = document.createElement('span');
    text.textContent = message;

    container.appendChild(icon);
    container.appendChild(text);

    return container;
  }
}
