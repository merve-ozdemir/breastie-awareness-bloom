import { createFileRoute } from '@tanstack/react-router';
import { handleSpeak } from '@/lib/speech.server';
export const Route=createFileRoute('/api/speak')({server:{handlers:{POST:({request})=>handleSpeak(request)}}});
