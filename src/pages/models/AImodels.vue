<script setup lang="ts">
import { ref, computed, nextTick } from "vue";

type MessageType = "user" | "assistant" | "error";

interface ChatMessage {
  id: number;
  type: MessageType;
  audioUrl?: string;
  text?: string;
  model?: string;
  timestamp: string;
}

// --- States ---
const selectedAPI = ref<"muhammadjon" | "saidalo">("muhammadjon");
const selectedModel = ref<"gemini" | "elevenlabs" | "groq">("gemini");

const isRecording = ref(false);
const audioBlob = ref<Blob | null>(null);
const uploadedFile = ref<File | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const messages = ref<ChatMessage[]>([]);

const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const chatContainer = ref<HTMLDivElement | null>(null);

// --- Computed ---
const audioUrl = computed(() => {
  if (audioBlob.value) return URL.createObjectURL(audioBlob.value);
  if (uploadedFile.value) return URL.createObjectURL(uploadedFile.value);
  return null;
});

const hasAudio = computed(
  () => audioBlob.value !== null || uploadedFile.value !== null
);

// --- Scroll ---
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// --- Recording ---
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks.value = [];
    mediaRecorder.value = new MediaRecorder(stream);

    mediaRecorder.value.ondataavailable = (e) => {
      audioChunks.value.push(e.data);
    };

    mediaRecorder.value.onstop = () => {
      audioBlob.value = new Blob(audioChunks.value, { type: "audio/wav" });
      uploadedFile.value = null;
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.value.start();
    isRecording.value = true;
    error.value = null;
  } catch {
    error.value = "Microphone access denied.";
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
  }
};

// --- Upload Audio ---
const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const allowedExt = ["mp3", "m4a", "ogg", "wav"];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedExt.includes(ext)) {
    error.value = "Invalid audio file format.";
    return;
  }

  uploadedFile.value = file;
  audioBlob.value = null;
  error.value = null;
};

// --- Remove audio and reset ---
const removeAudio = () => {
  audioBlob.value = null;
  uploadedFile.value = null;
  error.value = null;

  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  if (fileInput) fileInput.value = "";
};

const muhammadjonRequest = async (body: FormData) => {
  const request = await fetch(
    "https://710b5c68b77c.ngrok-free.app/api/v1/transcribe",
    {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      body: body,
    }
  );
  return request;
};

const saidaloRequest = async (body: FormData) => {
  const request = await fetch("http://192.168.20.36:8080/api/voice/upload", {
    method: "POST",
    body: body,
  });
  return request;
};

// --- Send To API ---
const sendToAPI = async () => {
  const fileToSend = audioBlob.value || uploadedFile.value;
  if (!fileToSend) return;

  messages.value.push({
    id: Date.now(),
    type: "user",
    audioUrl: URL.createObjectURL(fileToSend),
    model: selectedModel.value,
    timestamp: new Date().toLocaleTimeString(),
  });

  scrollToBottom();
  isLoading.value = true;

  const formData = new FormData();
  formData.append("file", fileToSend, "audio.wav");
  formData.append("model", selectedModel.value);

  try {
    let response: Response;

    // Choose API based on selected person
    if (selectedAPI.value === "muhammadjon") {
      response = await muhammadjonRequest(formData);
    } else {
      response = await saidaloRequest(formData);
    }

    if (!response.ok) throw new Error(`API error ${response.status}`);

    const result = await response.json();

    messages.value.push({
      id: Date.now() + 1,
      type: "assistant",
      text: result.text || result.transcription || "",
      timestamp: new Date().toLocaleTimeString(),
    });

    scrollToBottom();
  } catch (err: any) {
    messages.value.push({
      id: Date.now() + 1,
      type: "error",
      text: err.message,
      timestamp: new Date().toLocaleTimeString(),
    });
  } finally {
    isLoading.value = false;
    removeAudio();
  }
};

// --- Clear chat ---
const clearChat = () => {
  messages.value = [];
  removeAudio();
  error.value = null;
};
</script>
<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Header -->
    <div class="bg-base-100 shadow p-4">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold">Voice Transcription Chat</h1>
        <div class="flex justify-end gap-2">
          <!-- API Selection -->
          <div>
            <label class="text-xs mb-1">Select API</label>
            <select
              v-model="selectedAPI"
              class="select select-bordered w-full mb-3"
            >
              <option value="muhammadjon">Muhammadjon</option>
              <option value="saidalo">Saidalo</option>
            </select>
          </div>

          <!-- Model Selection -->
          <div>
            <label class="text-xs mb-1">Select Model</label>
            <select
              v-model="selectedModel"
              class="select select-bordered w-full mb-3"
            >
              <option value="gemini">Gemini</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="groq">Groq</option>
            </select>
          </div>
        </div>
        <button
          v-if="messages.length"
          class="btn btn-sm btn-ghost"
          @click="clearChat"
        >
          Clear Chat
        </button>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 overflow-hidden">
      <div class="max-w-4xl mx-auto p-4 h-full flex flex-col">
        <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-4">
          <!-- Empty State -->
          <div
            v-if="messages.length === 0"
            class="flex items-center justify-center h-full text-base-content/50 mb-4"
          >
            No messages yet
          </div>

          <!-- Messages -->
          <div
            v-for="m in messages"
            :key="m.id"
            :class="[
              'flex',
              m.type === 'user' ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'max-w-lg rounded-lg p-4',
                m.type === 'user'
                  ? 'bg-primary text-primary-content'
                  : m.type === 'assistant'
                  ? 'bg-base-100 shadow'
                  : 'bg-error text-error-content',
              ]"
            >
              <!-- User -->
              <div v-if="m.type === 'user'">
                <div class="font-semibold mb-1">You · {{ m.model }}</div>
                <audio controls :src="m.audioUrl" class="w-full" />
              </div>

              <!-- Assistant -->
              <div v-if="m.type === 'assistant'">
                <strong>Transcription:</strong>
                <p class="mt-1 whitespace-pre-wrap">{{ m.text }}</p>
              </div>

              <!-- Error -->
              <div v-if="m.type === 'error'">
                <strong>Error:</strong>
                <p>{{ m.text }}</p>
              </div>

              <div class="text-xs opacity-60 mt-1">{{ m.timestamp }}</div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex justify-start">
            <div
              class="bg-base-100 shadow rounded-lg p-3 flex items-center gap-2"
            >
              <span class="loading loading-dots"></span> Transcribing...
            </div>
          </div>
        </div>

        <!-- Input Controls -->
        <div class="bg-base-100 p-4 shadow rounded-lg fixed bottom-2 right-0">
          <!-- Preview + Remove -->
          <div v-if="audioUrl" class="mb-3">
            <audio controls :src="audioUrl" class="w-full mb-2" />
            <button class="btn btn-sm btn-error w-full" @click="removeAudio">
              Remove Audio
            </button>
          </div>

          <!-- Buttons Row -->
          <div class="flex gap-2 items-center">
            <!-- Upload -->
            <label class="btn btn-square btn-ghost">
              <input
                id="fileInput"
                type="file"
                class="hidden"
                accept=".mp3,.m4a,.ogg,.wav"
                @change="handleFileUpload"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
            </label>

            <!-- Record -->
            <button
              v-if="!isRecording && !hasAudio"
              class="btn btn-circle btn-primary"
              @click="startRecording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                ></path>
              </svg>
            </button>

            <button
              v-if="isRecording"
              class="btn btn-circle btn-error animate-pulse"
              @click="stopRecording"
            >
              ⬛
            </button>

            <!-- Send -->
            <button
              v-if="hasAudio"
              class="btn btn-primary flex-1"
              @click="sendToAPI"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
