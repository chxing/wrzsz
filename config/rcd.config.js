// @ts-ignore
const { version } = require('../package.json')

const os = require('os')
const fs = require('fs')
const path = require('path')

const CONFIG_FILE = path.join(os.homedir(), '.wrzsz', 'replace.json')

class ConfigResolve {
    /**
     * this.data = [['src/main/java', 'target/classes']] default []
     */

    async initialize () {
        if (!fs.existsSync(CONFIG_FILE)) {
            const dir = path.dirname(CONFIG_FILE)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir)
            this.data = []
            this.writeFileSync()
        }
        this.readFileSync() // this.data
    }

    readFileSync () {
        const text = fs.readFileSync(CONFIG_FILE).toString('utf-8')
        this.data = JSON.parse(text)
    }

    writeFileSync () {
        const text = JSON.stringify(this.data, null, '\t')
        fs.writeFileSync(CONFIG_FILE, text, 'utf-8')
    }

    resolveAutomaticallyReplacedPathSegments () {
        this.data = this.data.map(x => [
            x[0].split(path.sep).join('/'), x[1].split(path.sep).join('/')
        ])
        this.data.sort()
        return this.data
    }

    updateRecordToFileSync (newConfig) {
        this.data = newConfig
        this.resolveAutomaticallyReplacedPathSegments()
        this.writeFileSync()
    }
}

const config = new ConfigResolve()
module.exports = { version, config }
