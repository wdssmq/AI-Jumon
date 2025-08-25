import {
  defineConfig,
  presetMini,
} from 'unocss'

export default defineConfig({
  presets: [
    presetMini()
  ],
  shortcuts: {
    'btn-rt': 'fixed right-4 top-4',
  },
})
