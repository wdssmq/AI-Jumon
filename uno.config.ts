import {
  defineConfig,
  presetMini,
} from 'unocss';

export default defineConfig({
  presets: [
    presetMini(),
  ],
  rules: [
    ['py-d35', { 'padding-top': '.35rem', 'padding-bottom': '.4rem' }],
  ],
  shortcuts: {
    'btn-rt': 'fixed right-4 top-4',
    'btn-def': 'px-3 py-d35 text-white rounded b-style-none',
    'btn-small': 'px-2 py-1 text-white rounded b-style-none text-size-3',
    'input-def': 'p-1 border rounded border-gray-300 outline-none hover:border-blue-400 focus:border-blue-400 transition-9',
  },
});
