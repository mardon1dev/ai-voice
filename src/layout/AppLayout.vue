<script setup lang="ts">
import Navbar from "../components/navbar/Navbar.vue";
import Sidebar from "../components/sidebar/Sidebar.vue";
</script>

<template>
  <div class="flex items-start w-full">
    <Sidebar />
    <div class="relative w-full h-full overflow-scroll">
      <Navbar />
      <div class="p-2 bg-base-300 h-full">
        <router-view />
      </div>
    </div>
  </div>
</template>
