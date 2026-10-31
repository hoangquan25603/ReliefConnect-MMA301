<template>
  <span
    :class="['base-spinner', `base-spinner--${size}`]"
    role="status"
    aria-label="Đang tải..."
  />
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
}
withDefaults(defineProps<Props>(), { size: 'md' })
</script>

<style scoped>
.base-spinner {
  display: inline-block;
  border-radius: 50%;
  border-style: solid;
  border-color: rgba(255,255,255,0.35) rgba(255,255,255,0.35) rgba(255,255,255,0.35) white;
  animation: spin 0.7s linear infinite;
}
.base-spinner--sm  { width: 14px; height: 14px; border-width: 2px; }
.base-spinner--md  { width: 20px; height: 20px; border-width: 2.5px; }
.base-spinner--lg  { width: 32px; height: 32px; border-width: 3px; }

/* Dark variant (dùng trên nền sáng) */
:global(.spinner-dark) .base-spinner {
  border-color: rgba(26,79,141,0.2) rgba(26,79,141,0.2) rgba(26,79,141,0.2) #1a4f8d;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
