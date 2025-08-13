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
    var selectedRange = selection.getRangeAt(0)
    var start = selectedRange.startContainer
    var startOffset = selectedRange.startOffset
    var end = selectedRange.endContainer
    var endOffset = selectedRange.endOffset
    let storedNote = {
        type: "highlight",
        id: id,
        startData: start.data,
        endData: end.data,
        startOffset: startOffset,
        endOffset: endOffset,
        content: selectedRange.toString()
    }
    highlightText(id, start, end, startOffset, endOffset)
    localStorage.setItem(`annotater${id}${url}`, JSON.stringify(storedNote))
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", parseInt(localStorage.getItem("annotationCount")) + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics)
        browser.runtime.sendMessage({type: "highlight-text", id: `${id}`, content: selectedRange.toString()})
    } catch (err) {
        console.log("Sidebar is closed. Note saved successfully.")
    }
}

function highlightText(id, start, end, startOffset, endOffset) {
    var startClone = start.cloneNode()
    var endClone = end.cloneNode()
    var mark = document.createElement("mark")
    if (start.isEqualNode(end) && start.nodeType == Node.TEXT_NODE) {
        mark.setAttribute("annotaterId", id)
        mark.className = "highlight"
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
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(mark.parentNode)) {
            mark = document.createElement("mark")
            mark.className = "highlight"
            mark.setAttribute("annotaterId", id)
            node.parentNode.replaceChild(mark, node)
        }
        mark.appendChild(node)
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            var newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            mark.parentNode.insertBefore(newText, mark)
        } else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            var newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            mark.parentNode.replaceChild(newText, mark)
            newText.parentElement.insertBefore(mark, newText)
        }
    })
}

// Similar process to highlightTextReceived
// Call a separate function annotateText(). Find the selection and place it all into a span.
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
    var start = range.startContainer
    var startOffset = range.startOffset
    var end = range.endContainer
    var endOffset = range.endOffset
    let storedNote = {
        type: "note",
        id: id,
        startData: start.data,
        endData: end.data,
        startOffset: startOffset,
        endOffset: endOffset,
        annotation: note,
        content: range.toString()
    }
    console.log(storedNote.range)
    annotateText(id, start, end, startOffset, endOffset, note)
    // TODO: This does not save a usable object, look into JSON.stringify()
    localStorage.setItem(`annotater${id}${url}`, JSON.stringify(storedNote))
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", parseInt(localStorage.getItem("annotationCount")) + 1) // TODO: This adds 1 to a string
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics) [Try changing the charset]
        browser.runtime.sendMessage({type: "annotate-text", id: `${id}`, content: range.toString(), annotation: note})
    } catch (err) {
        console.log(err)
    }
}

// Operates similarly to highlightText. Additional complication in that instead of <mark> selection must be placed in a <span> that has a script to popup the note that was made.
function annotateText(id, start, end, startOffset, endOffset, note) {
    console.log(id, note)
    var startClone = start.cloneNode()
    var endClone = end.cloneNode()
    var span = document.createElement("span")
    span.className = "annotation"
    var popup = document.createElement("span")
    popup.className = "popup"
    popup.textContent = note
    popup.class = `annotater-popup${id}`
    span.setAttribute("annotaterId", id)
    if (start.isEqualNode(end) && start.nodeType == Node.TEXT_NODE) {
        var startText = document.createTextNode(startClone.textContent.substring(0, startOffset))
        var endText = document.createTextNode(endClone.textContent.substring(endOffset))
        var spanText = document.createTextNode(startClone.textContent.substring(startOffset, endOffset))
        span.appendChild(spanText)
        start.parentNode.replaceChild(endText, start)
        endText.parentNode.insertBefore(span, endText)
        span.parentNode.insertBefore(startText, span)
        span.appendChild(popup)
        span.addEventListener("mouseenter", () => {
            popup.style.display = "block"
        });
        span.addEventListener("mouseleave", () => {
            popup.style.display = "none"
        });
        return   
    }
    var nodes = getNodesInRange(start, end)
    nodes.forEach((node) => {
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(span.parentNode)) {
            span = document.createElement("span")
            span.className = "annotation"
            span.setAttribute("annotaterId", id)
            node.parentNode.replaceChild(span, node)
            span.addEventListener("mouseenter", () => {
                popup.style.display = "block"
            });
            span.addEventListener("mouseleave", () => {
                popup.style.display = "none"
            })
        }
        span.appendChild(node)
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            var newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            span.parentNode.insertBefore(newText, span)
        } else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            var newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            span.parentNode.replaceChild(newText, span)
            newText.parentElement.insertBefore(span, newText)
        }
    })
    span.parentElement.replaceChild(popup, span) // TODO: Look at replacing this with "insertAdjacentElement"
    popup.parentElement.insertBefore(span, popup)
}

function getId() {
    var note = localStorage.getItem(`annotater0${url}`)
    var id = 0;

    while (note != null) {
        id += 1
        note = localStorage.getItem(`annotater${id}${url}`)
    }

    return id
}

function refreshSidebar() {
    for (i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)

        if (key.includes("annotater") && key.includes(url)) {
            let item = JSON.parse(localStorage.getItem(key))
            if (item.type == "note") {
                browser.runtime.sendMessage({type: "annotate-text", id: key, content: item.content, annotation: item.annotation})
            } else {
                browser.runtime.sendMessage({type: "highlight-text", id: key, content: item.content})
            }
        }
    }
}

function checkAnnotatedNode(node, notes) {
    let iter = notes.keys()
    let currKey = iter.next().value
    while (currKey != null) {
        if (notes.get(currKey).startData === node.data) {
            return currKey
        }
        currKey = iter.next().value
    }
    return null
}

function findEnd(start, endData) {
    var node;
    for (node = start; node; node = getNextNode(node))
    {
        if (node.data === endData)
            break;
    }
    return node;
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
            let end = findEnd(node, note.endData)
            if (note.type == "highlight") {
                highlightText(note.id, node, end, note.startOffset, note.endOffset)
            } else {
                annotateText(note.id, node, end, note.startOffset, note.endOffset, note.annotation)
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

function modifyStylesheet() {
    let head = document.getElementsByTagName("head")[0]
    let style = document.createElement("style")
    var css = `
        .highlight {
            background: yellow;
        }

        .annotation {
            text-shadow: 0 0 0.2em orange;
        }

        .popup {
            background-color: white;
            border: solid;
            border-color: black;
            border-width: 2px;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
        }   
    `
    if (style.styleSheet) {
        // Required for IE8 and below
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style)
}

website = window.location.href
url = website.substring(website.lastIndexOf("/"))
reannotate()
modifyStylesheet()