<script setup lang="ts">
import SidebarItem from "./SIdeBatItem.vue";

const items = [
  {
    label: "Homepage",
    to: "/",
    icon: `🏠`,
  },
  {
    label: "Settings",
    to: "/setting",
    icon: `⚒️`,
  },
  {
    label: "AI-voice",
    to: "/ai-voice",
    icon: `🎙️`,
  },
  {
    label: "AI-models",
    to: "/ai-models",
    icon: `🎙️`,
  },
  {
    label: "AI-mode",
    to: "/ai-mode",
    icon: `🎙️`,
  },
];
</script>

<template>
  <div class="sticky left-0 top-0 bottom-0 z-100 h-full">
    <ul class="w-[200px]">
      <SidebarItem
        v-for="item in items"
        :key="item.to"
        :label="item.label"
        :to="item.to"
        :icon="item.icon"
      />
    </ul>
  </div>
</template>
