<template>
  <div :class="['base-card', { 'base-card--shadow': shadow, 'base-card--hover': hover }]">
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </div>
    <div class="base-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  shadow?: boolean
  hover?: boolean
}
withDefaults(defineProps<Props>(), { shadow: true, hover: false })
</script>

<style scoped>
.base-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}
.base-card--shadow { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.base-card--hover { transition: box-shadow 0.2s, transform 0.2s; }
.base-card--hover:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.13);
  transform: translateY(-2px);
}
.base-card__header {
  padding: 18px 24px;
  border-bottom: 1px solid #f0f2f5;
  font-weight: 700;
  color: #1a3b5c;
}
.base-card__body { padding: 24px; }
.base-card__footer {
  padding: 14px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fafafa;
}
</style>
