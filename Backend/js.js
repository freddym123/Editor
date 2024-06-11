async function random(number){
    let res =  await returnPromise(number);
    return {id: res};
}

function returnPromise(number){
    return new Promise((resolve)=>{
        resolve(number);
    })
}

let newPromise = random(4);
newPromise.then((data)=>{console.log(data)});
console.log(3);