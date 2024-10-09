import { execSync, } from 'child_process'

const repoKey = process.argv.slice(2,)[0];

// 根据传入的参数配置不同的 npm 仓库地址
const registryConfig = {
  '--official': 'https://registry.npmjs.org/',
  '--private': 'https://packages.aliyun.com/61ee8bb874c3f3b55073ffd0/npm/npm-registry/',
};

// 检查传入的参数是否存在于配置中
if (!repoKey || !registryConfig[repoKey]) {
  console.error(`Error: Invalid or missing repository key. Available options are: ${Object.keys(registryConfig,).join(', ',)}`,);
  process.exit(1,);
}

const selectedRegistry = registryConfig[repoKey];

try {
  // 设置 npm registry
  console.log(`Setting npm registry to: ${selectedRegistry}`,);
  execSync(`npm config set registry ${selectedRegistry}`, {
    stdio: 'inherit',
  },);

  // 执行 npm 登录
  console.log('Logging into npm...',);
  execSync('npm login', {
    stdio: 'inherit',
  },);

  // 运行指定的 npm 命令，这里我们运行 npm install，可以根据需求替换为其他命令
  console.log('Running release...',);
  execSync('pnpm release', {
    stdio: 'inherit',
  },);

  console.log('Script completed successfully!',);
} catch (error) {
  console.error(`Error executing script: ${error.message}`,);
  process.exit(1,);
}
