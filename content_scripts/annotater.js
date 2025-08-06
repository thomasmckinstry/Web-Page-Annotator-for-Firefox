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

function getNodesInRange(range) // Partially taken from https://stackoverflow.com/a/7931003
{
    var start = range.startContainer;
    var end = range.endContainer;
    var commonAncestor = range.commonAncestorContainer;
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
    var start = range.startContainer.cloneNode()
    var startOffset = range.startOffset
    var end = range.endContainer.cloneNode()
    var endOffset = range.endOffset
    console.log(start, end)
    var mark = document.createElement("mark")
    mark.setAttribute("annotaterId", id)
    try {
        range.surroundContents(mark)
    } catch(err) {
        var nodes = getNodesInRange(range)
        nodes.forEach((node) => {
            mark = document.createElement("mark")
            node.parentNode.replaceChild(mark, node)
            mark.appendChild(node)
            if (node.isEqualNode(start) && node.nodeType == Node.TEXT_NODE) {
                var newText = document.createTextNode(node.textContent.substring(0, startOffset))
                node.textContent = node.textContent.substring(startOffset)
                mark.parentNode.insertBefore(newText, mark)
            } else if (node.isEqualNode(end) && node.nodeType == Node.TEXT_NODE) {
                var newText = document.createTextNode(node.textContent.substring(endOffset))
                node.textContent = node.textContent.substring(0, endOffset)
                mark.parentNode.insertAfter(newText, mark)
            }
        })
    }
    // TODO: localStorage corresponds to top-level domains. So anything stored to wikipedia.com/wiki will appear on every subdomain. Fix by adding the url to saved data and checking before displaying to sidebar.
    localStorage.setItem(`annotater${id}${url}`, `{ "type": "highlight", "range": "${range}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`)
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
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
    // TODO: Actually implement the popup.
    localStorage.setItem(`annotater${id}${url}`, `{ "type": "note", "range": "${range}", "annotation": "${note}", "startNode": "${range.startContainer}", "endNode":"${range.endContainer}", "startOffset":"${range.startOffset}", "endOffset":"${range.endOffset}"}`)
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", localStorage.getItem("annotationCount") + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics) [Try changing the charset]
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

        if (key.includes("annotater") && key.includes(url)) {
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
    let notes = new Map();
    for (i = 0; i < localStorage.length; i ++) {
        let key = localStorage.key(i)
        if (key.includes("annotater")) {
            notes.set(key, JSON.parse(localStorage.getItem(key)))
        }
    }
    let body = document.body;
    // domTraverse(body)
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

url = window.location.href
console.log(url)
reannotate()