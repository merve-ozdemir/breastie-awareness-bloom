import { createFileRoute } from '@tanstack/react-router';
import { handleProcessExam } from '@/lib/process-exam.server';
export const Route=createFileRoute('/api/process-exam')({server:{handlers:{POST:({request})=>handleProcessExam(request)}}});
