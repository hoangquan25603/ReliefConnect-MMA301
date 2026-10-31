<template>
  <div class="base-input-wrap">
    <label v-if="label" :for="inputId" class="base-input__label">{{ label }}</label>
    <div class="base-input__field" :class="{ 'base-input__field--error': !!error }">
      <slot name="prefix" />
      <input
        :id="inputId"
        v-bind="$attrs"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="base-input__el"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <slot name="suffix" />
    </div>
    <p v-if="error" class="base-input__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = computed(() => props.id ?? `input-${Math.random().toString(36).slice(2)}`)
</script>

<style scoped>
.base-input-wrap { display: flex; flex-direction: column; gap: 5px; }

.base-input__label { font-size: 13px; font-weight: 600; color: #2d3748; }

.base-input__field {
  display: flex;
  align-items: center;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #fafafa;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.base-input__field:focus-within {
  border-color: #1a4f8d;
  box-shadow: 0 0 0 3px rgba(26,79,141,0.1);
  background: #fff;
}
.base-input__field--error { border-color: #c53030; }
.base-input__field--error:focus-within { box-shadow: 0 0 0 3px rgba(197,48,48,0.1); }

.base-input__el {
  flex: 1;
  padding: 11px 14px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #2d3748;
  min-width: 0;
}
.base-input__el::placeholder { color: #a0aec0; }
.base-input__el:disabled { opacity: 0.5; cursor: not-allowed; }

.base-input__error { font-size: 12px; color: #c53030; margin: 0; }
</style>
