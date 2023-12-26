const cursor = document.querySelector('.cursor');
const lines = document.querySelector('.lines');
const textarea = document.querySelector('textarea');
const editor = document.querySelector('.editor-text');
const cursor_positioner = document.querySelector('.cursor-pos');
const cursor_positioner_div = document.querySelector('.cursor-pos-div');
const row_highlight = document.querySelector('.row-highlight');
const screenmodeBtn = document.querySelector('#screenmode');
const clearBtn = document.querySelector('.clear')
const runBtn = document.querySelector('#runBtn');
const output = document.querySelector('.output-text')
const fullScreenBtn = document.querySelector("#fullscreen")
const pairCount = {
    "'": 0,
    "\"": 0,
    
}

let editorDim = editor.getClientRects()[0];

const punctuation = ['.', ';','(',')','{','}'];


function slicePX(string){
    return string.slice(0,string.length-2);
}

let margin = (editor.clientWidth) - 40;

console.log(margin);



document.addEventListener('resize', ()=>{

})


const keywords = ['await','break ','case', 'catch', 'class',
    'const', 'continue', 'debugger','default ','delete ',
    'do','else','enum','export','extends',
    'false','finally','for','function','if',
    'implements','import','in','instanceof','interface',
    'let','new','null','package','private',
    'protected','public','return','super','switch',
    'static','this','throw','try','true',
    'typeof','var','void','while','with',
    'yield', 'console'];

function isKeyWord(text){
    let indexOfKeyword = keywords.indexOf(text);
    if(indexOfKeyword == -1){
        return false;
    }
    return text.endsWith(keywords[indexOfKeyword]);
}

console.log('\'dsdsfdfd\'fdfd'.split('\''));



function setRow(text){
    let index = text.indexOf('//');
    let comment = '';
    let rest = text;
    console.log(text);
    pairCount["'"] = 0;
    pairCount["\""] = 0;

    if(index != -1){
        rest = text.substring(0,index);
        comment = `<span class='text comment'>${text.substring(index)}</span>`
    }
    /*let strings = text.replace(/"([^"]*)"|"([^"]*)|'([^'])*'/g, (match)=>{
        return `<span class='text string'>${match}</span>`
    });*/

    let word = '';
    let rowText = '';
    let quoteMark = '';

    for(let i = 0; i < rest.length; i++){ // like a 'donut'in the sky
        if(rest[i] == ' '){
            if(word != ''){
                rowText += `<span class='text'>${word}</span>`;
            }
            rowText+= ' ';
            word = '';
        }else if(rest[i] == '\'' || rest[i] == '"'){
            if(rest[i] == '\''){
                pairCount["'"] += 1;
            }else{
                pairCount['"'] += 1;
            }
            quoteMark = rest[i];
            rowText += `<span class='text'>${word}</span>`;
            if(i == rest.length - 1){
                rowText += `<span class='text string'>${quoteMark}</span>`;
            }else if(!rest.includes(quoteMark, i+1)){
                rowText+= `<span class='text string'>${rest.substring(i)}</span>`
                i = rest.length - 1;
            }else{
                let index = rest.indexOf(quoteMark, i+1);
                let string = rest.substring(i, index+1);
                rowText+= `<span class='text string'>${string}</span>`;
                i = index;
                pairCount[quoteMark] += 1;
            }  
            word = '';
        }else if(punctuation.includes(rest[i])){
            rowText += `<span class='text'>${word}</span>`;
            rowText += `<span class='text'>${rest[i]}</span>`
            word = '';
        }else{
            word+=rest[i];
            if(keywords.includes(word) && i == rest.length-1){
                if(word == 'let' || word == 'var' || word == 'const'){
                    rowText += `<span class='text storage'>${word}</span>`;
                }else{
                    rowText += `<span class='text keyword'>${word}</span>`;
                }
                word = '';
            }else if(keywords.includes(word) && !/[a-z]/i.test(rest[i+1])){
                if(word == 'let' || word == 'var' || word == 'const'){
                    rowText += `<span class='text storage'>${word}</span>`;
                }else{
                    rowText += `<span class='text keyword'>${word}</span>`;
                }
                word = '';
            }else if(!isNaN(word) && !/[0-9]/i.test(rest[i+1])){
                rowText += `<span class='text number'>${word}</span>`;
                word = '';
            }
        }
    }

    if(word == ''){
    }else{
        rowText += `<span class='text'>${word}</span>`;
    }
    
    

    return rowText + comment;

}

function setPage(){
    const editor = document.querySelector('.editor-text');
    const rows = editor.querySelectorAll('.row');
    rows.forEach((row)=>{
        let rowText = '';
        for(let i = 0; i < row.childElementCount; i++){
            rowText += row.children[i].textContent;
        }
        console.log(rowText);
        row.innerHTML = setRow(rowText);

    })
}

function setOutput(outputText, filepath, status){


    let rowsText;
    
    const newFilepath = filepath.replace(/C:\\Users\\fredd\\Documents\\projects\\backend\\backend\\/i, '');
    let text = `<div class="row"><span class='comment'>node \\${newFilepath}</span></div>`;
    

    if(status == 'error'){
        const {stderr, output} = JSON.parse(outputText);
        rowsText = output.split('\n');
        for(let i = 0; i < rowsText.length - 1; i++){
            text += `<div class='row'><span>${rowsText[i]}</span></div>`;
        }
        text += '<div class="row"><span class="err">ERROR!</span></div>';
        let errorText = stderr.split('\n');
        text += `<div class="row"><span class='comment'>${errorText[0].split('codes\\')[1]}</span></div>`;
        for(let i = 1; i < 5; i++){
            text+= `<div class="row"><span class='err'>${errorText[i]}</span></div>`
        }
    }else{
        rowsText = outputText.split('\n');
        for(let i = 0; i < rowsText.length - 1; i++){
            text += `<div class='row'><span>${rowsText[i]}</span></div>`;
        }
    }

    output.innerHTML = text;
}

function name(){

}



document.addEventListener('load', setPage);

runBtn.addEventListener('click', async (event)=>{
    event.preventDefault();
    const rows = editor.querySelectorAll('.row');
    let code = ''
    rows.forEach((row)=>{
        code += row.innerHTML.replace(/<span[^>]*>|<\/span>/g, '') + '\n';
    })
    let language = 'cpp';

    const payload = {
        language: 'js',
        code: code
    }

    const options = {
        method: "POST",
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify(payload)
    }

    runBtn.disabled = true;

    const res = await fetch('http://localhost:5000/run', options);
    const data = await res.json();
    
    if(data){
        runBtn.disabled = false;
    }
    let intervalID;

    intervalID = setInterval(async ()=>{
        let status = await fetch('http://localhost:5000/status?' + new URLSearchParams({id: data.jobId}))
        status = await status.json();
        console.log(status)
        const {success, job, error} = status

        if(success){
            const {status: jobStatus, output: jobOutput, filepath} = job
            if(jobStatus == 'pending') return;
            setOutput(jobOutput, filepath, jobStatus);
            clearInterval(intervalID)
        }else{
            console.log(error);
            clearInterval(intervalID);
            setOutput(error)
        }
    }, 1000)

    return false;
})

clearBtn.addEventListener('click', ()=>{
    const rows = editor.querySelectorAll('.row');
    for(let i = rows.length - 1; i > 0; i--){
        editor.removeChild(rows[i]);
    }
    console.log('hi')
    textarea.value = '';
    cursor_positioner.textContent = '';
    currentRow = editor.querySelector('.row');
    currentRow.innerHTML = '';
    cursor.style.top = '0';
    cursor.style.left = '4px';
    textarea.style.left = '4px';
    textarea.style.top ='0';
    row_highlight.style.top = '0px';
    lines.innerHTML = ` <div>1</div>`
})

screenmodeBtn.addEventListener('click', ()=>{
    const style = document.querySelector(':root');
    console.log(getComputedStyle(style).getPropertyValue('--current-foreground'));
    if(getComputedStyle(style).getPropertyValue('--current-foreground') == 'white'){
        style.style.setProperty('--current-foreground', 'var(--light-foreground)');
        style.style.setProperty('--current-background', 'var(--light-background)');
        style.style.setProperty('--current-editor-header', 'var(--light-editor-header)');
        style.style.setProperty('--current-border', 'var(--light-border)');
        style.style.setProperty('--current-header', 'var(--light-header)');
        style.style.setProperty('--current-button-color', 'var(--light-button-color)');
        style.style.setProperty('--current-comment', 'var(--light-comment)');
        style.style.setProperty('--current-keyword', 'var(--light-keyword)');
        style.style.setProperty('--current-storage', 'var(--light-storage)');
        style.style.setProperty('--current-cursor', 'var(--light-cursor)');
        style.style.setProperty('--current-string', 'var(--light-string)');
        style.style.setProperty('--current-thumb', 'var(--light-thumb)');

    }else{
        style.style.setProperty('--current-foreground', 'var(--dark-foreground)');
        style.style.setProperty('--current-background', 'var(--dark-background)');
        style.style.setProperty('--current-editor-header', 'var(--dark-editor-header)');
        style.style.setProperty('--current-border', 'var(--dark-border)');
        style.style.setProperty('--current-header', 'var(--dark-header)');
        style.style.setProperty('--current-button-color', 'var( --dark-button-color)');
        style.style.setProperty('--current-comment', 'var(--dark-comment)');
        style.style.setProperty('--current-keyword', 'var(--dark-keyword)');
        style.style.setProperty('--current-storage', 'var(--dark-storage)');
        style.style.setProperty('--current-cursor', 'var(--dark-cursor)');
        style.style.setProperty('--current-string', 'var(--dark-string)');
        style.style.setProperty('--current-thumb', 'var(--dark-thumb)');
    }
})
 

console.log(row_highlight);
let isClicked = false;
let currentRow = editor.querySelectorAll('.row')[(parseInt(slicePX(getComputedStyle(cursor).top)) / 21)];

console.log(currentRow);

console.log(parseInt(slicePX(getComputedStyle(cursor).top)) / 21);

let currentRowIndex;

const offsetTop = editor.offsetTop;
const offsetLeft = editor.offsetLeft;

console.log(offsetTop, offsetLeft);

editor.addEventListener('scroll', (e)=>{
    lines.scrollTop = editor.scrollTop
})


editor.addEventListener('click', (e)=>{
    console.log(e.target);
    console.log(e.pageX - offsetLeft + editor.scrollLeft)
    let rectWidth = null;

    const offsetYOfEditor = e.pageY + editor.scrollTop - offsetTop;
    const rows = editor.querySelectorAll('.row');
    const rowIndex = Math.floor(offsetYOfEditor / 21) < 0 ? 0 : Math.floor(offsetYOfEditor / 21);


    if(rows.length - 1 < rowIndex){
        return;
    }else{
        currentRow = rows[rowIndex];
        textarea.value = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');
        let rowText = textarea.value;
        
        
        let rowLength = currentRow.getClientRects();
        rowLength = offsetLeft + rowLength[0].width - 4;
        
        const offsetX = e.pageX - offsetLeft + editor.scrollLeft;
        
        if(offsetX > rowLength){
            cursor_positioner.textContent = textarea.value;
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }else{
            cursor_positioner.textContent = '';
            let rect = cursor_positioner.getClientRects()[0].width;

            let i = 0;
            while(rect < offsetX - 4 && i < rowText.length){
                cursor_positioner.textContent += rowText[i]
                rect = cursor_positioner.getClientRects()[0].width
                i++;
                console.log(rect, offsetX - 4)
            } 
            textarea.setSelectionRange(i, i); 
        }

        let rects = cursor_positioner.getClientRects(),
        lastRect = rects[rects.length - 1],
        left = lastRect.left-offsetLeft +lastRect.width + editor.scrollLeft;
        cursor.style.left = `${left}px`;
        textarea.style.left = `${left + 2}px`;

        cursor.style.top = rowIndex * 21 + 'px';
        row_highlight.style.top = cursor.style.top;
        row_highlight.style.width = editor.scrollWidth + 'px';
        textarea.style.top =  rowIndex * 21 + 'px';
        
        
    }

     

    
    
})

editor.addEventListener('click', setFocus);


function setFocus(){
    textarea.focus();
}

const previousWidth = editor.getClientRects()[0].width;

textarea.addEventListener('input', ()=>{
    const currentRowRect = currentRow.getClientRects()[0];
    console.log(editor.scrollWidth, currentRowRect.width + offsetLeft)
    if(editor.scrollWidth - 20 < currentRowRect.width + offsetLeft){
        row_highlight.style.width = editor.scrollWidth + 10 + 'px';
    }
    

    currentRow.innerHTML = setRow(textarea.value.replace(/\n/g, ''));
    console.log(textarea.value);
    cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n/g, "");

    cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
    cursor_positioner_div.style.left = `${currentRow.style.left}px`;
    
    let rects = cursor_positioner.getClientRects(),
    lastRect = rects[rects.length - 1],
    left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;

    cursor.style.left = `${left}px`;

    console.log(cursor.getClientRects()[0].left, editor.getClientRects()[0].left + editor.getClientRects()[0].width - 20)
    if( cursor.getClientRects()[0].x > editor.getClientRects()[0].x + editor.getClientRects()[0].width - 35){
        editor.scrollLeft += 10;
    }
})




textarea.addEventListener('keyup', (e)=>{
    setTimeout(()=>{cursor.style.animation = ''}, 500);

    textarea.value = textarea.value.replace('\n', '');
   
    if(e.key == 'Enter'){
        cursor_positioner.textContent = '';
        cursor.style.left = '4px';
        textarea.setSelectionRange(0,0);
    }else if(e.key == 'Backspace' && cursor_positioner.textContent == ''){
        
    }else{
        
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01");
        cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
        cursor_positioner_div.style.left = `${currentRow.style.left}px`

        
        let rects = cursor_positioner.getClientRects(),
        lastRect = rects[rects.length - 1],
        left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;
        cursor.style.left = `${left}px`;
        textarea.style.left = `${left}px`;
        
    }
    
})

function spanText(){
    let text = "";
    for(let i = 0; i < currentRow.childElementCount; i++){
        text += currentRow.children[i].textContent;
        if(currentRow.childElementCount - i == 1){
        }else{
            text += ' ';
        }
    }
    return text;
}


textarea.addEventListener('keydown', (e)=>{
    cursor.style.animation = 'none';
    console.log(e.key);
    textarea.value = textarea.value.replace(/\n/g, '');

    

    if(e.key == "Enter"){
        e.preventDefault();


        console.log(cursor.getClientRects()[0].y, editorDim.height );

        if(cursor.getClientRects()[0].y > editorDim.height){
            console.log('e')
            editor.scrollTop += 25;
        }

        editor.scrollLeft = 0;
        const newRow = document.createElement('div');
        const textAreaValue = textarea.value;
        newRow.classList.add('row');
        currentRow.after(newRow);
        currentRow.innerHTML = setRow(textAreaValue.substring(0, textarea.selectionStart));
        const rows = Array.from(editor.querySelectorAll('.row'));
        cursor.style.top = parseInt(slicePX(getComputedStyle(cursor).top)) + 21 + 'px';
        textarea.style.top = getComputedStyle(cursor).top;
        currentRow = rows[parseInt(slicePX(getComputedStyle(cursor).top)) / 21];
        row_highlight.style.top = getComputedStyle(cursor).top; 
        cursor_positioner.textContent = '';
        cursor.style.left = '4px';
        textarea.style.left = '4px';
        textarea.value = textAreaValue.substring(textarea.selectionStart).replace('\n', '');
        textarea.setSelectionRange(0,0);
        console.log(textarea.value);
        currentRow.innerHTML = setRow(textarea.value);

        let text = ''
        for(let i = 0; i < rows.length; i++){
            text += `<div>${i+1}</div>`;
        }
        lines.innerHTML = text;
        
    
    }else if(e.key == '"' && (!(pairCount['"'] % 2))){
        let index = textarea.selectionStart;
        textarea.value = textarea.value.substring(0,textarea.selectionStart) + '""' + textarea.value.substring(textarea.selectionStart)
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart-1).replace(/\n$/, "\n\x01");
        currentRow.innerHTML =setRow(textarea.value)
        e.preventDefault()
        textarea.selectionStart = index+1;
        textarea.selectionEnd = index+1;
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01")

    }else if(e.key == "'" && (!(pairCount["'"] % 2))){
        let index = textarea.selectionStart;
        textarea.value = textarea.value.substring(0,textarea.selectionStart) + "''" + textarea.value.substring(textarea.selectionStart)
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart-1).replace(/\n$/, "\n\x01");
        currentRow.innerHTML =setRow(textarea.value)
        textarea.selectionStart = index+1;
        textarea.selectionEnd = index+1;
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01")
        
        e.preventDefault()

    }else if(e.key=="["){
        let index = textarea.selectionStart;
        textarea.value = textarea.value.substring(0,textarea.selectionStart) + "[]" + textarea.value.substring(textarea.selectionStart)
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart-1).replace(/\n$/, "\n\x01");
        currentRow.innerHTML =setRow(textarea.value)
        textarea.selectionStart = index+1;
        textarea.selectionEnd = index+1;
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01")
        e.preventDefault()

    }else if(e.key=="{"){
        let index = textarea.selectionStart;
        textarea.value = textarea.value.substring(0,textarea.selectionStart) + "{}" + textarea.value.substring(textarea.selectionStart)
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart-1).replace(/\n$/, "\n\x01");
        currentRow.innerHTML =setRow(textarea.value)
        textarea.selectionStart = index+1;
        textarea.selectionEnd = index+1;
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01")
        e.preventDefault()

    }else if(e.key == 'Backspace' && cursor_positioner.textContent == ''){

        if((currentRow.getClientRects()[0].width % editor.getClientRects()[0].width) > 0){
            editor.scrollLeft -= 10;
        }
        
        if(parseInt(slicePX(getComputedStyle(row_highlight).top)) != 0){
            e.preventDefault();

            const newIndex = parseInt(slicePX(getComputedStyle(cursor).top)) - 21;

            
            
            const rows = editor.querySelectorAll('.row'); 

            editor.removeChild(currentRow);
            currentRow = rows[newIndex / 21];

            let newText = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');

            cursor_positioner.textContent = newText;
            let cursorPos = newText.length;

            let rects = cursor_positioner.getClientRects(),
            lastRect = rects[rects.length - 1],
            left = lastRect.width + 4;
            cursor.style.left = `${left}px`;
            cursor.style.top = newIndex + 'px';
            textarea.style.top = newIndex + 'px';
            textarea.style.left = `${left}px`;
            row_highlight.style.top = newIndex + 'px';

            newText = newText + textarea.value;
            

            console.log(newText);
        
            currentRow.innerHTML = setRow(newText.replace('\n', ''));
            textarea.value = newText;
            textarea.setSelectionRange(cursorPos,cursorPos)

            editor.scrollLeft = left - 100;
    
            let text = '';
            for(let i = 0; i < rows.length - 1; i++){
                text += `<div>${i+1}</div>`;
            }
            lines.innerHTML = text;
        }
    }else if(e.key == 'ArrowLeft' && parseInt(slicePX(getComputedStyle(cursor).top)) / 21 != 0  && cursor_positioner.textContent.length == ''){
        const newIndex = parseInt(slicePX(getComputedStyle(cursor).top)) - 21;

        const rows = editor.querySelectorAll('.row');
        currentRow = rows[newIndex / 21];
        
        
        
        

        let newText = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');
        
        
        console.log(currentRow);
        
        textarea.value = newText;
        textarea.setSelectionRange(newText.length,newText.length);
        cursor_positioner.textContent = newText;
        
        let rects = cursor_positioner.getClientRects(),
        lastRect = rects[rects.length - 1],
        left = lastRect.width + 4;
        cursor.style.left = `${left}px`;
        textarea.style.left = `${left}px`;
        
        let scrollPos = left - 200
        if(scrollPos < editorDim.width){
            editor.scrollLeft = 0;
        }else{
            editor.scrollLeft = left - 200;
        }

    


        cursor.style.top = newIndex + 'px';
        row_highlight.style.top =  getComputedStyle(cursor).top;
        textarea.style.top = newIndex + 'px';


        e.preventDefault();
    }else if(e.key == 'ArrowRight' && parseInt(slicePX(getComputedStyle(cursor).top)) / 21 < editor.querySelectorAll('.row').length - 1 && cursor_positioner.textContent.length == textarea.value.length){
        
        cursor_positioner.textContent = '';
        cursor.style.left = '4px';
        textarea.style.left = '4px';
        const rows = editor.querySelectorAll('.row');
        cursor.style.top = parseInt(slicePX(getComputedStyle(cursor).top)) + 21 + 'px';
        textarea.style.top = cursor.style.top;
        editor.scrollLeft = 0;
        currentRow = rows[parseInt(slicePX(getComputedStyle(cursor).top)) / 21];
        row_highlight.style.top = getComputedStyle(cursor).top;

        let newText = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');

        textarea.value = newText;
        currentRow.innerHTML = setRow(newText);
        textarea.setSelectionRange(0,0);
        
        e.preventDefault();
        
    }else if(e.key == 'ArrowUp' && parseInt(slicePX(getComputedStyle(cursor).top)) / 21 != 0){
        e.preventDefault();
        
        if(cursor.getClientRects()[0].y < editorDim.y + 20){
            console.log('e')
            editor.scrollTop -= 25;
        }
        
        console.log(e.key);
        let oldText = '';
        for(let i = 0; i < currentRow.childElementCount; i++){
            oldText += currentRow.children[i].textContent;
        }
        const rowTopOffset = parseInt(slicePX(getComputedStyle(cursor).top));
        const rows = editor.querySelectorAll('.row');
        currentRow = rows[(rowTopOffset - 21) / 21];
        let newText = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');

        let index = textarea.selectionStart;

        console.log(currentRow);
            
        textarea.value = newText;
        
        if(newText.length >= cursor_positioner.textContent.length){
            textarea.setSelectionRange(index,index);
        }else{
            cursor_positioner.textContent = newText;
            let rects = cursor_positioner.getClientRects(),
            lastRect = rects[rects.length - 1],
            left = lastRect.width + 4;
            console.log(left);
            
            textarea.setSelectionRange(newText.length, newText.length);
            textarea.style.left = `${left}px`;
            cursor.style.left = `${left}px`;
            editor.scrollLeft = left - 100;
        }
        cursor.style.top = rowTopOffset - 21 + 'px';
        textarea.style.top = rowTopOffset - 21 + 'px';
        row_highlight.style.top =  getComputedStyle(cursor).top;
        if( cursor.getClientRects()[0].left > editor.getClientRects()[0].left + editor.getClientRects()[0].width - 35){
            editor.scrollLeft += 10;
        }
    }else if(e.key == 'ArrowDown' && parseInt(slicePX(getComputedStyle(cursor).top)) / 21 < editor.querySelectorAll('.row').length - 1){
        e.preventDefault();

        if(cursor.getClientRects()[0].y > editorDim.height){
            console.log('e')
            editor.scrollTop += 25;
        }

        let oldText = '';
        for(let i = 0; i < currentRow.childElementCount; i++){
            oldText += currentRow.children[i].textContent;
        }
        const rowTopOffset = parseInt(slicePX(getComputedStyle(cursor).top));
        const rows = editor.querySelectorAll('.row');
        currentRow = rows[(rowTopOffset + 21) / 21];
        let newText = currentRow.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');

        let index = textarea.selectionStart;

        console.log(currentRow);
            
        textarea.value = newText;
        
        if(newText.length >= cursor_positioner.textContent.length){
            textarea.setSelectionRange(index,index);
        }else{
            cursor_positioner.textContent = newText;
            let rects = cursor_positioner.getClientRects(),
            lastRect = rects[rects.length - 1],
            left = lastRect.width + 4;
            
            
            textarea.setSelectionRange(newText.length, newText.length);
            textarea.style.left = `${left}px`;
            cursor.style.left = `${left}px`;
            console.log(left);
            editor.scrollLeft = left + 40;

            
        }
        cursor.style.top = rowTopOffset + 21 + 'px';
        textarea.style.top = rowTopOffset + 21 + 'px';
        row_highlight.style.top =  getComputedStyle(cursor).top;
        if( cursor.getClientRects()[0].left > editor.getClientRects()[0].left + editor.getClientRects()[0].width - 35){
            editor.scrollLeft += 10;
        }
    }else{
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01");

        cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
        cursor_positioner_div.style.left = `${currentRow.style.left}px`
        
        let rects = cursor_positioner.getClientRects(),
        lastRect = rects[rects.length - 1],
        left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;
        
        cursor.style.left = `${left}px`;
        textarea.style.left = `${left}px`;
        
        if(e.key == 'ArrowRight'){
            console.log(cursor.getClientRects()[0].x,editor.getClientRects()[0].x + editor.getClientRects()[0].width - 35)
            if( cursor.getClientRects()[0].x > editor.getClientRects()[0].x + editor.getClientRects()[0].width - 35){
                editor.scrollLeft += 10;
            }
        }else if(e.key == 'Backspace' || e.key == 'ArrowLeft'){
            if(cursor.getClientRects()[0].x < editor.getClientRects()[0].x  + 35){
                if(editor.scrollLeft < editorDim.width){
                    editor.scrollLeft = 0;
                }else{
                    editor.scrollLeft -= 20;
                }
                

            }
        }
    }

    
    
})








function closer(num1){
    let floorNum = Math.floor(num1)
    let ceilNum = Math.ceil(num1);
    let difference1 = Math.abs(floorNum - num1);
    let difference2 = Math.abs(ceilNum - num1);
    if(difference1 >= difference2){
        return ceilNum;
    }
    return floorNum;
}




function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
}


fullScreenBtn.addEventListener('click', toggleFullScreen)