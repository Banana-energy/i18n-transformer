import type { Config, } from 'release-it';

type RealConfig = Config & {
  npm: {
    publishConfig: Record<string, any>
  }
}

const args = process.argv.slice(2,);

export default {
  'plugins': {
    'release-it-pnpm': {},
    '@release-it-plugins/workspaces': {
      'publish': false,
    },
  },
  'npm': {
    'publish': false,
    'publishConfig': {
      'registry': args[1] ? 'https://packages.aliyun.com/61ee8bb874c3f3b55073ffd0/npm/npm-registry/' : 'https://registry.npmjs.org/',
    },
  },
  'git': {
    'requireCleanWorkingDir': false,
    'commitMessage': 'chore: release ${version}',
    'tagName': 'v${version}',
  },
  'github': {
    'release': false,
  },
} satisfies RealConfig
