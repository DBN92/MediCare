#!/usr/bin/env node
const webpush = require('web-push')

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log('VAPID_PUBLIC_KEY=', publicKey)
console.log('VAPID_PRIVATE_KEY=', privateKey)

console.log('\nCopie estes valores para .env e para secrets do deploy:')
console.log(' - VITE_VAPID_PUBLIC_KEY (frontend)')
console.log(' - VAPID_PUBLIC_KEY (Edge/scripts)')
console.log(' - VAPID_PRIVATE_KEY (Edge/scripts)')