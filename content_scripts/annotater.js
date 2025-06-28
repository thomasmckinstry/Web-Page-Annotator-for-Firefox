

// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    let selection = document.getSelection()
    let selectionText = selection.anchorNode.textContent.substring(selection.anchorOffset, selection.focusOffset)
    let content = selection.anchorNode.textContent

    const range = new Range();
    range.setStart(selection.anchorNode, selection.anchoroffset)
    range.setEnd(selection.anchorNode, selection.focusOffset)
    const highlight = new Highlight(range)
    CSS.highlights.set("text-highlight", highlight)
    console.log("Attempted to highlight")
}

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