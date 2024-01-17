function cloneAnswerBlock() {
    const output = document.querySelector("#gpt-output");
    const template = document.querySelector("#chat-template");
    const clone = template.cloneNode(true);
    clone.id="";
    output.appendChild(clone);
    clone.classList.remove("hidden");
    return clone.querySelector(".message"); // dont return the div (parent), only <p class='message'> 
}


function addToLog(message) {
    const answerblock = cloneAnswerBlock();
    answerblock.innerText = message;
    return answerblock;
}

function getChatHistory() {
    const chatBlock = Array.from( document.querySelectorAll(".message:not(#chat-template .message)") );
    return chatBlock.map(block => block.innerHTML);
    // innerText : "test \n test2"
    // innerHTML : "test <br> test2"
}



async function fetchPromptResponse(){
    // https://developer.mozilla.org/en-US/docs/Web/API/fetch
    const response = await fetch("/prompt",{ // fetch is sending a POST request to the "/prompt" endpoint
        method:'POST',
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({"messages": getChatHistory()}),
    })

    return response.body.getReader() //then we wait for the response
}

async function readResponseChunks(reader, gptOutput) {
    const decoder = new TextDecoder(); // convert in letter
    const converter = new showdown.Converter(); //convert for html

    let chunks = "";
    while (true) {
        const {done, value} = await reader.read();
        if (done) {break}
        chunks += decoder.decode(value);
        gptOutput.innerHTML = converter.makeHtml(chunks);
    }
}


// The DOMContentLoaded event is fired when the initial HTML document has been completely loaded and parsed,
// without waiting for stylesheets,
// images, and subframes to finish loading.
document.addEventListener("DOMContentLoaded", ()=> {
    const form = document.querySelector("#prompt-form");
    const spinnerIcon = document.querySelector("#spinner-icon");
    const sendIcon = document.querySelector("#send-icon");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        spinnerIcon.classList.remove("hidden")
        sendIcon.classList.add("hidden")

        const prompt = form.elements["prompt"].value;
        form.elements["prompt"].value = "";
        addToLog(prompt)

        try {
            const gptOutput = addToLog("GPT est en train de réfléchir...");
            const reader = await fetchPromptResponse(prompt); 
            await readResponseChunks(reader, gptOutput);
        } catch (error) {
            console.error('Une erreur est survenue:', error);
        } finally {
            spinnerIcon.classList.add("hidden");
            sendIcon.classList.remove("hidden");
            hljs.highlightAll();
        }

    });
});










