export const base64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export async function inscreverAparelho(usuarioId, usuarioTipo) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  try {
    await navigator.serviceWorker.register('/sw.js');
    const swRegistration = await navigator.serviceWorker.ready;
    const applicationServerKey = base64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, usuarioId, usuarioTipo })
    });
    
    return true;
  } catch (e) {
    console.error("Erro no Push:", e);
    return false;
  }
}

// Essa é a função mágica que você vai usar pelo sistema para disparar os alertas!
export async function dispararPush(usuarioId, titulo, body, url = '/') {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, titulo, body, url })
    });
  } catch (e) {
    console.error("Erro ao disparar push:", e);
  }
}