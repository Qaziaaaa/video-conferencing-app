import { useRef, useCallback } from 'react';
import useMeetingStore from '../store/useMeetingStore';

const MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const getSupportedMime = () => MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';

export const useRecording = () => {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(() => {
    const { localStream, isRecording } = useMeetingStore.getState();
    if (isRecording || !localStream) return;

    const mimeType = getSupportedMime();
    if (!mimeType) {
      useMeetingStore.getState().setRecordingError('Recording not supported in this browser');
      return;
    }

    try {
      const recorder = new MediaRecorder(localStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const meetingId = useMeetingStore.getState().meetingId || 'unknown';
        a.download = `meetspace-recording-${meetingId}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        useMeetingStore.getState().setIsRecording(false);
      };

      recorder.onerror = () => {
        useMeetingStore.getState().setRecordingError('Recording failed');
        useMeetingStore.getState().setIsRecording(false);
      };

      recorder.start(1000);
      useMeetingStore.getState().setIsRecording(true);
      useMeetingStore.getState().setRecordingError(null);
    } catch (err) {
      useMeetingStore.getState().setRecordingError(err.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    const { isRecording } = useMeetingStore.getState();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  return { toggleRecording };
};
