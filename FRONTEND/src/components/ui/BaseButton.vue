<template>
  <button
    :id="id"
    :type="type"
    :disabled="disabled || loading"
    :class="['base-btn', `base-btn--${variant}`, `base-btn--${size}`, { 'base-btn--loading': loading }]"
    v-bind="$attrs"
  >
    <BaseSpinner v-if="loading" class="base-btn__spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

interface Props {
  id?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}
withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
}
.base-btn:active:not(:disabled) { transform: scale(0.98); }
.base-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Sizes */
.base-btn--sm { padding: 7px 14px; font-size: 13px; }
.base-btn--md { padding: 11px 20px; font-size: 15px; }
.base-btn--lg { padding: 14px 28px; font-size: 16px; }

/* Variants */
.base-btn--primary { background-color: #1a4f8d; color: #fff; }
.base-btn--primary:hover:not(:disabled) { background-color: #123766; }

.base-btn--secondary { background-color: #f0f2f5; color: #1a3b5c; }
.base-btn--secondary:hover:not(:disabled) { background-color: #dde1e7; }

.base-btn--danger { background-color: #c53030; color: #fff; }
.base-btn--danger:hover:not(:disabled) { background-color: #9b2323; }

.base-btn--ghost { background-color: transparent; color: #1a4f8d; border: 1.5px solid #1a4f8d; }
.base-btn--ghost:hover:not(:disabled) { background-color: rgba(26,79,141,0.07); }

.base-btn__spinner { flex-shrink: 0; }
</style>
