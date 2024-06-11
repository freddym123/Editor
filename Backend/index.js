const express = require('express')
const {decode} = require('html-entities')
const cors = require('cors')
const mongoose = require('mongoose')
const {generateFile} = require('./generateFile')
const Job = require('./job')
const {addJobToQueue} = require('./jobQueue')

mongoose.connect('mongodb://127.0.0.1:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
},).then(()=>{console.log('Success')});


// Need to run redis on ubuntu to work

const app = express();

app.use(express.static('public'))
app.use(express.json())
app.use(cors());

app.get('/status', async (req, res)=>{
    
    const jobId = req.query.id;
    console.log('status requested', jobId)
    if(jobId == undefined){
        return res.status(400).json({success: false, error: 'missing id query'});
    }

    try{
        const job = await Job.findById(jobId);
       
        if(job == undefined){
            return res.status(404).json({success: false, error: 'invalid job Id'})
        }
        return res.status(200).json({success: true, job});
    }catch(err){
        console.log(err);
        return res.status(400).json({success: false, error: JSON.stringify(err)})
    }
})





app.post('/run', async (req, res)=>{

    console.log(req.body);
    const language = req.body.language;
    const code = decode(req.body.code);
    if(code == undefined){
       return res.status(400).json({success: false, error: 'Empty code body!'})
    }
    let job;
    try{
        const filepath = await generateFile(language, code)
        
        job = await new Job({language, filepath}).save();
        const jobId = job['_id']
        addJobToQueue(jobId);
        res.status(201).json({success: true, jobId})
        console.log(job)
    }catch(err){
        res.status(500).json({success: false, err: JSON.stringify(err)})
    }
        

    
})

app.listen(5000, ()=>{
    console.log('listening on port 5000')
})