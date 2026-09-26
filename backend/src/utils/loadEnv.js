const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const envFiles = ['../../.env.local', '../../.env']
let loaded = false

const loadEnv = () => {
  if (loaded) {
    return
  }

  for (const relativePath of envFiles) {
    const envPath = path.resolve(__dirname, relativePath)
    if (!fs.existsSync(envPath)) {
      continue
    }

    dotenv.config({
      path: envPath,
      override: false
    })
  }

  loaded = true
}

module.exports = loadEnv
