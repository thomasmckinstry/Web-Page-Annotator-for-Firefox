
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    let selection = document.getSelection()
    let parent = selection.anchorNode.parentElement
    let newParent = document.createElement(parent.tagName)

    // let anchorHTML = selection.anchorNode.parentElement.innerHTML
    // let focusHTML = selection.focusNode.parentElement.innerHTML

    // console.log(anchorHTML)
    // console.log(focusHTML)
    // console.log(selection.toString())
    
    // // let startIndex = anchorHTML.indexOf(">")
    // // let endIndex = focusHTML.lastIndexOf("<")

    // selectionText = selection.toString()
    // anchorIndex = anchorHTML.search(selectionText)
    // selectionLength = selectionText.length

    // anchorHTML = anchorHTML.substring(0, anchorIndex) + "<mark>" + anchorHTML.substring(anchorIndex, anchorIndex + selectionLength) + "</mark>" + anchorHTML.substring(anchorIndex + selectionLength)
    // //focusHTML = focusHTML.substring(0, endIndex) + "</mark>" + focusHTML.substring(endIndex)

    // selection.anchorNode.parentElement.outerHTML = anchorHTML
    // // selection.anchorNode.parentElement.outerHTML = focusHTML
    // console.log(anchorHTML)
    // // console.log(selection.focusNode.parentElement.outerHTML)

    let nodeList = parent.childNodes
    let inSelection = false
    for (i = 0; i <= nodeList.length; i++) {
        node = nodeList[i]
        console.log(node)
        // console.log(node)
        if (node == selection.anchorNode || node == selection.focusNode.nextSibling) {
            inSelection = !inSelection
            // console.log(inSelection)
        }

        if (inSelection) {
            var mark = document.createElement('mark');
            mark.appendChild(node)
            newParent.appendChild(mark)
            console.log("Append",mark)
        } else {
            newParent.appendChild(node)
        }
    }

    parent.replaceWith(newParent)
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