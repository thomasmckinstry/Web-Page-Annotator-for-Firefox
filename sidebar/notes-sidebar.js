let myWindowId
let notes = document.querySelector(".notes-window")

function displayHighlight(message) {
  var newNote = document.createElement('div')
  newNote.className = "note" 
  newNote.setAttribute("annotaterId", message.id)
  newNote.innerHTML = `<div class="note-header" id="highlight">
                          <img class="note-icon" src="/icons/highlighter.jpeg" alt="highlighted text">
                          <div style="margin-left: auto;">
                            <button class="button" type="image"><img class="note-icon" src="/icons/delete.jpeg"></button> 
                            <button class="button" type="image"><img class="note-icon" src="/icons/hyperlink.jpeg"></a></button>
                          </div>
                        </div>
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
}

function displayAnnotation(message) {
  var newNote = document.createElement('div')
  newNote.className = "note" 
  newNote.setAttribute("annotaterId", message.id)
  newNote.innerHTML = `<div class="note-header" id="annotation">
                          <img class="note-icon" src="/icons/notepad.jpeg" alt="annotated text">
                          <div style="margin-left: auto;">
                            <button class="button" type="image"><img class="note-icon" src="/icons/delete.jpeg"></button> 
                            <button class="button" type="image"><img class="note-icon" src="/icons/hyperlink.jpeg"></a></button>
                            <button class="button" type="image"><img class="note-icon" src="/icons/edit.jpeg"></button> 
                          </div>
                        </div>
                        <p class="note-text">${message.annotation}</p>
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
}

function  refreshNotes(windowInfo) {
  while (notes.firstChild) {
    notes.removeChild(notes.firstChild);
  }

  let querying = browser.tabs.query({
    active: true,
    currentWindow: true,
    });
  querying.then(messageTab)

  // Sends a message to the tab containing the name of the command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, "refresh-sidebar")
  } 
}

function scrollToNote() {
  
}

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  refreshNotes(windowInfo);
});

function addListeners() {
  // Update content when a new tab becomes active.
  browser.tabs.onActivated.addListener(refreshNotes);

  // Update content when a new page is loaded into a tab.
  browser.tabs.onUpdated.addListener(refreshNotes);

  // Add listeners for events from content_scripts
  browser.runtime.onMessage.addListener((message) => {
  switch (message.type){
    case "highlight-text":
      displayHighlight(message)
      break;
    case "annotate-text":
      displayAnnotation(message)
      break;
  }  
  })
}

addListeners()