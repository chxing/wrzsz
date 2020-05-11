#!/usr/bin/env node

// @ts-ignore
const program = require('commander')
const { version, config } = require('../config/rcd.config')
const { replacePathSepUsingTheSettings } = require('../common/rcd.service')
const { automaticallyReplacedShow } = require('../common/rcd.service')
const { automaticallyReplacedAddInquirer } = require('../common/rcd.service')
const { automaticallyReplacedDelInquirer } = require('../common/rcd.service')
const fs = require('fs')
const path = require('path')
const cmd = require('node-cmd')

program
    .description('// TODO unimplemented')
    .version(version, '-v, --version', 'output the current version')

program.arguments('<file>')
    .action((file, options) => {
        if (fs.existsSync(file)) {
            let directory = fs.statSync(file).isFile() ? path.dirname(file) : file
            directory = replacePathSepUsingTheSettings(directory)
            if (fs.existsSync(directory)) {
                console.error('open', directory)
                cmd.run('start /d"' + directory + '"')
            } else {
                console.error('not exists', directory)
            }
        }
    })

program
    .command('add')
    .description('add path segments to the config file')
    .action(async function () {
        automaticallyReplacedAddInquirer()
    })

program
    .command('remove').alias('rm')
    .description('remove specified path from the config file')
    .action(async function () {
        automaticallyReplacedDelInquirer()
    })

program
    .command('list').alias('ls')
    .description('list all automatically replaced path segments')
    .action(async function () {
        automaticallyReplacedShow()
    })

async function app () {
    await config.initialize()
    program.parse(process.argv)
    if (!process.argv.slice(2).length) {
        program.outputHelp()
    }
}

app()
