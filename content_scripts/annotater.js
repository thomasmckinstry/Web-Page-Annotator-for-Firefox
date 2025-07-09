
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

function highlightText() {
    let selection = document.getSelection()
    let anchor = selection.anchorNode
    let nodeList = anchor.parentNode.childNodes
    let direction = selection.direction // Saving this so it can be used at the end. Removing selected nodes affects the selection, which may cause issues.

    let inSelection = false

    // Cloning nodes as nodes will be removed as we iterate through the NodeList, so references may be lost otherwise.
    let endSelection = selection.focusNode.cloneNode()
    let startSelection = selection.anchorNode.cloneNode()
    endSelection.innerHTML = selection.focusNode.innerHTML
    startSelection.innerHTML = selection.anchorNode.innerHTML

    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        console.log("Can only highlight one range at a time.")
        return
    }

    // The direction a selection is made in affects the anchor Node and focus Node. Doing this is easier than changing the direction of iteration.
    if (direction == "backward") {
        console.log("backwards!")
        endSelection = selection.anchorNode.cloneNode()
        endSelection.innerHTML = selection.anchorNode.innerHTML
        startSelection = selection.focusNode.cloneNode()
        startSelection = selection.focusNode.innerHTML
    }

    // This might be unnecessary after making the change to the comparison function.
    // if (endSelection.nodeType == Node.TEXT_NODE) {
    //     endSelection = selection.focusNode.parentNode.cloneNode()
    //     endSelection.innerHTML = selection.focusNode.parentNode.innerHTML
    // }

    var mark = document.createElement('mark');
    var selectionRemainder;

    console.log("Anchor Node:", startSelection)
    console.log("Focus Node:", endSelection)

    // Gonna need to sub this out for a while look to properly iterate across multiple nodes.
    // console.log(startSelection)
    for (i = 0; i < nodeList.length; i++) {
        let node = nodeList[i]
        console.log(node)
        if (node.isEqualNode(startSelection)) {
            inSelection = true
            console.log("inSelection true")
        }

        if (node.isEqualNode(endSelection) && node.nodeType == Node.TEXT_NODE) {
            let selectedText = node.textContent.substring(0, selection.focusOffset)
            selectionRemainder = document.createTextNode(node.textContent.substring(selection.focusOffset))
            console.log(selectionRemainder.innerHTML)
            mark.innerHTML = mark.innerHTML + selectedText
            node.parentNode.removeChild(node)
        }
        else if (inSelection) {
            let newNode = node.cloneNode()
            newNode.innerHTML = node.innerHTML
            mark.appendChild(newNode)
            if (!node.isEqualNode(startSelection) && node.parentNode != null) {
                node.parentNode.removeChild(node)
                i--;
            }
        }

        if (node.isEqualNode(endSelection)) {
            inSelection = false
            console.log("inSelection false")
        }
    }

    if (direction == "backwards") {
        // console.log("Adding mark at focus",mark)
        selection.focusNode.parentNode.replaceChild(mark, selection.focusNode)
    } else {
        // console.log("Adding mark at anchor",mark)
        selection.anchorNode.parentNode.replaceChild(mark, selection.anchorNode)
    }

    console.log(selectionRemainder)
    console.log("Place Remainder after mark", mark.nextSibling)
    mark.parentNode.insertBefore(selectionRemainder, mark.nextSibling)
}

// Similar process to highlightTextReceived
// Call a separate function annotateText(). Find the selection and place it all into a div.
// The event listeners will be added to the element that is created upon the annotation.
// Some style aspect should be changed to indicate that a section of text is annotated
// An additional popup has to exist to receive the note text.
function annotateTextReceived(request, sender, sendResponse) {
    let selection = document.getSelection()
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