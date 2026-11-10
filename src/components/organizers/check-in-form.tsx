'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { checkInAction, type CheckInActionResult } from '@/features/ticketing/check-in-actions';
import { checkInMessage } from '@/features/ticketing/check-in';

type BarcodeResult = { rawValue: string };
type BarcodeDetectorLike = { detect(source: HTMLVideoElement): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorLike;

export function CheckInForm({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<CheckInActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cameraMessage, setCameraMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => stopCamera, []);

  async function startCamera() {
    const BarcodeDetector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setCameraMessage('La cámara no está disponible. Puedes ingresar el código manualmente.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      setCameraMessage('Apunta la cámara al código QR.');
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          stopCamera();
          const formData = new FormData();
          formData.set('eventId', eventId);
          formData.set('code', codes[0].rawValue);
          startTransition(async () => setResult(await checkInAction(formData)));
          setCameraMessage('');
          return;
        }
        window.setTimeout(() => void scan(), 250);
      };
      void scan();
    } catch {
      stopCamera();
      setCameraMessage('No pudimos abrir la cámara. Puedes ingresar el código manualmente.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={(formData) => {
          formData.set('eventId', eventId);
          startTransition(async () => setResult(await checkInAction(formData)));
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label className="flex flex-1 flex-col gap-1 font-texto text-sm font-semibold">
          Código QR
          <input
            name="code"
            autoFocus
            autoComplete="off"
            inputMode="text"
            required
            className="min-h-12 rounded-md border border-borde-fuerte bg-fondo px-3 font-normal"
          />
        </label>
        <input type="hidden" name="eventId" value={eventId} />
        <button type="submit" disabled={isPending} className={cn(buttonVariants({ variant: 'compra' }), 'self-end')}>
          Validar entrada
        </button>
      </form>
      <video ref={videoRef} className="max-h-72 w-full rounded-md bg-texto" playsInline muted aria-label="Vista de cámara para escanear el QR" />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void startCamera()} className={buttonVariants({ variant: 'secundario' })}>
          Escanear con la cámara
        </button>
        {cameraActive ? <button type="button" onClick={stopCamera} className={buttonVariants({ variant: 'secundario' })}>Detener cámara</button> : null}
      </div>
      {cameraMessage ? <p role="status" className="font-texto text-sm text-texto-suave">{cameraMessage}</p> : null}
      {result ? (
        <p
          role={result.ok ? 'status' : 'alert'}
          className={cn(
            'rounded-md bg-superficie-sutil p-3 font-texto text-sm leading-6',
            result.ok && checkInMessage(result.result).tone === 'success' ? 'text-exito' : '',
            result.ok && checkInMessage(result.result).tone === 'error' ? 'text-error' : '',
          )}
        >
          {result.ok ? checkInMessage(result.result).text : result.message}
        </p>
      ) : null}
    </div>
  );
}
