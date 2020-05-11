// @ts-ignore
const { version } = require('../package.json')

const os = require('os')
const fs = require('fs')
const path = require('path')
const { decode } = require('../lib/codec')

const CONFIG_FILE = path.join(os.homedir(), '.wrzsz', 'remote.json')

class ConfigResolve {
    async initialize () {
        if (!fs.existsSync(CONFIG_FILE)) {
            const dir = path.dirname(CONFIG_FILE)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir)
            this.data = { history: [], histsize: 5, servers: [] }
            this.writeFileSync()
        }
        this.readFileSync() // this.data
        this.flushViewSync() // this.view
        this.initFlushRecordParam()
    }

    readFileSync () {
        const text = fs.readFileSync(CONFIG_FILE).toString('utf-8')
        this.data = JSON.parse(text)
    }

    writeFileSync () {
        const text = JSON.stringify(this.data, null, '\t')
        fs.writeFileSync(CONFIG_FILE, text, 'utf-8')
    }

    flushViewSync () { // this.data => this.view
        const { history, servers } = this.data
        const smap = new Map(); const hmap = new Map()

        servers.map((value, index) => {
            const remote = Object.assign({ id: index }, value)
            remote.password = decode(value.password)
            remote.name = value.label ? value.label + ': ' : ''
            remote.name += value.username + '@' + value.host
            remote.value = remote.id // name & id for inquirer list
            return remote
        }).forEach(e => { smap.set(e.id, e) })

        history.map((value, index) => {
            const record = Object.assign({ id: index }, value)
            record.host = smap.get(record.sid)
            record.name = record.host.name + ':' + record.path
            record.value = record.id // name & id for inquirer list
            return record
        }).forEach(e => { hmap.set(e.id, e) })

        this.view = { history: hmap, servers: smap }
    }

    initFlushRecordParam () {
        this.flushRecordParam = {
            needFresh: false, // true or false
            sortHosts: false, // true or false
            removeHosts: [] // id array [0, 1, 2]
        }
    }

    needFlushRecordToFile (option = {}) {
        Object.assign(this.flushRecordParam, { needFresh: true }, option)
    }

    flushRecordToFileSync () {
        const { needFresh } = this.flushRecordParam
        if (needFresh) {
            const { history, histsize, servers } = config.data
            config.data.history = history.slice(0, histsize)

            const idmap = new Map()
            let mapped = servers.map(function (el, index) {
                let value = el.label ? el.label : '\uFFFF'
                value += el.host + el.username
                return { el: el, value: value, oid: index }
            })

            const { removeHosts } = this.flushRecordParam
            if (removeHosts && removeHosts.length > 0) {
                mapped = mapped.filter((el) => {
                    return removeHosts.indexOf(el.oid) === -1
                })
                config.data.history = history.filter((el) => {
                    return removeHosts.indexOf(el.sid) === -1
                })
                this.flushRecordParam.sortHosts = true
            }

            const { sortHosts } = this.flushRecordParam
            if (sortHosts) {
                mapped.sort((a, b) => { return a.value.localeCompare(b.value) })
                mapped.forEach((e, nid) => { idmap.set(e.oid, nid) })
                config.data.servers = mapped.map(function (el) { return el.el })
                config.data.history.forEach((e) => { e.sid = idmap.get(e.sid) })
            }

            this.writeFileSync()
        }
    }
}

const config = new ConfigResolve()
module.exports = { version, config }
