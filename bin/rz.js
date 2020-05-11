#!/usr/bin/env node

// @ts-ignore
const program = require('commander')
const { version, config } = require('../config/wrzsz.config')

program
    .description('// TODO unimplemented')
    .version(version, '-v, --version', 'output the current version')

program.arguments('<file>')
    .action((file, options) => {
        console.log('Command not implemented.')
    })

async function app () {
    await config.initialize()
    program.parse(process.argv)
    if (!process.argv.slice(2).length) {
        program.outputHelp()
    }
}

app()
