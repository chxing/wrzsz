#!/usr/bin/env node

// @ts-ignore
const { version } = require('../package.json')
const program = require('commander')
const { config } = require('./config')

program
    .description('// TODO unimplemented')
    .version(version, '-v, --version', 'output the current version')

program.arguments('<file>')
    .action((command, file) => {
    })

async function app () {
    await config.initialize()
    program.parse(process.argv)
    if (!process.argv.slice(2).length) {
        program.outputHelp()
    }
}

app()
