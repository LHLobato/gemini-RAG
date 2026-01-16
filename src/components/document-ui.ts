import { Document } from '../types';
import { formatFileSize } from '../utils';

export class DocumentUI {
  static renderDocumentItem(doc: Document, onRemove?: () => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'document-item';

    const name = document.createElement('div');
    name.className = 'document-name';
    name.textContent = `📋 ${doc.name}`;

    const meta = document.createElement('div');
    meta.className = 'document-meta';
    meta.innerHTML = `
      <strong>Size:</strong> ${formatFileSize(doc.size)}<br>
      <strong>Chunks:</strong> ${doc.chunks}<br>
      <strong>Uploaded:</strong> ${doc.uploadedAt.toLocaleTimeString()}
    `;

    const badge = document.createElement('span');
    badge.className = 'badge badge-success';
    badge.textContent = '✓ Ready';

    container.appendChild(name);
    container.appendChild(meta);
    container.appendChild(badge);

    if (onRemove) {
      const actions = document.createElement('div');
      actions.className = 'document-actions';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '🗑️ Remove';
      removeBtn.addEventListener('click', onRemove);

      actions.appendChild(removeBtn);
      container.appendChild(actions);
    }

    return container;
  }

  static renderEmptyState(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = '💬';

    const text = document.createElement('p');
    text.textContent = 'Upload a document and start asking questions!';

    container.appendChild(icon);
    container.appendChild(text);

    return container;
  }

  static renderNoDocuments(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'empty-documents';
    container.textContent = 'No documents loaded yet';

    return container;
  }
}
