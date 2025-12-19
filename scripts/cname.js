const fs = require('fs');
const path = require('path');
console.log("Arguments:", process.argv.slice(2));

const cnameContent = 'blog.vc89.cn';

const cnamePath = path.resolve(__dirname, '../dist/CNAME');
fs.writeFileSync(cnamePath, cnameContent);

const cnamePath1 = path.resolve(__dirname, '../CNAME');
fs.writeFileSync(cnamePath1, cnameContent);

const cnamePath2 = path.resolve(__dirname, './CNAME');
fs.writeFileSync(cnamePath2, cnameContent);