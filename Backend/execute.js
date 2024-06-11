const {exec} = require('child_process');
const fs = require('fs')
const path = require('path');

const outputPath = path.join(__dirname, 'outputs');

if(!fs.existsSync(outputPath)){
    fs.mkdirSync(outputPath, {recursive: true});
}

const execute = (filepath) =>{
    const jobId = path.basename(filepath)//C:\Users\fredd\Documents\projects\editor\backend\codes\ded9e5e6-8906-4ade-8b48-cb0ad9fbcfec.cpp
    const outPath = path.join(outputPath, `${jobId}.out`);
    return new Promise((resolve, reject)=>{
        console.log(filepath)
        exec(`node ${filepath}`,
             (error, stdout, stderr)=>{
                if(error){
                    reject({error,stderr,'output': stdout, 'filepath': jobId})
                }
                if(stderr){
                    reject({stderr, 'output': stdout, 'filepath': jobId})
                }
                resolve(stdout);
             })
    })
}

module.exports = {
    execute
}