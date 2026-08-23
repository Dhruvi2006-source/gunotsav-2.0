// Shared helper and utility functions
function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function showStatus(message, isSuccess = true, duration = 3000) {
  const statusLabel = $('status');
  const progressBar = $('bar');
  if (statusLabel) {
    statusLabel.textContent = message;
    statusLabel.style.color = isSuccess ? 'var(--accent)' : '#dc2626';
  }
  if (progressBar) {
    progressBar.style.width = isSuccess ? '100%' : '50%';
    progressBar.style.backgroundColor = isSuccess ? 'var(--accent)' : '#dc2626';
    setTimeout(() => {
      progressBar.style.width = '0%';
    }, duration);
  }
  if (duration > 0) {
    setTimeout(() => {
      if (statusLabel && statusLabel.textContent === message) {
        statusLabel.textContent = '';
      }
    }, duration);
  }
}
