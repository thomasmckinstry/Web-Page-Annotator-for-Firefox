
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    highlightText()
}

function highlightText() {
    let selection = document.getSelection()
    let node = selection.anchorNode
    let nodeList = node.parentNode.childNodes
    let inSelection = false

    var mark = document.createElement('mark');

    for (i = 0; i < nodeList.length; i++) {
        node = nodeList[i]
        if (node === selection.anchorNode || node === selection.focusNode.nextSibling) {
            inSelection = !inSelection
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