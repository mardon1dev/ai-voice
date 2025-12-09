<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{
  label: string;
  to: string;
  icon: string;
}>();
</script>

<template>
  <li>
    <RouterLink
      class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
      :data-tip="label"
      :to="to"
    >
      <!-- <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-linejoin="round"
        stroke-linecap="round"
        stroke-width="2"
        fill="none"
        stroke="currentColor"
        class="my-1.5 inline-block size-4"
        v-html="icon"
      ></svg> -->

      <span class="text-lg">{{ icon }}</span>

      <span class="is-drawer-close:hidden">
        {{ label }}
      </span>
    </RouterLink>
  </li>
</template>
