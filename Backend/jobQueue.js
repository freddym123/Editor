const Queue = require('bull');
const {execute} = require('./execute');
const jobQueue = new Queue('job-queue');
const NUM_WORKERS = 5;
const Job = require('./job')

jobQueue.process(NUM_WORKERS, async({data})=>{
    const {id: jobId} = data;
    const job = await Job.findById(jobId);

    if(job === undefined){
        throw Error('job not found');
    }
    try{
        job['startedAt'] = new Date();
        const output = await execute(job.filepath);

        job['completedAt'] = new Date();
        job['status'] = 'success';
        job['output'] = output;

        await job.save();
       
    }
    catch(err){
        job['completedAt'] = new Date();
        job['status'] = 'error';
        job['output'] = JSON.stringify(err);
        await job.save();
        console.log(job)
        //res.status(500).json(err)
    }
    
})

jobQueue.on('failed', (error)=>{
    console.log(error.data.id, "failed", error.failedReason)
})

const addJobToQueue = async(jobId)=>{
    await jobQueue.add({id: jobId})
}

module.exports = {
    addJobToQueue
}