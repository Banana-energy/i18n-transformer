import type { Config, } from 'release-it';

export default {
  'plugins': {
    'release-it-pnpm': {},
    '@release-it-plugins/workspaces': {
      'publish': false,
    },
  },
  'npm': {
    'publish': false,
  },
  'git': {
    'requireCleanWorkingDir': false,
    'commitMessage': 'chore: release ${version}',
    'tagName': 'v${version}',
  },
  'github': {
    'release': false,
  },
} satisfies Config
