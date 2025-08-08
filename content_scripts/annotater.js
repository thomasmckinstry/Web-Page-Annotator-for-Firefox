let domain;
let url;

function getNextNode(node) // Taken from https://stackoverflow.com/a/7931003
{
    if (node.firstChild)
        return node.firstChild;
    while (node)
    {
        if (node.nextSibling)
            return node.nextSibling;
        node = node.parentNode;
    }
}

function getNodesInRange(start, end) // Partially taken from https://stackoverflow.com/a/7931003
{
    var nodes = [];
    var node;
    for (node = start; node; node = getNextNode(node))
    {
        nodes.push(node);
        if (node == end)
            break;
    }

    return nodes;
}

// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    var selection = document.getSelection()
    var id = getId() // Will be used to identify the new <mark> and note in local storage
    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        window.alert("Can only highlight one range at a time.")
        return
    }
    var range = selection.getRangeAt(0)
    var start = range.startContainer
    var startOffset = range.startOffset
    var end = range.endContainer
    var endOffset = range.endOffset
    highlightText(id, start, end, startOffset, endOffset)
    let note = [`annotater${id}${url}`, `{ "type": "highlight", "range": "${range}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`]
    // TODO: Do I need startNode/endNode/startOffset/endOffset if that is all contained in range.
    // TODO: This does not put in identifiable information for the nodes. (Look at JSON.stringify())
    localStorage.setItem(note[0], note[1])
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics)
        browser.runtime.sendMessage({type: "highlight-text", id: `${id}`, content: range.toString()})
    } catch (err) {
        console.log("Sidebar is closed. Note saved successfully.")
    }
}

function highlightText(id, start, end, startOffset, endOffset) {
    var startClone = start.cloneNode()
    var endClone = end.cloneNode()
    var mark = document.createElement("mark")
    mark.setAttribute("annotaterId", id)
    if (start.isEqualNode(end) && start.nodeType == Node.TEXT_NODE) {
        var startText = document.createTextNode(startClone.textContent.substring(0, startOffset))
        var endText = document.createTextNode(endClone.textContent.substring(endOffset))
        var markText = document.createTextNode(startClone.textContent.substring(startOffset, endOffset))
        mark.appendChild(markText)
        start.parentNode.replaceChild(endText, start)
        endText.parentNode.insertBefore(mark, endText)
        mark.parentNode.insertBefore(startText, mark)
        return   
    }
    var nodes = getNodesInRange(start, end)
    nodes.forEach((node) => {
        mark = document.createElement("mark")
        node.parentNode.replaceChild(mark, node)
        mark.appendChild(node)
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            console.log("Start offset", node, startOffset)
            var newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            mark.parentNode.insertBefore(newText, mark)
        } else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            console.log("End offset", node, endOffset)
            var newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            mark.parentNode.replaceChild(newText, mark)
            newText.parentElement.insertBefore(mark, newText)
        }
    })
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
    // TODO: Actually implement the popup.
    localStorage.setItem(`annotater${id}${url}`, `{ "type": "note", "range": "${range}", "annotation": "${note}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`)
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics) [Try changing the charset]
        browser.runtime.sendMessage({type: "annotate-text", id: `${id}`, content: range.toString(), annotation: note})
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

        if (key.includes("annotater") && key.includes(url)) {
            let item = JSON.parse(localStorage.getItem(key))
            if (item.type == "note") {
                browser.runtime.sendMessage({type: "annotate-text", id: key, content: item.content, annotation: item.note})
            } else {
                browser.runtime.sendMessage({type: "highlight-text", id: key, content: item.range}) // TODO: Modify this to comply localStorage schema
            }
        }
    }
}

function checkAnnotatedNode(node, notes) {
    let iter = notes.keys()
    let currKey = iter.next().value
    while (currKey != null) {
        console.log(notes.get(currKey))
        if (node.isEqualNode(notes.get(currKey).startNode)) {
            return currKey
        }
        currKey = iter.next().value
    }
    return null
}

function reannotate() {
    let notes = new Map();
    for (i = 0; i < localStorage.length; i ++) {
        let key = localStorage.key(i)
        if (key.includes("annotater")) {
            notes.set(key, JSON.parse(localStorage.getItem(key)))
        }
    }
    var body = document.body;
    var node = body.firstChild
    while (node != null) { // TODO: This is an infinite (or very slow) loop.
        let key = checkAnnotatedNode(node, notes)
        if (key) {
            let note = JSON.parse(localStorage.getItem(key))
            if (note.type == "highlight") {
                highlightText(note.id, note.start, note.startOffset, note.end, note.endOffset)
                annotateText(note.id, note.start, note.startOffset, note.end, note.endOffset) // TODO: Actually implement annotateText
            }
        }
        node = getNextNode(node)
    }
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

website = window.location.href
url = website.substring(website.lastIndexOf("/"))
reannotate()