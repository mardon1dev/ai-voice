import { createRouter, createWebHistory } from "vue-router";
import Main from "../pages/main/Main.vue";
import Setting from "../pages/setting/Setting.vue";
import Products from "../pages/products/Products.vue";
import AIVoice from "../pages/voice/AI-voice.vue";
import AIModels from "../pages/models/AI-models.vue";
import AIMode from "../pages/models/AI-mode.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Main",
      component: Main,
    },
    {
      path: "/setting",
      name: "Setting",
      component: Setting,
      meta: { breadcrumb: "Setting" },
    },
    {
      path: "/products",
      name: "Products",
      component: Products,
      meta: { breadcrumb: "Products" },
    },
    {
      path: "/ai-voice",
      name: "ai-voice",
      component: AIVoice,
      meta: { breadcrumb: "AI-voice" },
    },
    {
      path: "/ai-models",
      name: "ai-models",
      component: AIModels,
      meta: { breadcrumb: "AI-models" },
    },
    {
      path: "/ai-mode",
      name: "ai-mode",
      component: AIMode,
      meta: { breadcrumb: "AI-mode" },
    },
  ],
});

export default router;
