'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Copy, Upload, AlertCircle, Play, Square, Mic, Download, Key, Sparkles, Volume2, ShieldCheck 
} from 'lucide-react';

interface RealMlToolsProps {
  toolId: string;
}

export default function RealMlTools({ toolId }: RealMlToolsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Helper to load external scripts dynamically ───
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  // ─── 1. OCR Document Scanner (Tesseract.js) ───
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState('');
  const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOcrImage(event.target?.result as string);
        setOcrResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const runOcr = async () => {
    if (!ocrImage) return;
    setIsLoading(true);
    setStatusMsg('Loading OCR engine...');
    setProgressPercent(10);
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      const Tesseract = (window as any).Tesseract;
      if (!Tesseract) throw new Error('Tesseract script could not be initialized.');
      
      setStatusMsg('Initializing language packs (English)...');
      setProgressPercent(30);

      const result = await Tesseract.recognize(ocrImage, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgressPercent(Math.round(30 + m.progress * 70));
            setStatusMsg(`Scanning document... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      setOcrResult(result.data.text || 'No readable text discovered.');
      setStatusMsg('OCR Scanning complete.');
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Scanning failed: ${e.message || String(e)}`);
    } finally {
      setIsLoading(false);
      setProgressPercent(0);
    }
  };

  // ─── 2. Speech Synthesis (TTS) ───
  const [ttsText, setTtsText] = useState('Welcome to Zentro. This speech is synthesized locally in your browser.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoices(list);
        if (list.length > 0 && !selectedVoice) {
          // Select English or default
          const defaultVoice = list.find(v => v.lang.includes('en')) || list[0];
          setSelectedVoice(defaultVoice.name);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const speakText = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!ttsText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(ttsText);
    if (selectedVoice) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // ─── 3. AES-256 Vault Encryption (Web Crypto API) ───
  const [aesMessage, setAesMessage] = useState('Confidential Project Files: Zentro v2 Build');
  const [aesKey, setAesKey] = useState('S3cur3P@ssw0rd!');
  const [aesCiphertext, setAesCiphertext] = useState('');
  const [aesDecrypted, setAesDecrypted] = useState('');
  const [aesErr, setAesErr] = useState('');

  // Key derivation helpers
  const getCryptoKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const handleAesEncrypt = async () => {
    setAesErr('');
    try {
      const enc = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const keyObj = await getCryptoKey(aesKey, salt);

      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as any },
        keyObj,
        enc.encode(aesMessage)
      );

      // Package: salt (16 bytes) + iv (12 bytes) + ciphertext
      const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
      buffer.set(salt, 0);
      buffer.set(iv, salt.byteLength);
      buffer.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

      // Convert to Base64
      const binaryString = Array.from(buffer).map(b => String.fromCharCode(b)).join('');
      setAesCiphertext(btoa(binaryString));
    } catch (e: any) {
      setAesErr('Encryption failed: ' + (e.message || String(e)));
    }
  };

  const handleAesDecrypt = async () => {
    setAesErr('');
    setAesDecrypted('');
    try {
      const rawBinary = atob(aesCiphertext);
      const buffer = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) {
        buffer[i] = rawBinary.charCodeAt(i);
      }

      if (buffer.length < 28) throw new Error('Invalid ciphertext format.');

      const salt = buffer.slice(0, 16);
      const iv = buffer.slice(16, 28);
      const encrypted = buffer.slice(28);

      const keyObj = await getCryptoKey(aesKey, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        keyObj,
        encrypted
      );

      const dec = new TextDecoder();
      setAesDecrypted(dec.decode(decrypted));
    } catch (e: any) {
      setAesErr('Decryption failed. Ensure the passphrase is correct.');
    }
  };

  // ─── 4. Voice Recorder Studio ───
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlobUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlobUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordDuration(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e: any) {
      console.error(e);
      alert('Could not start recording. Microphone permission is required.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  // ─── 5. EXIF Metadata Cleaner (meta-stripper) ───
  const [exifImage, setExifImage] = useState<string | null>(null);
  const [cleanedImageUrl, setCleanedImageUrl] = useState<string | null>(null);
  
  const handleExifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setExifImage(event.target?.result as string);
        setCleanedImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const stripMetadata = () => {
    if (!exifImage) return;
    setIsLoading(true);
    setStatusMsg('Processing image texture nodes...');
    
    // Draw image on a canvas to strip headers
    const img = new Image();
    img.src = exifImage;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const cleaned = canvas.toDataURL('image/jpeg', 0.9);
          setCleanedImageUrl(cleaned);
          setStatusMsg('EXIF metadata successfully stripped!');
        } else {
          setStatusMsg('Canvas context failed.');
        }
      } catch (e: any) {
        setStatusMsg('EXIF stripping failed: ' + e.message);
      } finally {
        setIsLoading(false);
      }
    };
  };

  // ─── 6. SSH Key Generator (key-generator) ───
  const [sshKeyType, setSshKeyType] = useState('rsa-2048');
  const [sshPublicKey, setSshPublicKey] = useState('');
  const [sshPrivateKey, setSshPrivateKey] = useState('');

  const generateSshKeys = async () => {
    setIsLoading(true);
    setStatusMsg('Computing asymmetric primes...');
    try {
      const isRsa = sshKeyType.startsWith('rsa');
      const bitLength = sshKeyType === 'rsa-4096' ? 4096 : 2048;

      const algorithm = isRsa
        ? {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: bitLength,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256'
          }
        : { name: 'ECDSA', namedCurve: 'P-256' };

      const keyPair = await window.crypto.subtle.generateKey(
        algorithm,
        true,
        isRsa ? ['sign', 'verify'] : ['sign', 'verify']
      );

      // Export keys
      const pubExport = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privExport = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      // Convert to Base64 PEM block helper
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      const formatPem = (b64: string, label: string) => {
        const matches = b64.match(/.{1,64}/g) || [b64];
        return `-----BEGIN ${label}-----\n${matches.join('\n')}\n-----END ${label}-----`;
      };

      const pubB64 = arrayBufferToBase64(pubExport);
      const privB64 = arrayBufferToBase64(privExport);

      setSshPublicKey(formatPem(pubB64, 'PUBLIC KEY'));
      setSshPrivateKey(formatPem(privB64, 'PRIVATE KEY'));
      setStatusMsg('SSH Keypair compiled.');
    } catch (e: any) {
      setStatusMsg('Key generation failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 7. Audio Meeting Notes (Whisper) ───
  const whisperWorkerRef = useRef<Worker | null>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcribeStatus, setTranscribeStatus] = useState('idle'); // 'idle' | 'loading' | 'progress' | 'done' | 'error'
  const [transcribePercent, setTranscribePercent] = useState(0);

  useEffect(() => {
    if (toolId === 'meeting-assistant') {
      whisperWorkerRef.current = new Worker('/ai-worker.js', { type: 'module' });
      whisperWorkerRef.current.onmessage = (e) => {
        const { status, message, progress, text, error } = e.data;
        if (status === 'loading') {
          setTranscribeStatus('loading');
          setStatusMsg(message);
        } else if (status === 'progress') {
          setTranscribeStatus('progress');
          setTranscribePercent(Math.round(progress));
          setStatusMsg(message);
        } else if (status === 'transcription_complete') {
          setTranscribeStatus('done');
          setTranscriptionText(text);
          setStatusMsg('Transcription completed successfully.');
          setIsLoading(false);
        } else if (status === 'error') {
          setTranscribeStatus('error');
          setStatusMsg('Error: ' + error);
          setIsLoading(false);
        }
      };
      return () => {
        whisperWorkerRef.current?.terminate();
      };
    }
  }, [toolId]);

  const handleTranscribeAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setStatusMsg('Parsing audio file headers...');
    setTranscribeStatus('loading');
    setTranscriptionText('');

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0); // Float32Array

      setStatusMsg('Sending audio array buffer to Whisper WASM...');
      whisperWorkerRef.current?.postMessage({
        type: 'transcribe',
        data: { audioData }
      });
    } catch (err: any) {
      console.error(err);
      setStatusMsg('Audio decoding failed: ' + (err.message || String(err)));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-slate-100">
      {statusMsg && (
        <div className="flex gap-2 p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-lg text-indigo-300 text-xs select-none">
          <AlertCircle size={15} className="shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 1. OCR SCANNER */}
      {toolId === 'doc-scanner' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI OCR Document Scanner</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Image Upload</span>
              <div className="flex items-center justify-center border border-dashed border-slate-700/80 rounded-lg p-5 bg-slate-950/40 relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleOcrUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-350 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs">Drag image or click to select</span>
                </div>
              </div>

              {ocrImage && (
                <div className="flex flex-col gap-2">
                  <span className="text-xxs text-slate-500 font-bold uppercase">Source Image Preview</span>
                  <img src={ocrImage} alt="OCR source" className="max-h-[140px] object-contain border border-slate-800 rounded-lg" />
                  <button 
                    onClick={runOcr}
                    disabled={isLoading}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {isLoading ? 'Scanning OCR...' : 'Run Scanner'}
                  </button>
                </div>
              )}

              {progressPercent > 0 && (
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Recognized Text Output</span>
              <div className="relative flex-1">
                <textarea 
                  value={ocrResult}
                  readOnly
                  rows={10}
                  placeholder="Recognized characters will print here..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none h-full min-h-[220px]"
                />
                {ocrResult && (
                  <button 
                    onClick={() => copyToClipboard(ocrResult, 'ocr')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    {copiedId === 'ocr' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEXT TO SPEECH */}
      {toolId === 'text-to-speech' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Offline Audio Synthesizer (TTS)</h3>
          <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Text Paragraph</span>
              <textarea 
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-xxs text-slate-500 font-bold uppercase block mb-1">Synthesizer Voice</span>
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs focus:outline-none font-semibold text-indigo-400"
                >
                  {voices.map((v, idx) => (
                    <option key={idx} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 self-end mt-2">
                <button 
                  onClick={speakText}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  <Volume2 size={14} /> {isSpeaking ? 'Speak Again' : 'Synthesize speech'}
                </button>
                {isSpeaking && (
                  <button 
                    onClick={stopSpeaking}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AES ENCRYPT */}
      {toolId === 'aes-encrypt' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AES-256 Vault Encryption</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Plaintext Payload</span>
              <textarea 
                value={aesMessage}
                onChange={(e) => setAesMessage(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              />
              <span className="text-xxs text-slate-400 font-bold uppercase mt-1">Passphrase Secret</span>
              <input 
                type="text"
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 focus:outline-none"
              />
              <button 
                onClick={handleAesEncrypt}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all mt-2"
              >
                Encrypt Message
              </button>
              
              {aesErr && <span className="text-xxs text-rose-400 font-semibold">{aesErr}</span>}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xxs text-slate-400 font-bold uppercase">Ciphertext Base64</span>
                <div className="relative">
                  <textarea 
                    value={aesCiphertext}
                    onChange={(e) => setAesCiphertext(e.target.value)}
                    rows={3}
                    placeholder="Encrypted Base64 characters will output here..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-500 focus:outline-none"
                  />
                  {aesCiphertext && (
                    <button 
                      onClick={() => copyToClipboard(aesCiphertext, 'cipher')}
                      className="absolute top-2.5 right-2.5 p-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                    >
                      {copiedId === 'cipher' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleAesDecrypt}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold"
                >
                  Decrypt Base64 Cipher
                </button>
              </div>

              {aesDecrypted && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/35 rounded-lg text-emerald-450 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Decrypted Payload</span>
                    <span>{aesDecrypted}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. VOICE RECORDER */}
      {toolId === 'voice-recorder' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Voice Recorder Studio</h3>
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/30 border border-slate-800 rounded-xl gap-4 min-h-[220px]">
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-rose-500 animate-pulse font-bold text-xs select-none">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  Recording audio ({recordDuration}s)...
                </div>
                <button 
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 border-4 border-slate-900"
                >
                  <Square size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs text-slate-400">Click microphone to capture voice recordings</span>
                <button 
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 border-4 border-slate-900"
                >
                  <Mic size={22} />
                </button>
              </div>
            )}

            {audioBlobUrl && (
              <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-[320px] bg-slate-950 p-4 border border-slate-850 rounded-xl">
                <span className="text-xxs text-slate-450 font-bold uppercase">Recorded Waveform</span>
                <audio src={audioBlobUrl} controls className="w-full" />
                <a 
                  href={audioBlobUrl} 
                  download="recording.webm"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-750"
                >
                  <Download size={13} /> Download webm Audio
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. EXIF STRIPPER */}
      {toolId === 'meta-stripper' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">EXIF Metadata Cleaner</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Upload JPEG/PNG</span>
              <div className="flex items-center justify-center border border-dashed border-slate-700/80 rounded-lg p-5 bg-slate-950/40 relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleExifUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-350 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs">Select target image</span>
                </div>
              </div>

              {exifImage && (
                <div className="flex flex-col gap-2">
                  <span className="text-xxs text-slate-550 font-bold uppercase">Uploaded Image</span>
                  <img src={exifImage} alt="EXIF source" className="max-h-[120px] object-contain border border-slate-800 rounded-lg" />
                  <button 
                    onClick={stripMetadata}
                    disabled={isLoading}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {isLoading ? 'Processing...' : 'Scrub EXIF Headers'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-center justify-center border border-slate-850 p-4 rounded-xl min-h-[200px] bg-slate-950/40">
              {cleanedImageUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <span className="text-xxs text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <ShieldCheck size={12} /> Metadata Sanitized
                  </span>
                  <img src={cleanedImageUrl} alt="EXIF Sanitized" className="max-h-[140px] object-contain border border-emerald-900/20 rounded-lg" />
                  <a 
                    href={cleanedImageUrl} 
                    download="sanitized_image.jpg"
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Download size={13} /> Download Sanitized Image
                  </a>
                </div>
              ) : (
                <span className="text-xs text-slate-550 italic">Sanitized output will display here.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SSH KEY GENERATOR */}
      {toolId === 'key-generator' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">SSH & GPG Keys Studio</h3>
          <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-xs font-bold text-slate-450 uppercase">
              <div className="flex-1">
                <span className="block mb-1">Select Key Algorithm</span>
                <select 
                  value={sshKeyType} 
                  onChange={(e) => setSshKeyType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs focus:outline-none font-semibold text-indigo-400"
                >
                  <option value="rsa-2048">RSA 2048-bit (Standard)</option>
                  <option value="rsa-4096">RSA 4096-bit (Extra Secure)</option>
                  <option value="ecdsa-p256">ECDSA P-256 Curve</option>
                </select>
              </div>
              <button 
                onClick={generateSshKeys}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all self-end mt-2 md:mt-0"
              >
                {isLoading ? 'Computing Primes...' : 'Generate SSH Keys'}
              </button>
            </div>

            {sshPublicKey && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xxs font-bold text-slate-450 uppercase">
                    <span>Public Key (SPKI)</span>
                    <button 
                      onClick={() => copyToClipboard(sshPublicKey, 'pub')}
                      className="text-[10px] text-indigo-400 flex items-center gap-0.5 hover:text-white transition-colors"
                    >
                      {copiedId === 'pub' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} Copy Key
                    </button>
                  </div>
                  <textarea 
                    value={sshPublicKey}
                    readOnly
                    rows={8}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-indigo-300 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xxs font-bold text-slate-450 uppercase">
                    <span>Private Key (PKCS#8)</span>
                    <button 
                      onClick={() => copyToClipboard(sshPrivateKey, 'priv')}
                      className="text-[10px] text-indigo-400 flex items-center gap-0.5 hover:text-white transition-colors"
                    >
                      {copiedId === 'priv' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} Copy Key
                    </button>
                  </div>
                  <textarea 
                    value={sshPrivateKey}
                    readOnly
                    rows={8}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-indigo-300 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 7. MEETING ASSISTANT */}
      {toolId === 'meeting-assistant' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Audio Meeting Notes (Whisper)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3 p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Upload Audio Recording (WAV/MP3/M4A)</span>
              <div className="flex items-center justify-center border border-dashed border-slate-700/80 rounded-lg p-5 bg-slate-950/40 relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="audio/*"
                  onChange={handleTranscribeAudio}
                  disabled={isLoading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-350 transition-colors">
                  <Upload size={24} />
                  <span className="text-xs">Select audio file to transcribe</span>
                </div>
              </div>

              {transcribePercent > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${transcribePercent}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Progress: {transcribePercent}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase font-mono">Transcribed Notes Output</span>
              <div className="relative flex-1">
                <textarea 
                  value={transcriptionText}
                  readOnly
                  rows={10}
                  placeholder="Whisper voice transcription will print here..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none h-full min-h-[220px]"
                />
                {transcriptionText && (
                  <button 
                    onClick={() => copyToClipboard(transcriptionText, 'transcribe')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    {copiedId === 'transcribe' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
