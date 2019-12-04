const crypto = require('crypto')

const key = '123456789abcdefg'
const iv = '123456789abcdefg'

function encode (data) {
    const encipher = crypto.createCipheriv('aes-128-cbc', key, iv)
    return encipher.update(data, 'binary', 'base64') + encipher.final('base64')
}

function decode (crypted) {
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    crypted = Buffer.from(crypted, 'base64').toString('binary')
    return decipher.update(crypted, 'binary', 'utf8') + decipher.final('utf8')
}

module.exports = { encode, decode }
