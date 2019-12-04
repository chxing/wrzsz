// https://github.com/visionmedia/node-progress
// http://maboiteaspam.github.io/ssh2-utils

const fs = require('fs')
const path = require('path')
const ProgressBar = require('progress')
const SSH2Utils = require('ssh2-utils')
const { config } = require('./config')

class Progress {
    constructor (contentLen) {
        this.transmitted = 0
        this.contentLen = contentLen
        const format = ':percent [:bar]  :current  eta :etas    '
        this.bar = new ProgressBar(format, {
            head: '>',
            complete: '=',
            incomplete: ' ',
            width: 1024, /* something longer than the terminal width */
            total: contentLen
        })
    }

    next (transmitted) {
        const chunk = transmitted - this.transmitted
        this.transmitted = transmitted
        this.bar.tick(chunk, { c2: this.bar.curr.toLocaleString() })
    }
}

SSH2Utils.prototype.putFile2 = function (server, localFile, remoteFile, then) {
    remoteFile = remoteFile.replace(/[\\]/g, '/') // windows needs this
    var remotePath = path.dirname(remoteFile)
    const returnOrThrow = function (then, err) {
        if (then) {
            var args = Array.prototype.slice.call(arguments)
            args.shift(); then.apply(null, args)
        } else if (err) { throw err }
    }
    this.mkdir(server, remotePath, function (err, server, conn) {
        if (err) return returnOrThrow(then, err, server, conn)
        conn.sftp(function (err, sftp) {
            if (err) return returnOrThrow(then, err, server, conn)
            sftp.fastPut(localFile, remoteFile, function (err) {
                returnOrThrow(then, err, server, conn)
            })
        })
        const freshProcessStat = function (sftp, contentLen, progress) {
            sftp.stat(remoteFile, (_err, stats) => {
                const uploaded = !stats ? 0 : stats.size
                progress.next(uploaded)
                if (!stats || stats.size < contentLen) {
                    freshProcessStat(sftp, contentLen, progress)
                } else if (stats.size === contentLen) {
                    // close ssh connection
                    setTimeout(function () {
                        conn.end()
                        config.flushRecordToFileSync()
                    }, 1000)
                }
            })
        }
        conn.sftp(function (_err, sftp) { // ProgressBar
            const contentLen = fs.statSync(localFile).size
            const progress = new Progress(contentLen)
            freshProcessStat(sftp, contentLen, progress)
        })
    })
}

function uploadFile (localFile, server, fpath) {
    const ssh = new SSH2Utils()
    const fname = path.basename(localFile)
    console.log('> ' + server.username + '@' + server.host + ':' + path.posix.join(fpath, fname))
    const remoteFile = path.join(fpath, fname)
    // @ts-ignore
    ssh.putFile2(server, localFile, remoteFile, function (err, server, conn) {
        if (err) console.log(err.message)
    })
}

module.exports = { uploadFile }
