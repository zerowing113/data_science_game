import { useEffect, useRef, useState, type ReactNode } from 'react';

export function OfflineSession({ children }: { children: ReactNode }) {
  const [launcher, setLauncher] = useState<{ token: string; version: string }>();
  const [confirming, setConfirming] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');
  const stopButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    void fetch('/__launcher/status', { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (!controller.signal.aborted && data.app === 'little-goods' && typeof data.token === 'string' && typeof data.version === 'string') setLauncher(data);
    }).catch(() => {}).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  async function stop() {
    if (!launcher || stopping) return;
    setStopping(true);
    setError('');
    try {
      const response = await fetch('/__launcher/stop', { method: 'POST', headers: { 'X-Launcher-Token': launcher.token }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('The launcher could not stop.');
      setStopped(true);
    } catch {
      setError('Could not confirm that the game stopped. Try again, or close Little Goods in Task Manager / Activity Monitor.');
    } finally { setStopping(false); }
  }

  if (stopped) return <main className="app-shell"><h1>Game stopped. You can close this tab.</h1><p>Double-click Start Game to play again.</p></main>;
  return <>
    {launcher && <aside className="offline-banner" aria-label="Offline game controls"><span>Offline edition · {launcher.version}</span><button ref={stopButton} className="text-button" onClick={() => setConfirming(true)}>Stop game</button>
      {confirming && <div role="alertdialog" aria-label="Stop the local game"><p>Stop the game on this computer? This build does not save progress yet. Your current session will be lost.</p><button autoFocus className="secondary-button" disabled={stopping} onClick={() => { setConfirming(false); stopButton.current?.focus(); }}>Keep playing</button><button className="secondary-button" disabled={stopping} onClick={stop}>Stop and close session</button>{error && <p role="alert">{error}</p>}</div>}
    </aside>}
    {children}
  </>;
}
