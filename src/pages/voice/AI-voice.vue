<!-- AI voice recorder and STT -->

<template>
  <div class="flex items-start justify-center gap-6">
    <div
      class="voice-recorder-container p-6 bg-white shadow-xl rounded-lg border border-base-300 max-w-[600px]"
    >
      <h2 class="text-3xl font-bold mb-4 text-center text-primary">
        Modern Voice Recorder 🎙️
      </h2>

      <div class="form-control w-full mb-4">
        <label class="label">
          <span class="label-text">Language:</span>
        </label>
        <select
          class="select select-bordered w-full"
          v-model="selectedLanguage"
          :disabled="isRecording"
        >
          <option value="en-US">English (US)</option>
          <option value="uz-UZ">Uzbek (O'zbek)</option>
          <option value="ru-RU">Russian (Русский)</option>
        </select>
      </div>

      <div
        :class="[
          'alert shadow-lg mb-4 text-center',
          {
            'alert-info': !isRecording && !lastRecordingURL,
            'alert-warning': isRecording,
            'alert-success': !isRecording && lastRecordingURL,
          },
        ]"
      >
        <div class="w-full">
          <span class="font-semibold">{{ statusMessage }}</span>
        </div>
      </div>

      <div class="flex justify-start space-x-4 mb-6">
        <button
          id="startBtn"
          @click="startRecording"
          :disabled="isRecording"
          class="btn btn-success text-white w-24"
        >
          Start
        </button>
        <button
          id="stopBtn"
          @click="stopRecording"
          :disabled="!isRecording"
          class="btn btn-error text-white w-24"
        >
          Stop
        </button>
      </div>

      <hr class="my-6 border-base-200" />

      <h3 class="text-xl font-semibold mb-2 text-primary">Transcript:</h3>
      <div
        class="p-4 border border-base-300 rounded-lg min-h-[100px] bg-base-100"
      >
        <p
          v-for="(line, index) in finalTranscriptLines"
          :key="index"
          class="mb-1 text-base-content"
        >
          {{ line }}
        </p>
        <p v-if="interimTranscript" class="text-gray-500 italic">
          {{ interimTranscript }}
        </p>
        <p
          v-if="!finalTranscriptLines.length && !interimTranscript"
          class="text-gray-400"
        >
          Start recording to see the speech-to-text results here...
        </p>
      </div>

      <h3 class="text-xl font-semibold mt-6 mb-2 text-primary">
        Audio Recording:
      </h3>
      <div
        class="audio-container flex flex-col items-start space-y-3 p-4 border border-base-300 rounded-lg bg-base-100"
      >
        <audio
          v-if="lastRecordingURL"
          :src="lastRecordingURL"
          controls
          class="w-full"
        ></audio>
        <div
          v-if="lastRecordingURL"
          class="flex items-center justify-between w-full"
        >
          <button class="btn btn-sm btn-primary" @click="generateText">
            Generate Text
          </button>
          <div class="flex items-center justify-end gap-2">
            <a
              :href="lastRecordingURL"
              :download="downloadFileName"
              class="btn btn-sm btn-outline btn-primary"
            >
              Download 💾
            </a>
            <button class="btn btn-sm btn-dash" @click="deleteRecording">
              ❌
            </button>
          </div>
        </div>
        <p v-else class="text-gray-400">No recording saved yet.</p>
      </div>
    </div>
    <div
      class="p-6 bg-white shadow-xl rounded-lg border border-base-300 text-black max-w-[400px]"
    >
      <h2>In here the audio text will be generated to text</h2>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";

const url = "http://192.168.20.214:8080/api/gemini/transcribe";

// --- State Management ---
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const stream = ref(null);
const recognition = ref(null);

const isRecording = ref(false);
const statusMessage = ref("Ready");
const finalTranscriptLines = ref([]);
const interimTranscript = ref("");
const lastRecordingURL = ref(null);
const selectedLanguage = ref("en-US");

const downloadFileName = computed(() => {
  return `recording_${new Date().getTime()}.mp3`;
});

// --- Speech Recognition Setup ---
const initSpeechRecognition = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition.value = new SpeechRecognition();
    recognition.value.continuous = true;
    recognition.value.interimResults = true;
    recognition.value.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      statusMessage.value = "Recognition Error";
    };

    recognition.value.onresult = (event) => {
      let currentInterimTranscript = "";
      let currentFinalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinalTranscript += event.results[i][0].transcript;
        } else {
          currentInterimTranscript += event.results[i][0].transcript;
        }
      }

      if (currentFinalTranscript) {
        finalTranscriptLines.value.push(currentFinalTranscript.trim());
        interimTranscript.value = "";
      } else {
        interimTranscript.value = currentInterimTranscript;
      }
    };
  } else {
    console.warn("Speech Recognition API not supported.");
    statusMessage.value = "Speech Recognition API not supported.";
  }
};

initSpeechRecognition();

// --- Recording Methods ---

const startRecording = async () => {
  statusMessage.value = "Requesting microphone permission...";
  finalTranscriptLines.value = [];
  interimTranscript.value = "";
  lastRecordingURL.value = null;

  try {
    // 1. Get Media Stream
    stream.value = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. Setup MediaRecorder
    mediaRecorder.value = new MediaRecorder(stream.value);
    audioChunks.value = [];

    mediaRecorder.value.addEventListener("dataavailable", (event) => {
      audioChunks.value.push(event.data);
    });

    mediaRecorder.value.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks.value, { type: "audio/mp3" });
      lastRecordingURL.value = URL.createObjectURL(audioBlob);
    });

    // 3. Start Recording and Recognition
    mediaRecorder.value.start();
    if (recognition.value) {
      recognition.value.lang = selectedLanguage.value;
      recognition.value.start();
    }

    isRecording.value = true;
    statusMessage.value = "Recording... (Say something)";
  } catch (error) {
    console.error("Error accessing microphone:", error);
    statusMessage.value = "Error starting recording (Permission denied)";
    alert(
      "Error accessing microphone. Please ensure you have granted permission."
    );
    isRecording.value = false;
  }
};

const stopRecording = () => {
  // 1. Stop MediaRecorder
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }

  // 2. Stop Speech Recognition
  if (recognition.value) {
    recognition.value.stop();
  }

  // 3. Stop Media Tracks (release microphone)
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }

  isRecording.value = false;
  statusMessage.value = "Recording saved.";
};

const deleteRecording = () => {
  isRecording.value = false;
  statusMessage.value = "Ready";
  recognition.value = null;
  audioChunks.value = [];
  lastRecordingURL.value = null;
  recognition.value.stop();
  interimTranscript.value = [];
};

const generateText = async () => {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: {
        file: new FormData(),
      },
    });
    console.log(res);
  } catch (error) {}
};

// --- Cleanup on Component Unmount ---
onUnmounted(() => {
  if (isRecording.value) {
    stopRecording();
  }
  if (lastRecordingURL.value) {
    URL.revokeObjectURL(lastRecordingURL.value);
  }
});
</script>

<style scoped></style>
