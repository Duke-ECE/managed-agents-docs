<script setup>
import { nextTick, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

const image = withBase('/diagrams/agent-runtime-concept.png')
const open = ref(false)
const closeButton = ref(null)
let previousFocus = null
let previousOverflow = ''

function show() {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  open.value = true
  window.addEventListener('keydown', onKeydown)
  nextTick(() => closeButton.value?.focus())
}

function hide() {
  open.value = false
  document.body.style.overflow = previousOverflow
  window.removeEventListener('keydown', onKeydown)
  nextTick(() => previousFocus?.focus())
}

function onKeydown(event) {
  if (event.key === 'Escape') hide()
  if (event.key === 'Tab') {
    event.preventDefault()
    closeButton.value?.focus()
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (open.value) document.body.style.overflow = previousOverflow
})
</script>

<template>
  <button class="docs-diagram-trigger" type="button" aria-label="Enlarge architecture diagram" @click="show">
    <img :src="image" alt="Proposed architecture with agent runtime, session service, sandbox execution, and LLM providers">
    <span class="docs-diagram-hint">Click to enlarge the diagram ↗</span>
  </button>
  <div v-if="open" class="docs-diagram-overlay" role="dialog" aria-modal="true" aria-label="Architecture diagram enlarged" @click.self="hide">
    <button ref="closeButton" class="docs-diagram-close" type="button" aria-label="Close enlarged diagram" @click="hide">Close ✕</button>
    <img :src="image" alt="Proposed architecture with agent runtime, session service, sandbox execution, and LLM providers">
  </div>
</template>
