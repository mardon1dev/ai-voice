<script setup>
import { ref, computed } from "vue";

const isRecording = ref(false);
const audioBlob = ref(null);
const uploadedFile = ref(null);
const isLoading = ref(false);
const transcriptionResult = ref(null);
const error = ref(null);
const selectedModel = ref("gemini");

const mediaRecorder = ref(null);
const audioChunks = ref([]);

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

const formattedResult = computed(() => {
  return JSON.stringify(transcriptionResult.value, null, 2);
});

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
      uploadedFile.value = null; // Clear uploaded file when recording
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
      audioBlob.value = null; // Clear recorded audio when uploading
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

  isLoading.value = true;
  error.value = null;

  try {
    const formData = new FormData();

    // Determine filename based on source
    const filename = uploadedFile.value
      ? uploadedFile.value.name
      : "recording.wav";

    formData.append("file", fileToSend, filename);
    formData.append("model", selectedModel.value);

    // // response 1 saidalo
    //     const response = await fetch('http://192.168.20.36:8080/api/voice/upload', {
    //       method: 'POST',
    //       body: formData,
    //     });

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

    // // result 1 saidalo
    // transcriptionResult.value = result.transcription;

    // result 2 muhammadjon
    transcriptionResult.value = result.text;
  } catch (err) {
    error.value = err.message || "Failed to transcribe audio";
  } finally {
    isLoading.value = false;
  }
};

const reset = () => {
  audioBlob.value = null;
  uploadedFile.value = null;
  transcriptionResult.value = null;
  error.value = null;

  // Reset file input
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.value = "";
  }
};
</script>

<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">Voice Transcription</h1>

      <div class="flex flex-col lg:flex-row items-start justify-between gap-4">
        <!-- Left Side - Recording Controls -->
        <div class="w-full lg:w-1/2">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title mb-4">Record Voice Message</h2>

              <!-- Model Selection -->
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Select Model</span>
                </label>
                <div class="flex gap-2">
                  <label
                    class="label cursor-pointer flex-1 border rounded-lg p-3 hover:bg-base-200"
                  >
                    <span class="label-text">Gemini</span>
                    <input
                      type="radio"
                      name="model"
                      class="radio radio-primary"
                      value="gemini"
                      v-model="selectedModel"
                    />
                  </label>
                  <label
                    class="label cursor-pointer flex-1 border rounded-lg p-3 hover:bg-base-200"
                  >
                    <span class="label-text">ElevenLabs</span>
                    <input
                      type="radio"
                      name="model"
                      class="radio radio-primary"
                      value="elevenlabs"
                      v-model="selectedModel"
                    />
                  </label>
                  <label
                    class="label cursor-pointer flex-1 border rounded-lg p-3 hover:bg-base-200"
                  >
                    <span class="label-text">Groq</span>
                    <input
                      type="radio"
                      name="model"
                      class="radio radio-primary"
                      value="groq"
                      v-model="selectedModel"
                    />
                  </label>
                </div>
              </div>

              <!-- File Upload -->
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text font-semibold"
                    >Or Upload Audio File</span
                  >
                </label>
                <input
                  type="file"
                  class="file-input file-input-bordered file-input-primary w-full"
                  accept=".mp3,.m4a,.ogg,.wav,audio/*"
                  @change="handleFileUpload"
                  :disabled="isRecording"
                />
                <label class="label">
                  <span class="label-text-alt"
                    >Supported formats: MP3, M4A, OGG, WAV</span
                  >
                </label>
              </div>

              <div class="divider">OR</div>

              <div class="flex flex-col items-center gap-4 py-8">
                <button
                  v-if="!isRecording && !hasAudio"
                  class="btn btn-circle btn-primary btn-lg"
                  @click="startRecording"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8"
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
                  class="btn btn-circle btn-error btn-lg animate-pulse"
                  @click="stopRecording"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>

                <p class="text-sm text-base-content/70">
                  {{
                    isRecording
                      ? "Recording... Click to stop"
                      : hasAudio
                      ? uploadedFile
                        ? "File uploaded"
                        : "Recording ready"
                      : "Click to start recording"
                  }}
                </p>
              </div>

              <div v-if="hasAudio" class="space-y-4">
                <audio controls :src="audioUrl" class="w-full" />

                <div class="flex gap-2">
                  <button
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
                    {{
                      isLoading ? "Transcribing..." : "Send for Transcription"
                    }}
                  </button>

                  <button
                    class="btn btn-ghost"
                    @click="reset"
                    :disabled="isLoading"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div v-if="error" class="alert alert-error mt-4">
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
                <span>{{ error }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Transcription Result -->
        <div class="w-full lg:w-1/2">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title mb-4">Transcription Result</h2>

              <div
                v-if="!transcriptionResult"
                class="flex items-start justify-center h-64 text-base-content/50"
              >
                <p>Transcription will appear here</p>
              </div>

              <div v-if="transcriptionResult" class="space-y-4">
                <div class="bg-base-200 p-4 rounded-lg">
                  <pre class="whitespace-pre-wrap text-sm">{{
                    formattedResult
                  }}</pre>
                </div>

                <div
                  v-if="transcriptionResult.text"
                  class="alert alert-success"
                >
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div class="font-bold">Transcribed Text:</div>
                    <div class="text-sm">{{ transcriptionResult.text }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
