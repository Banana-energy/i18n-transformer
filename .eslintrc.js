module.exports = {
  extends: ['@vue/standard'], globals: {
    name: 'off'
  }, rules: {
    indent: ['error', 2, {
      MemberExpression: 'off'
    }],
    quotes: [2, 'single', {avoidEscape: true, allowTemplateLiterals: true}],
    'quote-props': 'off',
    'no-shadow': ['error']
  }
}
