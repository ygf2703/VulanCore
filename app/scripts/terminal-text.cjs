const os = require('node:os')

function writeTerminalText(message = '') {
  process.stdout.write(`${String(message)}${os.EOL}`)
}

module.exports = {
  writeTerminalText,
}
