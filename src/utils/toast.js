let setToastsGlobal = null;

export function registerToastCallback(callback) {
  setToastsGlobal = callback;
  return () => {
    setToastsGlobal = null;
  };
}

export function showToast(message, type = 'info') {
  const id = Date.now();
  const newToast = { id, message, type };
  if (setToastsGlobal) {
    setToastsGlobal(prev => [...prev, newToast]);
    setTimeout(() => {
      setToastsGlobal(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }
}
