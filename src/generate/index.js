import { createLocalFile } from './wordConfig.js'

export default function (setting) {
  const { output } = setting
  if (output.generate) {
    createLocalFile.call(this, output)
  }
}
