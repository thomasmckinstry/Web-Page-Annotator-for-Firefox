
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

//TODO: Change to not use nodeList and instead iterate through the DOM from individual nodes
function highlightText() {
    var selection = document.getSelection()
    var direction = selection.direction // Saving this so it can be used at the end. Removing selected nodes affects the selection, which may cause issues.
    var id = getId() // Will be used to identify the new <mark> and note in local storage

    // Highlighting multiple ranges would be complicated, and not really align with how I would expect people to use the extension.
    if (selection.rangeCount > 1) {
        window.alert("Can only highlight one range at a time.")
        return
    } else if (direction == "backward") { // I mostly highlight forwards so restricting this shouldn't affect (my) usage much. It would also be complex to implement
        window.alert("Cannot annotate selections done 'backwards'")
        return
    }

    var range = selection.getRangeAt(0)
    var mark = document.createElement("mark")
    console.log(mark)
    mark.setAttribute("annotaterId", id)
    try {
        range.surroundContents(mark)
        localStorage.setItem(`annotater${id}`, `{ "type": "highlight" "mark": ${mark} }`)
    } catch(err) {
        window.alert("Selection invalid; Try selecting within a single text block, or an entire link.") // TODO: Make this error message more specific
        return
    }

    // browser.runtime.sendMessage(localStorage.getItem(id))
}

// Similar process to highlightTextReceived
// Call a separate function annotateText(). Find the selection and place it all into a div.
// The event listeners will be added to the element that is created upon the annotation.
// Some style aspect should be changed to indicate that a section of text is annotated
// An additional popup has to exist to receive the note text.
function annotateTextReceived(request, sender, sendResponse) {
    var selection = document.getSelection()
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