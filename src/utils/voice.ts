/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemSettings } from '../types';

export function announceTokenCall(
  tokenNumber: string,
  patientName: string,
  doctorName: string,
  roomNumber: string,
  settings: SystemSettings
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  const lang = settings.voiceLanguage;
  let text = '';

  // Generate language-specific speech sentences
  if (lang === 'ta-IN') {
    // Tamil speech: "அடையாள எண் [Token], [Name] தயவுசெய்து [Room]-க்கு செல்லவும்."
    // Transliterate or use Tamil characters. Standard browsers handle Tamil TTS perfectly if the voice is installed!
    text = `அடையாள எண் ${tokenNumber.split('').join(' ')}, திரு ${patientName}, தயவுசெய்து ${roomNumber}-க்கு செல்லவும்.`;
  } else if (lang === 'hi-IN') {
    // Hindi speech: "टोकन नंबर [Token], [Name], कृपया कमरा नंबर [Room] में प्रस्थान करें।"
    text = `टोकन नंबर ${tokenNumber.split('').join(' ')}, ${patientName}, कृपया ${roomNumber} में प्रस्थान करें।`;
  } else {
    // Default English: "Token number H-105, Arjun Kumar, please proceed to Room 101."
    text = `Token number ${tokenNumber.split('').join(' ')}, ${patientName}, please proceed to ${roomNumber}.`;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.volume = settings.voiceVolume;
  utterance.pitch = settings.voicePitch;
  utterance.rate = settings.voiceRate;

  // Try to find a matching voice for the language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// Helper to get available language voices
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}
