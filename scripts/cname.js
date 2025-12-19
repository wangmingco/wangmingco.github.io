const fs = require('fs');
const path = require('path');
console.log("Arguments:", process.argv.slice(2));

const cnameContent = 'blog.vc89.cn';

const cnamePath2 = path.resolve(__dirname, './CNAME');
fs.writeFileSync(cnamePath2, cnameContent);

const cnamePath1 = path.resolve(__dirname, '../CNAME');
fs.writeFileSync(cnamePath1, cnameContent);


