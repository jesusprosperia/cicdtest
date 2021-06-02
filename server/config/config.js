var config = require('./config.json')
console.log('environment ', process.env.NODE_ENV)
const env = process.env.NODE_ENV || 'development'
const envConfig = config[env]
Object.keys(envConfig).forEach((key) => {
  process.env[key] = envConfig[key]
})