const fs = require('fs')
const inquirer = require('inquirer')
const { config } = require('./config')
const { encode } = require('./codec')
const { uploadFile } = require('./ssh2')

async function uploadLocalFile (files, options) {
    const params = { passwd: options.passwd }
    await checkLocalFile(files)
    await uploadLocalFileInquirer(files, params)
}

async function checkLocalFile (files) {
    files.forEach(file => {
        if (!fs.existsSync(file)) {
            console.error(`Error: cannot send ${file}: no such file`)
            process.exit()
        } else if (fs.statSync(file).isDirectory()) {
            console.error(`Error: cannot send ${file}: not a file`)
            process.exit()
        }
    })
}

async function uploadLocalFileInquirer (files, options) {
    historySelectInquirer(files, options)
}

async function historySelectInquirer (files, options) {
    const { history } = config.view
    if (history.size === 0) {
        return serverSelectInquirer(files, options)
    }
    const choices = [...history.values()]
    choices.push({ name: 'no' })
    inquirer.prompt([{
        type: 'list',
        name: 'result',
        message: 'Use recently target:',
        choices: choices
    }]).then((answers) => {
        if (Number.isInteger(answers.result)) {
            if (answers.result !== 0) {
                const dr = config.data.history.splice(answers.result, 1)[0]
                config.data.history.unshift(dr)
                config.needFlushRecordToFile()
            }
            const record = history.get(answers.result)
            resetPasswordInquirer(files, record, options)
        } else {
            return serverSelectInquirer(files, options)
        }
    })
}

async function serverSelectInquirer (files, options) {
    const { servers } = config.view
    if (servers.size === 0) {
        return serverInputInquirer(files, options)
    }
    const choices = [...servers.values()]
    choices.push({ name: 'no' })
    inquirer.prompt([{
        type: 'list',
        name: 'result',
        message: 'Use existing server:',
        choices: choices
    }]).then((answers) => {
        const sid = answers.result
        if (Number.isInteger(sid)) {
            return pathSelectInquirer(sid, files, options)
        } else {
            return serverInputInquirer(files, options)
        }
    })
}

async function serverInputInquirer (files, options) {
    const promptList = []
    promptList.push({ type: 'input', name: 'label', message: 'Input the host label:', default: 'VM_centos' })
    promptList.push({ type: 'input', name: 'host', message: 'Input the hostname:', default: '127.0.0.1' })
    promptList.push({ type: 'input', name: 'username', message: 'Input the username:', default: 'root' })
    promptList.push({ type: 'password', name: 'password', message: 'Input the password:' })
    inquirer.prompt(promptList).then(ans => {
        const server = { host: ans.host, username: ans.username, label: ans.label }
        server.password = encode(ans.password)
        config.data.servers.push(server)
        config.flushViewSync()
        config.needFlushRecordToFile({ sortHosts: true })
        const sid = config.view.servers.size - 1 // after fresh
        return pathSelectInquirer(sid, files, options)
    })
}

async function pathSelectInquirer (sid, files, options) {
    const promptList = [{ type: 'input', name: 'path', message: 'Input the upload directory:', default: '/root' }]
    inquirer.prompt(promptList).then(ans => {
        const dataRecord = { sid: sid, path: ans.path }
        config.data.history.unshift(dataRecord)
        config.flushViewSync()
        config.needFlushRecordToFile()
        const record = config.view.history.get(0)
        resetPasswordInquirer(files, record, options)
    })
}

async function resetPasswordInquirer (files, record, options) {
    if (!options.passwd) {
        // send file and save config
        return uploadFile(files[0], record.host, record.path)
    }
    const promptList = [{ type: 'password', name: 'password', message: 'Input the password:' }]
    inquirer.prompt(promptList).then(ans => {
        config.data.servers[record.sid].password = encode(ans.password)
        config.needFlushRecordToFile()
        // send file and save config
        record.host.password = ans.password
        return uploadFile(files[0], record.host, record.path)
    })
}

async function removeHostInquirer () {
    const { servers } = config.view
    const choices = [...servers.values()]
    await inquirer.prompt([{
        type: 'checkbox',
        name: 'result',
        message: 'Select host(s) to remove:',
        choices: choices
    }]).then((answers) => {
        config.needFlushRecordToFile({ removeHosts: answers.result })
    })
}

module.exports = { uploadLocalFile, removeHostInquirer }
