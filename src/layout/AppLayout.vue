<script setup lang="ts">
import Navbar from "../components/navbar/Navbar.vue";
import Sidebar from "../components/sidebar/Sidebar.vue";
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content">
      <Navbar />
      <div class="p-2">
        <router-view />
      </div>
    </div>

    <Sidebar />
  </div>
</template>
