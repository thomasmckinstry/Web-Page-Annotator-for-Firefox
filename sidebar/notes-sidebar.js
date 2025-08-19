let myWindowId
let notes = document.querySelector(".notes-window")

function displayHighlight(message) {
  var newNote = document.createElement('div')
  newNote.className = "note" 
  newNote.setAttribute("id", message.id)
  newNote.innerHTML = `<div class="note-header highlight" id="${message.id}">
                          <img class="note-icon" src="/icons/highlighter.jpeg" alt="highlighted text">
                          <div style="margin-left: auto;">
                            <button class="button" type="image"><img class="note-icon" src="/icons/delete.jpeg"></button> 
                            <button class="button" type="image"><img class="note-icon" src="/icons/hyperlink.jpeg"></a></button>
                          </div>
                        </div>
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
  // TODO: Add onclick call to button for scrollToNote
}

function displayAnnotation(message) {
  var newNote = document.createElement('div')
  var linkButton = document.createElement('button')
  linkButton.textContent = "scroll"
  linkButton.addEventListener("click", () => {
    scrollToNote(message.id)
  })
  deleteButton = document.createElement('button')
  deleteButton.textContent = "delete"
  deleteButton.addEventListener("click", () => {
    deleteNote(message.id)
  })
  editButton = document.createElement('button')
  editButton.textContent = "edit"
  editButton.addEventListener("click", () => {
    var newNote = prompt("Enter Note.")
    var annotations = document.getElementsByClassName("annotation-text")
    console.log("annotations:", annotations, message.id)
    for (i = 0; i < annotations.length; i++) {
      console.log(annotations[i].parentElement.id)
      if (annotations[i].parentElement.id === message.id) {
        console.log("matching")
        annotations[i].textContent = newNote
        break;
      }
    }
    // TODO: write this function
  })
  newNote.className = "note" 
  newNote.setAttribute("id", message.id)
  newNote.innerHTML = `<div class="note-header annotation">
                          <img class="note-icon" src="/icons/notepad.jpeg" alt="annotated text">
                          <div class="buttons" style="margin-left: auto;">
                          </div>
                        </div>
                        <p class="note-text annotation-text">${message.annotation}</p>
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
  var buttonsArray = document.getElementsByClassName("buttons") // TODO: This is null in some cases
  console.log(buttonsArray)
  var buttons = buttonsArray[buttonsArray.length - 1]
  buttons.appendChild(linkButton)
  buttons.appendChild(deleteButton)
  buttons.appendChild(editButton)
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
    browser.tabs.sendMessage(tabs[0].id, {type: "refresh-sidebar"})
  } 
}

// TODO: Modify this to be in a listener. Buttons could have their id and their command as attributes and give them to the listener to reduce repeating.
function scrollToNote(id) {
  console.log("scrolling to", id)
  let querying = browser.tabs.query({
    active: true,
    currentWindow: true,
    });
  querying.then(messageTab)

  // Sends a message to the tab containing the name of the note and command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {type: "scroll-to-note", id: id})
  } 
}

function deleteNote(id) {
  console.log("deleting", id)
  let querying = browser.tabs.query({
    active: true,
    currentWindow: true,
    });
  querying.then(messageTab)
  let notes = document.getElementsByClassName("note")
  for (i = 0; i < notes.length; i++) {
    if (notes[i].id == id) {
      notes[i].parentElement.removeChild(notes[i])
    }
  }

  // Sends a message to the tab containing the name of the note and command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {type: "delete-note", id: id})
  } 
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