import chalk from 'chalk'

function formatTime() {
  const now = new Date()
  const pad = (n: number,) => String(n,).padStart(2, '0',) // 补零函数
  return `${now.getFullYear()}-${pad(now.getDate(),)}-${pad(now.getMonth() + 1,)} ${pad(now.getHours(),)}:${pad(now.getMinutes(),)}:${pad(now.getSeconds(),)}`
}

export const log = {
  levels: {
    info: chalk.blue('INFO',),
    warn: chalk.yellow('WARN',),
    error: chalk.red('ERROR',),
  },
  log(level: keyof typeof this.levels, message: string,) {
    const time = formatTime()
    const levelTag = this.levels[level] || 'LOG'
    console.log(`\n${chalk.gray(time,)} [${levelTag}]: ${message}`,)
  },
  info(message: string,) {
    this.log('info', message,)
  },
  warn(message: string,) {
    this.log('warn', message,)
  },
  error(message: string,) {
    this.log('error', message,)
  },
}
