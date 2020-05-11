const path = require('path')
const inquirer = require('inquirer')
const { config } = require('../config/rcd.config')

function loadAutomaticallyReplacedPathSegments () {
    return config.resolveAutomaticallyReplacedPathSegments()
}

function replacePathSepUsingTheSettings (directory) {
    const settings = loadAutomaticallyReplacedPathSegments()

    directory = path.resolve(directory).split(path.sep).join('/')
    for (var i = 0; i < settings.length; i++) {
        directory = directory.replace(settings[i][0], settings[i][1])
    }

    return directory
}

function automaticallyReplacedShow () {
    const settings = loadAutomaticallyReplacedPathSegments()
    settings.forEach(e => { console.log(' ', e[0], '=>', e[1]) })
}

function automaticallyReplacedAddInquirer () {
    const fun = (val) => {
        if (typeof val === 'string' && val.length) return true
        return 'segments is not null'
    }

    const promptList = [
        { type: 'input', name: 'source', message: '添加源路径片段名:', validate: fun },
        { type: 'input', name: 'target', message: '指定替换路径片段:', validate: fun }
    ]

    inquirer.prompt(promptList).then(answers => {
        const settings = loadAutomaticallyReplacedPathSegments()
        settings.push([answers.source, answers.target])
        config.updateRecordToFileSync(settings)
    })

    // console.log(settings)
}

function automaticallyReplacedDelInquirer () {
    const settings = loadAutomaticallyReplacedPathSegments()
    const choices = settings.map((item, inx) => {
        return { name: item[0] + ' => ' + item[1], value: inx }
    })
    const promptList = [
        { type: 'checkbox', name: 'selected', message: '选择要移除的路径片段:', choices: choices }
    ]
    inquirer.prompt(promptList).then(answers => {
        // @ts-ignore
        const selected = answers.selected.reverse()
        for (let i = 0; i < selected.length; i++) { settings.splice(selected[i], 1) }
        config.updateRecordToFileSync(settings)
    })
}

module.exports = {
    replacePathSepUsingTheSettings,
    automaticallyReplacedShow,
    automaticallyReplacedAddInquirer,
    automaticallyReplacedDelInquirer
}
