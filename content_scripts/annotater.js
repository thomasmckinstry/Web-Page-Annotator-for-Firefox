
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

function highlightText() {
    let selection = document.getSelection()
    let anchor = selection.anchorNode
    let nodeList = anchor.parentNode.childNodes

    let inSelection = false

    let endSelection = selection.focusNode.cloneNode()
    let startSelection = selection.anchorNode.cloneNode()
    endSelection.innerHTML = selection.focusNode.innerHTML
    startSelection.innerHTML = selection.anchorNode.innerHTML

    if (selection.rangeCount > 1) {
        console.log("Can only highlight one range at a time.")
        return
    }

    if (selection.direction = "backward") {

    }


    if (endSelection.nodeType == Node.TEXT_NODE) {
        endSelection = selection.focusNode.parentNode.cloneNode()
        endSelection.innerHTML = selection.focusNode.parentNode.innerHTML
        // console.log(selection.focusNode.parentNode, selection.focusNode.parentElement)
    }

    var mark = document.createElement('mark');

    // Gonna need to sub this out for a while look to properly iterate across multiple nodes.
    for (i = 0; i < nodeList.length; i++) {
        let node = nodeList[i]
        console.log(node)
        if (node == selection.anchorNode) {
            inSelection = true
        }

        if (inSelection) {
            let newNode = node.cloneNode()
            newNode.innerHTML = node.innerHTML
            mark.appendChild(newNode)
            if (node != selection.anchorNode && node.parentNode != null) {
                node.parentNode.removeChild(node)
                i--;
            }
        }

        if (node.isEqualNode(endSelection)) {
            inSelection = false
            console.log(node, "===", endSelection)
        } else {
            console.log(node, "!=", endSelection)
        }
    }

    selection.anchorNode.parentNode.replaceChild(mark, selection.anchorNode)
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