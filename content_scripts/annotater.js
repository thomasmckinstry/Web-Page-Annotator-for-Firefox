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
    let nodes = [];
    let node;
    for (node = start; node; node = getNextNode(node))
    {
        nodes.push(node);
        if (node == end)
            break;
    }

    return nodes;
}

function highlightTextReceived() {
    let selection = document.getSelection()
    let id = getId() // Will be used to identify the new <mark> and note in local storage
    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        window.alert("Can only highlight one range at a time.")
        return
    }
    let range = selection.getRangeAt(0)
    let start = range.startContainer
    let startOffset = range.startOffset
    let end = range.endContainer
    let endOffset = range.endOffset
    let storedNote = {
        type: "highlight",
        id: id,
        startData: start.textContent,
        endData: end.textContent,
        startOffset: startOffset,
        endOffset: endOffset,
        content: range.toString(),
    }
    highlightText(`annotater${id}${url}`, start, end, startOffset, endOffset)
    localStorage.setItem(`annotater${id}${url}`, JSON.stringify(storedNote))
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", parseInt(localStorage.getItem("annotationCount")) + 1)
    }
    try {
        browser.runtime.sendMessage({type: "highlight-text", id: `annotater${id}${url}`, content: storedNote.content})
    } catch (err) {
        console.log("Sidebar is closed. Note saved successfully.")
    }
}

function highlightText(id, start, end, startOffset, endOffset) {
    let startClone = start.cloneNode()
    let endClone = end.cloneNode()
    let mark = document.createElement("mark")
    if (start.isEqualNode(end) && start.nodeType == Node.TEXT_NODE) {
        mark.setAttribute("id", id)
        mark.className = "highlight"
        let startText = document.createTextNode(startClone.textContent.substring(0, startOffset))
        let endText = document.createTextNode(endClone.textContent.substring(endOffset))
        let markText = document.createTextNode(startClone.textContent.substring(startOffset, endOffset))
        mark.appendChild(markText)
        start.parentNode.replaceChild(endText, start)
        endText.parentNode.insertBefore(mark, endText)
        mark.parentNode.insertBefore(startText, mark)
        return endText
    }
    let nodes = getNodesInRange(start, end)
    nodes.forEach((node) => {
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(mark.parentNode)) {
            mark = document.createElement("mark")
            mark.className = "highlight"
            mark.setAttribute("id", id)
            node.parentNode.replaceChild(mark, node)
        }
        mark.appendChild(node)
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            mark.parentNode.insertBefore(newText, mark)
        } else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            mark.parentNode.replaceChild(newText, mark)
            newText.parentElement.insertBefore(mark, newText)
        }
    })
    return mark
}

function annotateTextReceived() {
    let selection = document.getSelection()
    let note = prompt("Enter Note.")
    let id = getId()
    
    if (selection.rangeCount > 1)  {
        window.alert("Can only annotate one range at a time.")
        return
    }

    let range = selection.getRangeAt(0)
    let start = range.startContainer
    let startOffset = range.startOffset
    let end = range.endContainer
    let endOffset = range.endOffset
    let storedNote = {
        type: "note",
        id: id,
        startData: start.textContent,
        endData: end.textContent,
        startOffset: startOffset,
        endOffset: endOffset,
        annotation: note,
        content: range.toString(),
    }
    annotateText(`annotater${id}${url}`, start, end, startOffset, endOffset, note)
    localStorage.setItem(`annotater${id}${url}`, JSON.stringify(storedNote))
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", parseInt(localStorage.getItem("annotationCount")) + 1)
    }
    try {
        // TODO: range.toString() can return gibberish in certain cases (See phonetics) [Try changing the charset]
        browser.runtime.sendMessage({type: "annotate-text", id: `annotater${id}${url}`, content: storedNote.content, annotation: note})
    } catch (err) {
        console.log(err)
    }
}

function annotateText(id, start, end, startOffset, endOffset, note) {
    let startClone = start.cloneNode()
    let endClone = end.cloneNode()
    let span = document.createElement("span")
    span.className = "annotation"
    let popup = document.createElement("span")
    popup.className = "popup"
    popup.textContent = note
    popup.style.display = "none"
    popup.class = `annotater-popup${id}`
    span.setAttribute("id", id)
    if (start.isEqualNode(end) && start.nodeType == Node.TEXT_NODE) {
        let startText = document.createTextNode(startClone.textContent.substring(0, startOffset))
        let endText = document.createTextNode(endClone.textContent.substring(endOffset))
        let spanText = document.createTextNode(startClone.textContent.substring(startOffset, endOffset))
        span.appendChild(spanText)
        start.parentNode.replaceChild(endText, start)
        endText.parentNode.insertBefore(span, endText)
        span.parentNode.insertBefore(startText, span)
        span.parentNode.insertBefore(popup, span)
        span.addEventListener("mouseenter", () => {
            popup.style.display = "block"
        });
        span.addEventListener("mouseleave", () => {
            popup.style.display = "none"
        });
        return span 
    }
    let nodes = getNodesInRange(start, end)
    nodes.forEach((node) => {
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(span.parentNode)) {
            span = document.createElement("span")
            span.className = "annotation"
            span.setAttribute("id", id)
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
            let newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            span.parentNode.insertBefore(newText, span)
        } else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            span.parentNode.replaceChild(newText, span)
            newText.parentElement.insertBefore(span, newText)
        }
    })
    span.parentElement.insertBefore(popup, span)
    return span
}

function getId() {
    let note = localStorage.getItem(`annotater0${url}`)
    let id = 0;

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
        if (notes.get(currKey).startData === node.textContent) {
            return currKey
        }
        currKey = iter.next().value
    }
    return null
}

function findEnd(start, endData, content) {
    let node = start;
    while (node != null) {
        if (node.data === endData) {
            return node
        } else if (!content.includes(node.textContent) && node.nodeType == Node.TEXT_NODE) {
            break;
        }
        node = getNextNode(node)
    }
    return null;
}

// TODO: This is broken. Not sure what causes it to not work. Need to diagnose.
// Seems like some non-text elements cause problems.
function reannotate() {
    let notes = new Map();
    for (i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)
        if (key.includes("annotater") && key.includes(url)) {
            notes.set(key, JSON.parse(localStorage.getItem(key)))
        }
    }
    let body = document.body;
    let node = body.firstChild
    while (node != null && notes.size > 0) {
        let key = checkAnnotatedNode(node, notes)
        if (key) {
            let note = JSON.parse(localStorage.getItem(key))
            let end = findEnd(node, note.endData, note.content)
            if (end == null) {
                node = getNextNode(node)
                continue
            }
            else if (note.type == "highlight") {
                node = highlightText(key, node, end, note.startOffset, note.endOffset)
            } else {
                node = annotateText(key, node, end, note.startOffset, note.endOffset, note.annotation)
            }
            notes.delete(key)
        }
        node = getNextNode(node)
    }
}

function scrollToNote(id) {
    let element = document.getElementById(id)
    element.scrollIntoView()
}

function deleteNote(id) {
    for (i = 0; i < localStorage.length; i++) {
        console.log(localStorage.key(i))
        if (id == localStorage.key(i)) {
            localStorage.removeItem(localStorage.key(i))
            break;
        }
    }
}

function editNote(id, note) {
    let storedNote = JSON.parse(localStorage.getItem(id))
    storedNote.annotation = note
    localStorage.setItem(id, JSON.stringify(storedNote))
}

function changeColor(type, value) {
    // This block taken from https://developer.mozilla.org/en-US/docs/Web/API/Document/styleSheets
    let sheet
    for (i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].title === "annotater") {
            sheet = document.styleSheets[i]
            break;
        }
    }
    
    switch(type) {
        case "highlight":
            sheet.deleteRule(0)
            sheet.insertRule(`.highlight { background: ${value}; }`, 0)
            break;
        case "annotation":
            sheet.deleteRule(1)
            sheet.insertRule(`.annotation { text-shadow: 0 0 0.2em ${value}; }`, 1)
            break;
    }
}

browser.runtime.onMessage.addListener((command, tab) => {
    switch (command.type) {
        case "highlight-selection":
            highlightTextReceived()
            break;
        case "annotate-selection":
            annotateTextReceived()
            break;
        case "refresh-sidebar":
            refreshSidebar()
            break;
        case "scroll-to-note":
            scrollToNote(command.id)
            break;
        case "delete-note":
            deleteNote(command.id)
            break;
        case "edit-note":
            editNote(command.id, command.note)
            break;
        case "highlight-color-change":
            changeColor("highlight", command.note)
            break;
        case "annotate-color-change":
            changeColor("annotation", command.note)
            break;
    }
})

function modifyStylesheet() {
    let head = document.getElementsByTagName("head")[0]
    let style = document.createElement("style")
    style.id = "annotater-stylesheet"
    style.title = "annotater"
    let css = `
        .highlight {
            background: yellow;
        }

        .annotation {
            text-shadow: 0 0 0.2em #ff4500;
        }

        .popup {
            background-color: white;
            border: solid;
            border-color: black;
            border-width: 1px;
            border-radius: 5px;
            padding-left: 10px;
            padding-right: 10px;
            position: absolute;
            font-family: Arial, Helvetica, sans-serif;
            box-sizing: border-box;
            box-shadow: 0px 5px 5px -2px dimgrey;
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
modifyStylesheet()
reannotate()