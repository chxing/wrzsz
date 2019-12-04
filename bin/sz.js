#!/usr/bin/env node

const program = require('commander')
const { version, config } = require('./config')
const { uploadLocalFile } = require('./action')
const { removeHostInquirer } = require('./action')

program
    .usage('[options] <file>')
    .arguments('<file>')
    .description('Send file with SSH protocol')
    .option('-p, --passwd', 'reset password when uploading a file')
    .version(version, '-v, --version')
    .action((file, options) => {
        const files = [file]
        uploadLocalFile(files, options)
    })

program
    .command('remove').alias('rm')
    .description('remove hosts from server records')
    .action(async function () {
        await removeHostInquirer()
        config.needFlushRecordToFile()
        config.flushRecordToFileSync()
    })

program
    .command('resize <num>').alias('rs')
    .description('reset the size of history records')
    .action(function (nnum) {
        const onum = config.data.histsize
        config.data.histsize = parseInt(nnum)
        config.needFlushRecordToFile()
        config.flushRecordToFileSync()
        console.log('histsize changed from %s to %s', onum, nnum)
    })

async function app () {
    await config.initialize()
    program.parse(process.argv)
    if (!process.argv.slice(2).length) {
        program.outputHelp()
    }
}

app()
