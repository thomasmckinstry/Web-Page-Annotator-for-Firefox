# Entry 1
Time Spent:
    Start Time: 9:50am
    End Time: 10:55am
    Duration: 65 minutes
Tasks:
    - [X] Refactor messaging functions.
        - Should work for buttons and shortcuts
    - [X]  Reorganize directories.
    - [X] Add sidebar
        - For now sidebar should display anything highlighted or annotated
Challenges:
    - For reason console.log on the tab side occurs multiple times when it gets called as a result of a message. The logs will be removed eventually but it may still be a problem if the listener is trigerring multiple times.
    - Not sure how I can get content to the sidebar. Using messages in the same way I communicate between the background and content seems like a good idea but I'm not sure how to do that.
    - Not sure how to deal with a selection crossing multiple nodes.
Next Steps:
    - Read up on CSS Custom Highlight API.
        - Consider using the <mark> tag instead.
    - Figure out how to add stuff to the sidebar.
    - Write an HTML file for the sidebar.

# Entry 2
Time Spent:
    Start Time: 8:00am
    End Time: 10:11am
    Duration: 131 minutes
Tasks:
    - [X] Figure out HTML injection to original page.
    - [ ] Write an HTML file for the sidebar.
    - [X] Figure out how to add new Nodes to the sidebar.
        - Assuming it can be done in the same way I am currently adding new highlighted nodes.
Challenges:
    - Difficulty finding start and end of a selection when it spans mutiple nodes.
        - Consider iterating through each node highlighting them individually.
        - Clone the parent element. Do the above behavior, then reinsert into the DOM.
    - For some reason adding the mark tag sometimes removes styling elements from a node.
        - This may be happening because the way I insert the <mark> tag is overwriting another tag (In this case, <b>)
Next Steps:
    - Refactor highlight code into a separate function. Will need the code in another place for re-highlighting text upon reloading a page.
    - Write HTML for the sidebar.
    - Figure out why attempting to highlight some elements is deleting them or adding gibberish.
        - Like to do with the element type.

# Entry 3
Time Spent:
    Start Time: 11:45am
    End Time: 
    Duration: 
Tasks:
    - [ ] Bug fix why some elements are being deleted upon the highlightTextReceived call.
Challenges:
    - 
Next Steps:
    - 