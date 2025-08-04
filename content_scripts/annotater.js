// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

function highlightText() {
    var selection = document.getSelection()
    var id = getId() // Will be used to identify the new <mark> and note in local storage

    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        window.alert("Can only highlight one range at a time.")
        return
    }
    var range = selection.getRangeAt(0)
    var mark = document.createElement("mark")
    mark.setAttribute("annotaterId", id)
    try {
        // TODO: Make this work across nodes.
        // See if this helps https://stackoverflow.com/questions/61840697/javascript-range-surroundcontents-catch-invalidstateerror
        range.surroundContents(mark)
        localStorage.setItem(`annotater${id}`, `{ "type": "highlight", "range": "${range}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`)
        if (localStorage.getItem("annotationCount") == null) {
            localStorage.setItem("annotationCount", 1)
        } else {
            localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
        }
    } catch(err) {
        window.alert(err)
        return
    }

    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics)
        browser.runtime.sendMessage({type: "highlight-text", id: `annotater${id}`, content: range.toString()})
    } catch (err) {
        console.log("Sidebar is closed. Note saved successfully.")
    }
}

// Similar process to highlightTextReceived
// Call a separate function annotateText(). Find the selection and place it all into a div.
// The event listeners will be added to the element that is created upon the annotation.
// Some style aspect should be changed to indicate that a section of text is annotated
// An additional popup has to exist to receive the note text.
function annotateTextReceived(request, sender, sendResponse) {
    var selection = document.getSelection()
    let note = prompt("Enter Note.")
    var id = getId()
    
    if (selection.rangeCount > 1)  {
        window.alert("Can only annotate one range at a time.")
        return
    }

    var range = selection.getRangeAt(0)

    localStorage.setItem(`annotater${id}`, `{ "type": "note", "range": "${range}", "annotation": "${note}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`)
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics)
        browser.runtime.sendMessage({type: "annotate-text", id: `annotater${id}`, content: range.toString(), annotation: note})
    } catch (err) {
        console.log(err)
    }
}

function getId() {
    var note = localStorage.getItem(`annotater0`)
    var id = 0;

    while (note != null) {
        id += 1
        note = localStorage.getItem(`annotater${id}`)
    }

    return id
}

function refreshSidebar() {
    for (i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)

        if (key.includes("annotater")) {
            let item = JSON.parse(localStorage.getItem(key))
            if (item.type == "note") {
                browser.runtime.sendMessage({type: "annotate-text", id: key, content: item.content, annotation: item.note})
            } else {
                browser.runtime.sendMessage({type: "highlight-text", id: key, content: item.range})
            }
        }
    }
}

function reannotate() {
    console.log
}

browser.runtime.onMessage.addListener((command, tab) => {
    switch (command) {
        case "highlight-selection":
            highlightTextReceived()
            break;
        case "annotate-selection":
            annotateTextReceived()
            break;
        case "refresh-sidebar":
            refreshSidebar()
    }
})

reannotate()