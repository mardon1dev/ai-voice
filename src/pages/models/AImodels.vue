<script setup>
import { ref, computed, nextTick } from "vue";

const isRecording = ref(false);
const audioBlob = ref(null);
const uploadedFile = ref(null);
const isLoading = ref(false);
const error = ref(null);
const selectedModel = ref("gemini");
const messages = ref([]);

const mediaRecorder = ref(null);
const audioChunks = ref([]);
const chatContainer = ref(null);

const audioUrl = computed(() => {
  if (audioBlob.value) {
    return URL.createObjectURL(audioBlob.value);
  } else if (uploadedFile.value) {
    return URL.createObjectURL(uploadedFile.value);
  }
  return null;
});

const hasAudio = computed(() => {
  return audioBlob.value !== null || uploadedFile.value !== null;
});

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(audioChunks.value, { type: "audio/wav" });
      audioBlob.value = blob;
      uploadedFile.value = null;
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.value.start();
    isRecording.value = true;
    error.value = null;
  } catch (err) {
    error.value = "Failed to access microphone. Please grant permission.";
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/m4a",
      "audio/ogg",
      "audio/wav",
      "audio/x-m4a",
    ];
    const allowedExtensions = [".mp3", ".m4a", ".ogg", ".wav"];

    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension)
    ) {
      uploadedFile.value = file;
      audioBlob.value = null;
      error.value = null;
    } else {
      error.value = "Please upload a valid audio file (.mp3, .m4a, .ogg, .wav)";
      event.target.value = "";
    }
  }
};

const sendToAPI = async () => {
  const fileToSend = audioBlob.value || uploadedFile.value;

  if (!fileToSend) return;

  // Add user message with audio
  const userMessage = {
    id: Date.now(),
    type: "user",
    audioUrl: URL.createObjectURL(fileToSend),
    model: selectedModel.value,
    timestamp: new Date().toLocaleTimeString(),
  };

  messages.value.push(userMessage);
  scrollToBottom();

  isLoading.value = true;
  error.value = null;

  // Clear input
  const tempAudioBlob = audioBlob.value;
  const tempUploadedFile = uploadedFile.value;
  audioBlob.value = null;
  uploadedFile.value = null;

  // Reset file input
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.value = "";
  }

  try {
    const formData = new FormData();

    const filename = tempUploadedFile ? tempUploadedFile.name : "recording.wav";

    formData.append("file", fileToSend, filename);
    formData.append("model", selectedModel.value);

    // const response = await fetch("http://192.168.20.36:8080/api/voice/upload", {
    //   method: "POST",
    //   body: formData,
    // });

    // response 2 muhammadjon
    const response = await fetch(
      "https://710b5c68b77c.ngrok-free.app/api/v1/transcribe",
      {
        method: "POST",
        header: {
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Add assistant message model 1
    // const assistantMessage = {
    //   id: Date.now() + 1,
    //   type: "assistant",
    //   text: result.transcription,
    //   timestamp: new Date().toLocaleTimeString(),
    // };

    // Add assistant message model 2
    const assistantMessage = {
      id: Date.now() + 1,
      type: "assistant",
      text: result.text,
      timestamp: new Date().toLocaleTimeString(),
    };

    messages.value.push(assistantMessage);
    scrollToBottom();
  } catch (err) {
    error.value = err.message || "Failed to transcribe audio";

    // Add error message
    const errorMessage = {
      id: Date.now() + 1,
      type: "error",
      text: err.message || "Failed to transcribe audio",
      timestamp: new Date().toLocaleTimeString(),
    };

    messages.value.push(errorMessage);
    scrollToBottom();
  } finally {
    isLoading.value = false;
  }
};

const clearChat = () => {
  messages.value = [];
  audioBlob.value = null;
  uploadedFile.value = null;
  error.value = null;

  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.value = "";
  }
};
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Header -->
    <div class="bg-base-100 shadow-lg p-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <h1 class="text-2xl font-bold">Voice Transcription Chat</h1>
        <button
          v-if="messages.length > 0"
          class="btn btn-sm btn-ghost"
          @click="clearChat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear Chat
        </button>
      </div>
    </div>

    <!-- Chat Messages Area -->
    <div class="flex-1 overflow-hidden">
      <div class="max-w-4xl mx-auto h-full flex flex-col p-4">
        <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-4 mb-4">
          <!-- Empty State -->
          <div
            v-if="messages.length === 0"
            class="flex items-center justify-center h-full text-base-content/50"
          >
            <div class="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-16 w-16 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <p class="text-lg">
                Start a conversation by recording or uploading audio
              </p>
            </div>
          </div>

          <!-- Messages -->
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex',
              message.type === 'user' ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'max-w-lg rounded-lg p-4',
                message.type === 'user'
                  ? 'bg-primary text-primary-content'
                  : message.type === 'error'
                  ? 'bg-error text-error-content'
                  : 'bg-base-100 shadow-md',
              ]"
            >
              <!-- User Message (Audio) -->
              <div v-if="message.type === 'user'">
                <div class="flex items-center gap-2 mb-2 w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span class="font-semibold">You</span>
                  <span class="badge badge-sm">{{ message.model }}</span>
                </div>
                <audio controls :src="message.audioUrl" class="w-full" />
                <div class="text-xs opacity-70 mt-2">
                  {{ message.timestamp }}
                </div>
              </div>

              <!-- Assistant Message (Text) -->
              <div v-if="message.type === 'assistant'">
                <div class="flex items-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span class="font-semibold">Transcription</span>
                </div>
                <p class="whitespace-pre-wrap">{{ message.text }}</p>
                <div class="text-xs opacity-70 mt-2">
                  {{ message.timestamp }}
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="message.type === 'error'">
                <!-- <div class="toast toast-top toast-center z-100">
                  <div class="alert alert-error">
                    <p>{{ message.text }}</p>
                    <div class="text-xs opacity-70 mt-2">
                      {{ message.timestamp }}
                    </div>
                  </div>
                </div> -->
                <div class="flex items-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="font-semibold">Error</span>
                </div>
                <p>{{ message.text }}</p>
                <div class="text-xs opacity-70 mt-2">
                  {{ message.timestamp }}
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-base-100 shadow-md rounded-lg p-4 max-w-lg">
              <div class="flex items-center gap-2">
                <span class="loading loading-dots loading-md"></span>
                <span>Transcribing...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="bg-base-100 rounded-lg shadow-lg p-4">
          <!-- Model Selection -->
          <div class="form-control mb-3">
            <div class="flex flex-col gap-2 w-[200px]">
              <label class="label-text text-xs mb-1">Select Model</label>

              <select
                v-model="selectedModel"
                class="select select-bordered w-full"
              >
                <option value="gemini">Gemini</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="groq">Groq</option>
              </select>
            </div>
          </div>

          <!-- Audio Preview -->
          <div v-if="hasAudio" class="mb-3">
            <audio controls :src="audioUrl" class="w-full" />
          </div>

          <!-- Input Controls -->
          <div class="flex gap-2 items-end">
            <!-- File Upload -->
            <label class="btn btn-square btn-ghost">
              <input
                type="file"
                class="hidden"
                accept=".mp3,.m4a,.ogg,.wav,audio/*"
                @change="handleFileUpload"
                :disabled="isRecording || isLoading"
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
                />
              </svg>
            </label>

            <!-- Recording Button -->
            <button
              v-if="!isRecording && !hasAudio"
              class="btn btn-circle btn-primary"
              @click="startRecording"
              :disabled="isLoading"
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
                />
              </svg>
            </button>

            <button
              v-if="isRecording"
              class="btn btn-circle btn-error animate-pulse"
              @click="stopRecording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>

            <!-- Send Button -->
            <button
              v-if="hasAudio"
              class="btn btn-primary flex-1"
              @click="sendToAPI"
              :disabled="isLoading"
            >
              <span
                v-if="isLoading"
                class="loading loading-spinner loading-sm"
              ></span>
              <svg
                v-if="!isLoading"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send
            </button>
          </div>

          <!-- Error Alert -->
          <!-- <div v-if="error" class="alert alert-error mt-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>
