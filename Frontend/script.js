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
const fileUpload = document.querySelector("#script-upload")
const downloadBtn = document.querySelector("#download")
const selectStartDiv = document.querySelector(".cursor-select-start")
const selectStartSpan = document.querySelector(".cursor-select-start-text")
const selectEndDiv = document.querySelector(".cursor-select-end")
const selectEndSpan = document.querySelector(".cursor-select-end-text")
const pairCount = {
    "'": 0,
    "\"": 0,
}

let mousemoveHandler = null

let selectStart = null
let selectEnd = null

function setEditorFromUpload(texts){
    const rows = editor.querySelectorAll('.row');
    let rowBefore = rows[rows.length - 1]
    console.log(rowBefore)
    console.log(rows)
    texts.forEach((text, index)=>{
        if(index < rows.length){
            rows[index].innerHTML = setRow(text);
        }else{
            const newDiv = document.createElement("div")
            newDiv.classList.add("row")
            newDiv.innerHTML = setRow(text)
            rowBefore.after(newDiv)
            rowBefore = newDiv
        }
    })

    const newRows = editor.querySelectorAll('.row')
    setRowNumber(newRows.length)

}

function setRowNumber(length){
    let text = ''
    for(let i = 0; i < length; i++){
        text += `<div>${i+1}</div>`;
    }
    lines.innerHTML = text;
}

fileUpload.addEventListener("change", (e)=>{
    if(e.target.files[0]){
        const reader = new FileReader()
        reader.onload = (e)=>{
            const rowText = e.target.result.split('\n')
            setEditorFromUpload(rowText)
        }

        reader.readAsText(e.target.files[0])
    }
})

editor.addEventListener("paste", handlePaste)

downloadBtn.addEventListener("click",()=>{
    const rows = editor.querySelectorAll(".row")
    let link = document.createElement('a');
    link.download = "main.js"
    let code = ""
    rows.forEach((row)=>{
        code += row.innerHTML.replace(/<span[^>]*>|<\/span>/g, '') + '\n';
    })

    let blob = new Blob([code], {type: 'text/plain'})

    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)

})

class CurlyBracketLoc{
    constructor(row, x){
        this.row = row;
        this.x = x;
    }

    lessthan(other){
        return (other.x > this.x || other.row > this.row);
    }

    greaterthan(other){
        return(
            other.row < this.row || other.x < this.x
        )
    }
}

let editorDim = editor.getClientRects()[0];

const punctuation = [',', '.', ';','(',')','{','}'];


function slicePX(string){
    return string.slice(0,string.length-2);
}

let margin = (editor.clientWidth) - 40;

const keywords = ['log','await','break ','case', 'catch', 'class',
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

function setRow(text){
    /**
     *  Function sets the text of the active row in editor
     * 
     * @param{string} text The text that is placed on the active row of editor
     * @return{string} Returns a string which contains html to be used in innerHtml
     */
    let index = text.indexOf('//');
    let comment = '';
    let rest = text;
    let functionFound = false;  
    let params = false;
    pairCount["'"] = 0;
    pairCount["\""] = 0;

    if(index != -1){  // Checks if there is a single line comment. If there is it slices the text and saves the comment to be appended to the end
        rest = text.substring(0,index);
        comment = `<span class='text comment'>${text.substring(index)}</span>`
    }

    let word = '';
    let rowText = '';
    let quoteMark = '';

    for(let i = 0; i < rest.length; i++){ // Loops through the rest of the text which is not part of the comment and color codes it
        if(rest[i] == ' '){
            if(word != ''){
                if(params){
                    rowText += `<span class='text param'>${word}</span>`;
                }else{
                    rowText += `<span class='text'>${word}</span>`;
                }
                
            }
            rowText+= ' ';
            word = '';
        }else if(rest[i] == '\'' || rest[i] == '"'){
            functionFound = false
            
            if(rest[i] == '\''){
                pairCount["'"] += 1;
            }else{
                pairCount['"'] += 1;
            }
            quoteMark = rest[i];
            if(params){
                rowText += `<span class='text param'>${word}</span>`;
            }else{
                rowText += `<span class='text'>${word}</span>`;
            }
            
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
            params = false
        }else if(punctuation.includes(rest[i])){
            if(functionFound && rest[i] == "("){
                rowText += `<span class='text funcName'>${word}</span>`;
                params = true;
            }else{
                if(params){
                    rowText += `<span class='text param'>${word}</span>`;
                }else{
                    rowText += `<span class='text'>${word}</span>`;``
                }
                if(rest[i] != ","){params = false}
            }
            
            rowText += `<span class='text'>${rest[i]}</span>`
            word = '';
            functionFound = false
            
        }else{
            if(rest[i] == '<'){
                word+="&lt;"
            }else if(rest[i] == '>'){
                word += "&gt;"
            }else{
                word+=rest[i];
            }
            
            if(keywords.includes(word) && i == rest.length-1){
                if(word == 'let' || word == 'var' || word == 'const'){
                    rowText += `<span class='text storage'>${word}</span>`;
                }else{
                    rowText += `<span class='text keyword'>${word}</span>`;
                }

                if(word == "function"){
                    functionFound = true
                }else{
                    functionFound = false
                }
                console.log(functionFound)

                word = '';
            }else if(keywords.includes(word) && !/[a-z]/i.test(rest[i+1])){
                if(word == 'let' || word == 'var' || word == 'const'){
                    rowText += `<span class='text storage'>${word}</span>`;
                }else{
                    rowText += `<span class='text keyword'>${word}</span>`;
                }
                if(word == "function"){
                    functionFound = true
                }else{
                    functionFound = false
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
    
        row.innerHTML = setRow(rowText);

    })
}

function setOutput(outputText, filepath, status){
    /**
    * Displays the output text of code sent to compiler 
    * @param {string} outputText The output returned from backend compiler
    * @param {string} filepath The filepath where the js file is stored
    * @param {string} status The status returned from backend of executing the file
    * 
    */


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




document.addEventListener('DOMContentLoaded', setPage);

runBtn.addEventListener('click', async (event)=>{
    /**
     * Sends code in editor to server to be executed on click
     */
    event.preventDefault();
    const rows = editor.querySelectorAll('.row');
    let code = ''
    rows.forEach((row)=>{
        code += row.innerHTML.replace(/<span[^>]*>|<\/span>/g, '') + '\n';
    })

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

    console.log(data);
    
    if(data){
        runBtn.disabled = false;
    }
    let intervalID;

    intervalID = setInterval(async ()=>{
        let status = await fetch('http://localhost:5000/status?' + new URLSearchParams({id: data.jobId}))  // Fetches from backend until the file has been executed 
        status = await status.json();
        console.log(status);
        const {success, job, error} = status
        console.log(success);
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
    /**
     *  Clear both the editor and the output
     */
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
    /**
     * Switches from dark mode to light mode
     */
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
 
let isClicked = false;
let currentRow = editor.querySelectorAll('.row')[(parseInt(slicePX(getComputedStyle(cursor).top)) / 21)];


console.log(parseInt(slicePX(getComputedStyle(cursor).top)) / 21);

let currentRowIndex;

const offsetTop = editor.offsetTop;
const offsetLeft = editor.offsetLeft;

console.log(offsetTop, offsetLeft);

editor.addEventListener('scroll', (e)=>{
    lines.scrollTop = editor.scrollTop
})


function positionCursor(e){
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
}

editor.addEventListener('click', positionCursor)

editor.addEventListener('click', setFocus);

function removeSelect(){
    const selectRows = editor.querySelectorAll(".select")
    const toRemove = []
    for(let i = 0; i < selectRows.length; i++){
        if(selectRows[i].classList.length == 1){
            toRemove.push(selectRows[i])
        }
    }

    toRemove.forEach((element)=>{
        editor.removeChild(element)
    })
}

const select = (e, oldLeft, oldRow, oldX, oldText)=>{
    console.log("MoveEventActive")

    if(e.buttons == 0){
        editor.removeEventListener("mousemove", mousemoveHandler)
        return
    }
    positionCursor(e)
    const newLeft = parseFloat(slicePX(cursor.style.left))
    removeSelect()
    const newRow = parseInt(slicePX(getComputedStyle(cursor).top)) / 21
    const newX = textarea.selectionStart
    const rows = editor.querySelectorAll(".row")
    const selectRows = editor.querySelectorAll(".select")

    selectStart = {row: oldRow, x: oldX}
    selectEnd = {row: newRow, x: newX}

    if(newRow < oldRow){
        console.log("JEss")
        selectStartDiv.style.left = `0px`
        
        
        selectStartSpan.textContent = oldText.slice(0)


        for(let i = oldRow-1; i > newRow; i--){

            if(selectRows.length < oldRow - newRow + 1){
                console.log("Nicr")
                const newSelectRow = document.createElement("div")
                newSelectRow.classList.add("select")
                const span = document.createElement("span")
                newSelectRow.appendChild(span)
                const rect = rows[i].getClientRects()
                newSelectRow.style.width = `${rect[rect.length - 1].width}px`
                newSelectRow.style.height = "21px"
                editor.append(newSelectRow)
                newSelectRow.style.left = rows[i].style.left
                newSelectRow.style.top = `${i*21}px`
            }
        }
        selectEndDiv.style.left = `${newLeft}px`
        selectEndDiv.style.top = cursor.style.top
        selectEndSpan.textContent = getRowText(currentRow).slice(cursor_positioner.textContent.length)
        return
    }else if(newRow == oldRow){
        selectEndSpan.textContent = ''
    }else{
        console.log("JEss")
        selectStartDiv.style.left = `${oldLeft}px`
        selectStartSpan.textContent = getRowText(editor.querySelectorAll('.row')[oldRow]).slice(oldText.length)

        for(let i = oldRow+1; i < newRow; i++){

            if(selectRows.length < newRow - oldRow + 1){
                console.log("Nicr")
                const newSelectRow = document.createElement("div")
                newSelectRow.classList.add("select")
                const span = document.createElement("span")
                newSelectRow.appendChild(span)
                const rect = rows[i].getClientRects()
                newSelectRow.style.width = `${rect[rect.length - 1].width}px`
                newSelectRow.style.height = "21px"
                editor.append(newSelectRow)
                newSelectRow.style.left = rows[i].style.left
                newSelectRow.style.top = `${i*21}px`
            }
        }

        selectEndDiv.style.left = `0px`
        selectEndDiv.style.top = cursor.style.top
        selectEndSpan.textContent = cursor_positioner.textContent
        return
    }

    

    

    
    console.log(oldLeft, newLeft, typeof oldLeft, typeof newLeft)
    if(oldLeft<=newLeft){
        console.log("NoOOO")
        selectStartDiv.style.left = `${oldLeft-2}px`
        selectStartSpan.textContent = cursor_positioner.textContent.slice(oldText.length)
        console.log(selectStartSpan.textContent)
    }else{
        console.log("YEDD")
        selectStartDiv.style.left = `${newLeft-1}px`
        selectStartSpan.textContent = oldText.slice(cursor_positioner.textContent.length)
    }
}

editor.addEventListener("mouseup", ()=>{
    editor.removeEventListener("mousemove", mousemoveHandler)
})



editor.addEventListener("mousedown", (e)=>{
    positionCursor(e)
    selectStart = null
    selectEnd = null
    selectEndSpan.textContent = ''
    selectStartSpan.textContent = ''
    removeSelect()
    e.preventDefault()
    console.log(e)
    const oldLeft = parseFloat(slicePX(cursor.style.left))
    const oldRow = parseInt(slicePX(getComputedStyle(cursor).top)) / 21
    const oldX = textarea.selectionStart
    const oldText = cursor_positioner.textContent
    selectStartDiv.style.top = cursor.style.top
    selectStartDiv.style.left = cursor.style.left
    

    if(e.button == 0){
        mousemoveHandler = (e)=>{select(e, oldLeft, oldRow, oldX, oldText)}
        editor.addEventListener("mousemove", mousemoveHandler)
    }
    
})


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
        /*cursor_positioner.textContent = '';
        cursor.style.left = '4px';
        textarea.setSelectionRange(0,0);*/
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


function getRowText(row){
    return row.innerHTML.replace(/<span[^>]*>|<\/span>/g, '');
}

function openCount(currentRow, currentX){
    const rows = editor.querySelectorAll(".row")
    let i = 0
    const stack = []
    const containsMultiple = rows[currentRow].innerHTML.replace(/<span[^>]*>|<\/span>/g, '').includes("{", currentX)


    while(i <= currentRow){
        const text = rows[i].innerHTML.replace(/<span[^>]*>|<\/span>/g, '')
        const jMax = (containsMultiple && i == currentRow) ? currentX : text.length
        for(let j = 0; j < jMax; j++){
            if(text[j] == "{"){
                stack.push("{")
            }

            if(text[j] == "}"){
                stack.pop()
                
            }

           


        }

        i += 1
    }

    console.log("Mice", stack.length)
    return stack.length
}

function removeSelectText(){
    const rows = editor.querySelectorAll(".row")

    if(selectStart.row == selectEnd.row){
        const rowText = getRowText(rows[selectStart.row])
        if(selectStart.x < selectEnd.x){
            const newText = rowText.slice(0, selectStart.x) + rowText.slice(selectEnd.x)
            console.log(newText)
            textarea.value = newText
            textarea.setSelectionRange(selectStart.x, selectStart.x)
            rows[selectStart.row].innerHTML = setRow(newText)
            selectStartSpan.textContent = ''
            return
        }else{
            const newText = rowText.slice(0,selectEnd.x) + rowText.slice(selectStart.x)
            textarea.value = newText
            textarea.setSelectionRange(selectEnd.x, selectEnd.x)
            rows[selectStart.row].innerHTML = setRow(newText)
            selectStartSpan.textContent = ''
        }
        return
    }

    if(selectStart.row > selectEnd.row){
        const rowsToRemove = []
        const endRowText = getRowText(rows[selectEnd.row])
        const startRowText = getRowText(rows[selectStart.row])
        for(let i = selectEnd.row+1; i <= selectStart.row; i++){
            rowsToRemove.push(rows[i])
        }
        for(let i = 0; i < rowsToRemove.length; i++){
            editor.removeChild(rowsToRemove[i])
        }

        removeSelect()

        const newText = endRowText.slice(0,selectEnd.x) + startRowText.slice(selectStart.x)
        console.log(newText)
        textarea.value = newText
        textarea.setSelectionRange(selectEnd.x, selectEnd.x)
        rows[selectEnd.row].innerHTML = setRow(newText)
        selectStartSpan.textContent = ''
        selectEndSpan.textContent = ''
    }else if(selectStart.row < selectEnd.row){
        
        const rowsToRemove = []
        const endRowText = getRowText(rows[selectEnd.row])
        const startRowText = getRowText(rows[selectStart.row])
        for(let i = selectStart.row+1; i <= selectEnd.row; i++){
            rowsToRemove.push(rows[i])
        }
        for(let i = 0; i < rowsToRemove.length; i++){
            editor.removeChild(rowsToRemove[i])
        }
    
        removeSelect()

        currentRow = rows[selectStart.row]
        cursor.style.top = `${selectStart.row * 21}px`
        row_highlight.style.top = cursor.style.top
        const newText = startRowText.slice(0,selectStart.x) + endRowText.slice(selectEnd.x)
        console.log(newText)
        textarea.value = newText
        textarea.setSelectionRange(selectStart.x, selectStart.x)
        rows[selectStart.row].innerHTML = setRow(newText)
        selectStartSpan.textContent = ''
        selectEndSpan.textContent = ''
        
        
    }

    setRowNumber(editor.querySelectorAll(".row").length)
}

async function handlePaste(e){
    e.preventDefault()
    const toPasteText = (await navigator.clipboard.readText()).split("\r\n")
    let cursorRowIndex = parseInt(slicePX(getComputedStyle(cursor).top)) / 21
    const oldTextcursorIndex = textarea.selectionStart
    console.log(toPasteText)
    if(toPasteText.length == 1){
        const newStartText = textarea.value.slice(0,textarea.selectionStart) + toPasteText + textarea.value.slice(textarea.selectionStart)
        textarea.value = newStartText
        currentRow.innerHTML = setRow(newStartText)
        textarea.setSelectionRange(oldTextcursorIndex, oldTextcursorIndex)
        return
    }
    console.log(toPasteText)
    
    const newStartText = textarea.value.slice(0,textarea.selectionStart) + toPasteText[0].replace("\n", "")
    const cursorAfterText = textarea.value.slice(textarea.selectionStart)
    textarea.value = newStartText
    
    currentRow.innerHTML = setRow(newStartText)
    textarea.setSelectionRange(oldTextcursorIndex, oldTextcursorIndex)
    for(let i = 1; i < toPasteText.length-1; i++){
        let rows = editor.querySelectorAll(".row")
        const newRow = document.createElement("div")
        newRow.classList.add("row")
        newRow.innerHTML = setRow(toPasteText[i].replace("\n", ""))
        rows[cursorRowIndex].after(newRow)
        cursorRowIndex += 1

    }
    const rows = editor.querySelectorAll(".row")
    const newRow = document.createElement("div")
    newRow.classList.add("row")
    newRow.innerHTML = setRow(toPasteText[toPasteText.length-1].replace("\n", "") + cursorAfterText)
    rows[cursorRowIndex].after(newRow)
    setRowNumber(rows.length + 1)
}


function getSelectedText(){
    if(!selectStart && !selectEnd){
        return ''
    }
    const rows = document.querySelectorAll('.row')
    let textToCopy = ''

    if(selectStart.row == selectEnd.row){
        if(selectStart.x < selectEnd.x){
            textToCopy += textarea.value.slice(selectStart.x, selectEnd.x)
        }else{
            textToCopy += textarea.value.slice(selectEnd.x, selectStart.x)
        }
        return textToCopy
    }

    if(selectStart.row < selectEnd.row){
        const startRowText = getRowText(rows[selectStart.row]).slice(selectStart.x)
        textToCopy += startRowText

        for(let i = selectStart.row + 1; i < selectEnd.row; i++){
            textToCopy += "\n" + getRowText(rows[i])
        }

        const endRowText = getRowText(rows[selectEnd.row]).slice(0,selectEnd.x)
        textToCopy += "\n" + endRowText
        return textToCopy

    }else{
        const endRowText = getRowText(rows[selectEnd.row]).slice(selectEnd.x)
        
        textToCopy += endRowText

        for(let i = selectEnd.row + 1; i < selectStart.row; i++){
            textToCopy += "\n" + getRowText(rows[i])
        }

        const startRowText = getRowText(rows[selectStart.row]).slice(0, selectStart.x)
        textToCopy += "\n" + startRowText
        return textToCopy
    }
}


textarea.addEventListener('keydown', async (e)=>{
    /**
     * Handles what happens when specific keys are pressed 
     */
    cursor.style.animation = 'none';
    textarea.value = textarea.value.replace(/\n/g, '');
    console.log("Check select: ", selectStart, selectEnd)
    console.log(e.key)


    if(selectStart && selectEnd){
        if(e.key=="Control" || e.key == "c" && e.ctrlKey){
            if(e.ctrlKey && e.key == "c"){
                let textToCopy = getSelectedText()
                try{
                    await navigator.clipboard.writeText(textToCopy)
                }catch(err){
                    console.log("Failed to copy")
                }
                console.log(textToCopy)
            }
            
            return
        }else if(e.key == "x" && e.ctrlKey){
            let textToCopy = getSelectedText()
                try{
                    await navigator.clipboard.writeText(textToCopy)
                }catch(err){
                    console.log("Failed to copy")
                }
                removeSelectText()
                
        }
        else{
            removeSelectText()
        }
        
        selectStart = null
        selectEnd = null
    }
    

    if(e.key == "Enter"){
        e.preventDefault();
        let numberOfIndents = openCount(parseInt(slicePX(getComputedStyle(cursor).top)) / 21, textarea.selectionStart)
        console.log(numberOfIndents, "Jo")
        if(cursor.getClientRects()[0].y > editorDim.height){
            editor.scrollTop += 25;
        }

        editor.scrollLeft = 0;

        const newRow = document.createElement('div');
        const textAreaValue = textarea.value;
        newRow.classList.add('row');
        currentRow.after(newRow);
        if(textarea.selectionStart > 0 &&  textAreaValue[textarea.selectionStart-1] == "{"  && textAreaValue[textarea.selectionStart] == "}"){
            numberOfIndents += 1
            const secondRow = document.createElement("div")
            secondRow.classList.add("row")
            newRow.after(secondRow)
    
            currentRow.innerHTML = setRow(textAreaValue.substring(0, textarea.selectionStart));
            const rows = Array.from(editor.querySelectorAll('.row'));
            cursor.style.top = parseInt(slicePX(getComputedStyle(cursor).top)) + 21 + 'px';
            textarea.style.top = getComputedStyle(cursor).top;
            currentRow = rows[parseInt(slicePX(getComputedStyle(cursor).top)) / 21];
            row_highlight.style.top = getComputedStyle(cursor).top; 

            const splitText = textAreaValue.substring(textarea.selectionStart).replace('\n', '')
            console.log(splitText)
            const indexOfClose = splitText.indexOf("}")
            
            console.log(numberOfIndents)
            textarea.value = ''
            let tabs = ""
            let secondRowTabs = ""
            for(let i = 1; i <= numberOfIndents; i++){
                tabs += "\t"
                if(i < numberOfIndents){
                    secondRowTabs += "\t"
                }
            }
            textarea.value = tabs + splitText.slice(0, indexOfClose);
            cursor_positioner.innerHTML = textarea.value

            cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
            cursor_positioner_div.style.left = `${currentRow.style.left}px`
        
            let rects = cursor_positioner.getClientRects(),
            lastRect = rects[rects.length - 1],
            left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;
        
            cursor.style.left = `${left}px`;
            textarea.style.left = `${left}px`;

            cursor_positioner.textContent = textarea.value;
            textarea.setSelectionRange(numberOfIndents,numberOfIndents);
            currentRow.innerHTML = setRow(textarea.value);
            secondRow.innerHTML = setRow(secondRowTabs + splitText.slice(indexOfClose))
            
            setRowNumber(rows.length)
            return
        }else if(textAreaValue.indexOf("{") != -1 && textAreaValue[textarea.selectionStart - 1] != "}"){
            console.log("Freddy")
            const pastIndex = parseInt(slicePX(getComputedStyle(cursor).top)) / 21
            currentRow.innerHTML = setRow(textAreaValue.substring(0, textarea.selectionStart));
            const rows = Array.from(editor.querySelectorAll('.row'));
            cursor.style.top = parseInt(slicePX(getComputedStyle(cursor).top)) + 21 + 'px';
            textarea.style.top = getComputedStyle(cursor).top;
            currentRow = rows[parseInt(slicePX(getComputedStyle(cursor).top)) / 21];
            row_highlight.style.top = getComputedStyle(cursor).top; 
            
            const oldTextAreaIndex = textarea.selectionStart
            textarea.value = ''
            console.log(numberOfIndents)
            let tabs = ""
            for(let i = 1; i <= numberOfIndents; i++){
                tabs += "\t"
            }
            textarea.value = tabs + textAreaValue.substring(oldTextAreaIndex).replace('\n', '');
            cursor_positioner.innerHTML = tabs

            cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
            cursor_positioner_div.style.left = `${currentRow.style.left}px`
        
            let rects = cursor_positioner.getClientRects(),
            lastRect = rects[rects.length - 1],
            left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;
        
            cursor.style.left = `${left}px`;
            textarea.style.left = `${left}px`;
            textarea.setSelectionRange(numberOfIndents,numberOfIndents);
        
            currentRow.innerHTML = setRow(textarea.value);

            setRowNumber(rows.length)
            
            return
        }
        console.log("Good Night")
        
        currentRow.innerHTML = setRow(textAreaValue.substring(0, textarea.selectionStart));
        const rows = Array.from(editor.querySelectorAll('.row'));
        cursor.style.top = parseInt(slicePX(getComputedStyle(cursor).top)) + 21 + 'px';
        textarea.style.top = getComputedStyle(cursor).top;
        currentRow = rows[parseInt(slicePX(getComputedStyle(cursor).top)) / 21];
        row_highlight.style.top = getComputedStyle(cursor).top; 
        
        const oldTextAreaIndex = textarea.selectionStart
        textarea.value = ''
        console.log(numberOfIndents)
        let tabs = ""
        for(let i = 1; i <= numberOfIndents; i++){
            tabs += "\t"
        }
        textarea.value = tabs + textAreaValue.substring(oldTextAreaIndex).replace('\n', '');
        cursor_positioner.innerHTML = tabs

        cursor_positioner_div.style.top = `${currentRow.getClientRects().top - offsetTop}px`;
        cursor_positioner_div.style.left = `${currentRow.style.left}px`
        
        let rects = cursor_positioner.getClientRects(),
        lastRect = rects[rects.length - 1],
        left = lastRect.left-offsetLeft+lastRect.width + editor.scrollLeft;
        
        cursor.style.left = `${left}px`;
        textarea.style.left = `${left}px`;
        textarea.setSelectionRange(numberOfIndents,numberOfIndents);
        
        currentRow.innerHTML = setRow(textarea.value);
        

        setRowNumber(rows.length)
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

        {fdf
            dfd}

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

    }else if(e.key == "("){
        let index = textarea.selectionStart;
        textarea.value = textarea.value.substring(0,textarea.selectionStart) + "()" + textarea.value.substring(textarea.selectionStart)
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart-1).replace(/\n$/, "\n\x01");
        currentRow.innerHTML =setRow(textarea.value)
        textarea.selectionStart = index+1;
        textarea.selectionEnd = index+1;
        cursor_positioner.innerHTML = textarea.value.substring(0,textarea.selectionStart).replace(/\n$/, "\n\x01")
        e.preventDefault()
    }else if(e.key == 'Backspace' && cursor_positioner.textContent == ''){
        console.log(textarea.value)
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
    
            setRowNumber(rows.length - 1)
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
            console.log(textarea.value)
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



function toggleFullScreen() {
    /**
     * Method fullscreens the editor 
     **/
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