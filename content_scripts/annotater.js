
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

function highlightText() {
    let selection = document.getSelection()
    let anchor = selection.anchorNode
    let nodeList = anchor.parentNode.childNodes
    let direction = selection.direction // Saving this so it can be used at the end. Removing selected nodes affects the selection, which may cause issues.
    let id = getId()

    let inSelection = false

    // Cloning nodes as nodes will be removed as we iterate through the NodeList, so references may be lost otherwise.
    let endSelection = selection.focusNode.cloneNode()
    let startSelection = selection.anchorNode.cloneNode()

    endSelection.innerHTML = selection.focusNode.innerHTML
    endSelection.outerHTML = selection.focusNode.outerHTML
    startSelection.innerHTML = selection.anchorNode.innerHTML
    startSelection.outerHTML = selection.anchorNode.outerHTML

    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        console.log("Can only highlight one range at a time.")
        window.alert("Can only highlight one range at a time.")
        return
    } else if (direction == "backward") {
        console.log("Cannot annotate selections done 'backwards'")
        window.alert("Cannot annotate selections done 'backwards'")
        return
    }

    var mark = document.createElement('mark');
    mark.setAttribute("id", id)
    var selectionRemainder;

    for (i = 0; i < nodeList.length; i++) {
        let node = nodeList[i]
        if (node.isEqualNode(startSelection)) {
            inSelection = true
        }

        if (node.isEqualNode(endSelection) && node.nodeType == Node.TEXT_NODE) {
            let selectedText = node.textContent.substring(0, selection.focusOffset)
            selectionRemainder = document.createTextNode(node.textContent.substring(selection.focusOffset))
            mark.innerHTML = mark.innerHTML + selectedText
            node.parentNode.removeChild(node)
        }
        else if (inSelection) {
            let newNode = node.cloneNode()
            newNode.innerHTML = node.innerHTML
            newNode.outerHTML = node.outerHTML
            console.log(newNode)
            mark.appendChild(newNode)
            if (!node.isEqualNode(startSelection) && node.parentNode != null) {
                node.parentNode.removeChild(node)
                i--;
            }
        }

        if (node.isEqualNode(endSelection)) {
            inSelection = false
        }
    }

    selection.anchorNode.parentNode.replaceChild(mark, selection.anchorNode)
    mark.parentNode.insertBefore(selectionRemainder, mark.nextSibling)
    localStorage.setItem(id, `{ "type": "highlight" "selection": ${selection} "mark": ${mark} }`)
}

// Similar process to highlightTextReceived
// Call a separate function annotateText(). Find the selection and place it all into a div.
// The event listeners will be added to the element that is created upon the annotation.
// Some style aspect should be changed to indicate that a section of text is annotated
// An additional popup has to exist to receive the note text.
function annotateTextReceived(request, sender, sendResponse) {
    let selection = document.getSelection()
}

function getId() {
    let note = localStorage.getItem(0)
    let id = 0;

    while (note != null) {
        id += 1
        note = localStorage.getItem(id)
    }

    return id
}

browser.runtime.onMessage.addListener((command, tab) => {
    switch (command) {
        case "highlight-selection":
            highlightTextReceived()
            break;
        case "annotate-selection":
            annotateTextReceived()
            break;
    }
})