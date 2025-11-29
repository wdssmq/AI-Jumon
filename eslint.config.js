import antfu from '@antfu/eslint-config';

export default antfu({
  unocss: true,
  vue: true,
  rules: {
    'style/semi': [2, 'always', { omitLastInOneLineBlock: true }], // 语句强制分号结尾
    'no-alert': 'off', // 允许使用 alert
    'no-console': 'off', // 允许使用 console
    'no-unused-vars': 'off', // 关闭原生的 no-unused-vars 规则，使用插件的版本
    'unused-imports/no-unused-vars': ['error', { vars: 'all', varsIgnorePattern: '^_', args: 'all', argsIgnorePattern: '^_' }],
    'unused-imports/no-unused-imports': ['error', { vars: 'all', varsIgnorePattern: '^_' }],
    'node/prefer-global/process': ['off'],
    'vue/one-component-per-file': ['off'],
  },
});
