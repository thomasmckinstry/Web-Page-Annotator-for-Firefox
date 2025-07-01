
// Needs to use a listener, can't be directly called by background script
function highlightTextReceived(request, sender, sendResponse) {
    let selection = document.getSelection()
    let node = selection.anchorNode
    // let focus = selection.focusNode

    // console.log("Selection:", selection)
    // console.log("Anchor:",node)
    // console.log("Focus:",focus)
    // console.log(node.parentNode.childNodes)

    // while (node != focus.nextSibling) {
    //     let parent = node.parentNode
    //     let mark = document.createElement("mark")
    //     mark.append(node.cloneNode)
    //     mark.firstChild.textContent = node.textContent

    //     parent.replaceChild(mark, node)
    //     node = node.nextSibling
    //     // console.log(node)
    //     // console.log((node != focus.nextSibling), ", ", (node != null))
    //     if (node == null) {
    //         node = node
    //         //console.log(node)
    //     }

    //     selection.empty()
    // }
    // let newParent = document.createElement(parent.tagName)

    let nodeList = node.parentNode.childNodes
    // let elementList = parent.children
    let inSelection = false

    var mark = document.createElement('mark');
    // mark.appendChild(selection.anchorNode.parentElement)
    // document.replaceChild(selection.anchorNode.parentElement, mark)
    // console.log(mark)
    // console.log(node)
    for (i = 0; i < nodeList.length; i++) {
        node = nodeList[i]
        if (node === selection.anchorNode || node === selection.focusNode.nextSibling) {
            inSelection = !inSelection
        }
        console.log(node, i, inSelection)

        if (inSelection) {
            mark.appendChild(node.cloneNode())
            mark.firstChild.textContent = node.textContent
            console.log(mark.lastChild)
            if (node != selection.anchorNode && node.parentNode != null) {
                // console.log(node)
                node.parentNode.removeChild(node)
            }
            // console.log("Append",mark,"after marking.")
        }
    }

    console.log(mark)
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