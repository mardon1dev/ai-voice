<script setup lang="ts">
import Breadcrumb from "../breadcrumb/Breadcrumb.vue";
</script>

<template>
  <div
    class="navbar bg-base-100 shadow-sm w-full sticky top-0 left-0 right-0 z-10"
  >
    <label
      for="my-drawer-4"
      aria-label="open sidebar"
      class="btn btn-square btn-ghost"
    >
      <!-- Sidebar toggle icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-linejoin="round"
        stroke-linecap="round"
        stroke-width="2"
        fill="none"
        stroke="currentColor"
        class="my-1.5 inline-block size-4"
      >
        <path
          d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"
        ></path>
        <path d="M9 4v16"></path>
        <path d="M14 10l2 2l-2 2"></path>
      </svg>
    </label>
    <div class="flex-1">
      <Breadcrumb />
    </div>
    <div class="flex gap-2">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              alt="Tailwind CSS Navbar component"
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
            />
          </div>
        </div>
        <ul
          tabindex="-1"
          class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li>
            <a> Profile </a>
          </li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>
