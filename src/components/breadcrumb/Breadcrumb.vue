<template>
  <div class="breadcrumbs text-sm">
    <ul>
      <li>
        <router-link to="/">Main</router-link>
      </li>

      <li v-for="(breadcrumb, index) in breadcrumbs" :key="index">
        <span v-if="index === breadcrumbs.length - 1">
          {{ breadcrumb.name }}
        </span>
        <router-link v-else :to="breadcrumb.path">
          {{ breadcrumb.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, type RouteLocationMatched } from "vue-router";

const route = useRoute();

console.log(route);


const breadcrumbs = computed(() => {
  return (
    route.matched
      .filter(
        (match: RouteLocationMatched) => match.meta && match.meta.breadcrumb
      )
      .map((match: RouteLocationMatched) => {
        const name =
          (match.meta.breadcrumb as string) || (match.name as string);

        return {
          path: match.path,
          name: name,
        };
      })
      .filter((breadcrumb) => breadcrumb.path !== "/")
  );
});
console.log(breadcrumbs.value);

</script>
