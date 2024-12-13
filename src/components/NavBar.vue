<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
const ROUTES = [
  { to: '/', content: '抽奖主页' },
  { to: '/settings', content: '设置' },
]
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem v-for="route in ROUTES" :key="route.to">
        <RouterLink :to="route.to" :class="navigationMenuTriggerStyle()">{{ route.content }}</RouterLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
