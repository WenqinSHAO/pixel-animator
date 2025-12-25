/**
 * Toast notification system for non-blocking user notifications.
 */

export function showToast(msg: string, options: { timeout?: number } = {}): void {
  const { timeout = 3000 } = options;
  const container = document.getElementById('toastContainer');
  
  if (!container) {
    alert(msg);
    return;
  }
  
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  
  // Trigger visible state
  requestAnimationFrame(() => el.classList.add('visible'));
  
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 200);
  }, timeout);
}

export function notify(msg: string): void {
  showToast(msg);
}
