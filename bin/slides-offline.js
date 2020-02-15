#!/usr/bin/env node

const main = require('../index');
const url = process.argv[2];
const dirName = process.argv[3];

if (!url) {
    console.error('URL not found');
    process.exit(-1);
}

main(url, dirName);