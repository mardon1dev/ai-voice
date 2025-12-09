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
  <div class="drawer-side is-drawer-close:overflow-visible">
    <label for="my-drawer-4" class="drawer-overlay"></label>

    <div
      class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64"
    >
      <ul class="menu w-full grow">
        <SidebarItem
          v-for="item in items"
          :key="item.to"
          :label="item.label"
          :to="item.to"
          :icon="item.icon"
        />
      </ul>
    </div>
  </div>
</template>
