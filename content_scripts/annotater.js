let domain;
let url;

/**
 * Finds the node following a given node, for the purpose of iterating through the DOM.
 * @param node any node in the DOM
 * @returns The node in the DOM following the provided node
 */
function getNextNode(node) { // Taken from https://stackoverflow.com/a/7931003
    if (node.firstChild) {
        return node.firstChild;
    }
    while (node) {
        if (node.nextSibling)
            return node.nextSibling;
        node = node.parentNode;
    }
}

/**
 * Gives a list of nodes in a provided range.
 * @param start the first node of the range being found (usually range.startContainer)
 * @param end the last node of the range being found (usually range.endContainer)
 * @returns a list of all nodes in the range.
 */
function getNodesInRange(start, end) { // Partially taken from https://stackoverflow.com/a/7931003
    let nodes = [];
    let node;
    for (node = start; node; node = getNextNode(node)) {
        nodes.push(node);
        if (node == end)
            break;
    }
    return nodes;
}

/** // TODO: Combine this with annotateTextReceived to minimize repetition. Should only need to add an argument and an attribute to storedNode.
 * Handles overhead for highlighting text. Such as notifying sidebar and saving information to localStorage.
 * @returns null - ALlows the function to bail out when multiple ranges are selected. Could be modified later to handle multiple ranges.
 */
function highlightTextReceived() {
    let selection = document.getSelection()
    let id = getId() // Will be used to identify the new <mark> and note in local storage
    if (selection.rangeCount > 1) { // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension. 
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
    highlightText(`annotater${id}${url}`, start, end, startOffset, endOffset) // Handles the actual DOM manipulation.
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

/** // TODO: Combine this with highlightTextReceived to minimize repetition. Should only need to add an argument.
 * Handles overhead for annotating text. Such as notifying sidebar and saving information to localStorage.
 * @returns null - ALlows the function to bail out when multiple ranges are selected. Could be modified later to handle multiple ranges.
 */
function annotateTextReceived() {
    let selection = document.getSelection()
    let note = prompt("Enter Note.") // TODO: Replace this with a custom element to match sidebar visuals.
    let id = getId()
    // Will be used to identify the new <mark> and note in local storage
    if (selection.rangeCount > 1) { // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension. 
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
    annotateText(`annotater${id}${url}`, start, end, startOffset, endOffset, note) // Actual DOM manipulation is handled in here.
    localStorage.setItem(`annotater${id}${url}`, JSON.stringify(storedNote))
    if (localStorage.getItem("annotationCount") == null) {
        localStorage.setItem("annotationCount", 1)
    } else {
        localStorage.setItem("annotationCount", parseInt(localStorage.getItem("annotationCount")) + 1)
    }
    try {
        browser.runtime.sendMessage({type: "annotate-text", id: `annotater${id}${url}`, content: storedNote.content, annotation: note})
    } catch (err) {
        console.log(err)
    }
}

/**
 * Manipulates the DOM to put nodes contained in the selection into <mark> elements.
 * @param id the id of a note, in the format "annotater${id}/${url}" 
 * @param start The start node of the range being highlighted
 * @param end the end node of the range being highlighted
 * @param startOffset the amount of offset into text Node where the range begins
 * @param endOffset the amount of offset into a text Node where the range ends
 * @returns the last node inserted, to continue iteration from in reannotate()
 */
function highlightText(id, start, end, startOffset, endOffset) {
    // Nodes should be cloned to avoid potentially losing references as the DOM is modified.
    let startClone = start.cloneNode()
    let endClone = end.cloneNode()
    let mark = document.createElement("mark")
    // This block handles the case where the range is entirely within a single node. It is separated out as to avoid unnecesary function calls.
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
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(mark.parentNode)) { // Checks the parent to minimize the amount of <span> elements to insert into the DOM
            mark = document.createElement("mark")
            mark.className = "highlight"
            mark.setAttribute("id", id)
            node.parentNode.replaceChild(mark, node)
        }
        mark.appendChild(node)
        // Splits off the unhighlighted portion of the starting text node if necessary.
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            mark.parentNode.insertBefore(newText, mark)
        }  // Splits off the unhighlighted portion of the ending text node if necessary.
        else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            mark.parentNode.replaceChild(newText, mark)
            newText.parentElement.insertBefore(mark, newText)
        }
    })
    return mark
}

/**
 * Manipulates the DOM to put nodes contained in the selection into <mark> elements.
 * This is separate from highlightText as dealing with the popup and span elements would add bloat and make both functionalities less readable.
 * @param id the id of a note, in the format "annotater${id}/${url}" 
 * @param start The start node of the range being highlighted
 * @param end the end node of the range being highlighted
 * @param startOffset the amount of offset into text Node where the range begins
 * @param endOffset the amount of offset into a text Node where the range ends
 * @returns the last node inserted, to continue iteration from in reannotate()
 */
function annotateText(id, start, end, startOffset, endOffset, note) {
    // Nodes are cloned to avoid losing references as the DOM is modified
    let startClone = start.cloneNode()
    let endClone = end.cloneNode()
    let span = document.createElement("span")
    let popup = document.createElement("span")
    span.className = "annotation"
    popup.className = "popup"
    popup.textContent = note
    popup.style.display = "none"
    popup.id = `annotater-popup/${id}`
    span.setAttribute("id", id)
    // This block handles the case where the range is entirely within a single node. It is separated out as to avoid unnecesary function calls.
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
        if (node.isEqualNode(start) || !node.parentNode.isEqualNode(span.parentNode)) { // Checks the parent to minimize the amount of <span> elements to insert into the DOM
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
        // Handles splitting off unhighlighted portion of the start node.
        if (node.isEqualNode(startClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(0, startOffset))
            node.textContent = node.textContent.substring(startOffset)
            span.parentNode.insertBefore(newText, span)
        } // Handles splitting off unhighlighted portion of the end node. 
        else if (node.isEqualNode(endClone) && node.nodeType == Node.TEXT_NODE) {
            let newText = document.createTextNode(node.textContent.substring(endOffset))
            node.textContent = node.textContent.substring(0, endOffset)
            span.parentNode.replaceChild(newText, span)
            newText.parentElement.insertBefore(span, newText)
        }
    })
    span.parentElement.insertBefore(popup, span)
    return span
}

/**
 * Finds the first valid unused id number
 * @returns the id to be used for a new note.
 */
function getId() {
    let note = localStorage.getItem(`annotater0${url}`)
    let id = 0;

    while (note != null) {
        id += 1
        note = localStorage.getItem(`annotater${id}${url}`)
    }

    return id
}

/**
 * Sends messages to the sidebar containing information on existing notes.
 */
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

/**
 * Verifies if a given node was previously annotated.
 * @param node The node to check
 * @param notes All notes that were saved in localStorage
 * @returns The key matching the note that corresponds to the given node if it exists. Otherwise null
 */
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

/**
 * Finds the last node object corresponding to an existing node.
 * @param start The node that the note began at, used to start iteration.
 * @param endData The data contained in the ending node.
 * @param content All content that was in the range.
 * @returns the end node if found, null if not found (usually occurs when the text from start exists in multiple places)
 */
function findEnd(start, endData, content) {
    let node = start;
    while (node != null) {
        if (node.data === endData) {
            return node
        } // Just checking the textContent of the start on it's own is not sufficient to know if the start was correct. Every node should be checked to make sure it all matches.
        else if ((!content.includes(node.textContent) && node.nodeType == Node.TEXT_NODE) && !node.isEqualNode(start)) { // TODO: Test this conditional more thouroughly
            break;
        }
        node = getNextNode(node)
    }
    return null;
}

// TODO: This is working inconsistently. Need to test it more thoroughly
// TODO: Add something to notify the user if a note fails to be displayed. (This can probably happen in the sidebar)
/**
 * Looks through localStorage to find and highlight notes from previous sessions.
 */
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

/**
 * Scrolls to the identified note
 * @param id the id of a note, in the format "annotater${id}/${url}" 
 */
function scrollToNote(id) {
    let element = document.getElementById(id)
    try {
         element.scrollIntoView()
    } catch (err) {
        // TODO: Replace this popup with a custom popup so it looks nicer.
        window.alert("Note not found in page. The page may have been updated and the note was removed. If the note content is still there, please submit an issue here (https://github.com/thomasmckinstry/Annotater/issues).")
    }
}

/**
 * Modifies localStorage to be consistent with change to annotation made in sidebar, and modifies corresponding popup.
 * @param id the id of a note, in the format "annotater${id}/${url}" 
 * @param note the new annotation as enterered in sidebar. 
 */
function editNote(id, note) {
    let storedNote = JSON.parse(localStorage.getItem(id))
    storedNote.annotation = note
    localStorage.setItem(id, JSON.stringify(storedNote))
    let popup = document.getElementById(`annotater-popup/${id}`)
    popup.textContent = note
}

/**
 * Modifies stylesheet to correspond to new colors, and saves new colors to localStorage to be used on refresh.
 * @param type Indicates if the color change is to highlight color or annotate color.
 * @param value The hex code for the new color
 */
function changeColor(type, value) {
    // This block taken from https://developer.mozilla.org/en-US/docs/Web/API/Document/styleSheets
    let sheet
    let rules
    for (i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].title === "annotater") {
            sheet = document.styleSheets[i]
            break;
        }
    }
    rules = sheet.cssRules
    for (i = 0; i < rules.length; i++) {
        if (rules.item(i).selectorText.includes(type)) {
            sheet.deleteRule(i)
            break;
        }
    }
    switch(type) {
        case "highlight":
            sheet.insertRule(`.${type} { background: ${value}; }`)
            localStorage.setItem(`${type}Color`, value)
            break;
        case "annotation":
            sheet.insertRule(`.annotation { text-shadow: 0 0 0.2em ${value}; }`)
            localStorage.setItem("annotationColor", value)
            break;
    }
}

/**
 * Adds in listeners for communication with backgroundScript and sidebar 
 */
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
            localStorage.removeItem(id)
            break;
        case "edit-note":
            editNote(command.id, command.note)
            break;
    }
})

browser.storage.sync.onChanged.addListener((changes, area) => {
    const changedItems = Object.keys(changes)
    if (changedItems.includes("annotaterHighlightColor")) {
        changeColor("highlight", changes.annotaterHighlightColor.newValue)
    }
    if (changedItems.includes("annotaterAnnotationColor")) {
        changeColor("annotation", changes.annotaterAnnotationColor.newValue)
    }
})

/**
 * Adds in a stylesheet to the <head> to style elements that will be added in.
 */
function modifyStylesheet() {
    let head = document.getElementsByTagName("head")[0]
    let style = document.createElement("style")
    let highlightPromise = browser.storage.sync.get("annotaterHighlightColor")
    let annotationPromise = browser.storage.sync.get("annotaterAnnotationColor")

    style.id = "annotater-stylesheet"
    style.title = "annotater"
    let css = `
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

    highlightPromise.then(setColor)
    annotationPromise.then(setColor)

    function setColor(object) {
        let highlightColor
        let annotationColor
        let rule
        switch (Object.keys(object)[0]) {
        case "annotaterHighlightColor":
            highlightColor = object.annotaterHighlightColor || "#ffff00"
            rule = `.highlight { background: ${highlightColor}; }`
            break;
        case "annotaterAnnotationColor":
            annotationColor = object.annotaterAnnotationColor || "#ff4500"
            rule = `.annotation { text-shadow: 0 0 0.2em ${annotationColor}; }`
            break;
        }
        if (style.styleSheet) {
        // Required for IE8 and below
            style.styleSheet.cssText + rule;
        } else {
            style.appendChild(document.createTextNode(rule));
        }
    }
}

website = window.location.href
url = website.substring(website.lastIndexOf("/"))
modifyStylesheet()
reannotate()