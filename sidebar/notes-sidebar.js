const editFilepath = "../icons/edit.jpeg"
const deleteFilepath = "../icons/delete.jpeg"
const linkFilepath = "../icons/hyperlink.jpeg"
const highlightFilepath = "/icons/highlighter.jpeg"
const annotateFilepath = "/icons/notepad.jpeg"

let myWindowId
let notes = document.querySelector(".notes-window")

function createLinkButton(id) {
  let linkButton = document.createElement('img')
  linkButton.src = linkFilepath
  linkButton.className = "button"
  linkButton.addEventListener("click", () => {
    handleMessage(id, "scroll-to-note", "")
  })
  return linkButton
}

function createDeleteButton(id) {
  let deleteButton = document.createElement('img')
  deleteButton.src = deleteFilepath
  deleteButton.className = "button"
  deleteButton.addEventListener("click", () => {
    handleMessage(id, "delete-note", "")
  })
  return deleteButton
}

function createEditButton(id) {
  let editButton = document.createElement('img')
  editButton.src = editFilepath
  editButton.className = "button"
  editButton.addEventListener("click", () => {
    handleMessage(id, "edit-note", "")
  })
  return editButton
}

function displayHighlight(message) {
  let newNote = document.createElement('div')
  let linkButton = createLinkButton(message.id)
  let deleteButton = createDeleteButton(message.id)
  newNote.className = "note" 
  newNote.setAttribute("id", message.id)
  newNote.innerHTML = `<div class="note-header highlight">
                          <img class="note-icon" src="${highlightFilepath}" alt="highlighted text">
                          <div class="buttons" style="margin-left: auto;">
                          </div>
                        </div>
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
  let buttonsArray = document.getElementsByClassName("buttons")
  let buttons = buttonsArray[buttonsArray.length - 1]
  buttons.appendChild(linkButton)
  buttons.appendChild(deleteButton)
}

function displayAnnotation(message) {
  let newNote = document.createElement('div')
  let linkButton = createLinkButton(message.id)
  let deleteButton = createDeleteButton(message.id)
  let editButton = createEditButton(message.id)
  newNote.className = "note" 
  newNote.setAttribute("id", message.id)
  newNote.innerHTML = `<div class="note-header annotation">
                          <img class="note-icon" src="${annotateFilepath}" alt="annotated text">
                          <div class="buttons" style="margin-left: auto;">
                          </div>
                        </div>
                        <p class="note-text annotation-text">${message.annotation}</p>
                        <hr />
                        <p class="note-text">${message.content}</p>`
  notes.appendChild(newNote)
  let buttonsArray = document.getElementsByClassName("buttons")
  let buttons = buttonsArray[buttonsArray.length - 1]
  buttons.appendChild(linkButton)
  buttons.appendChild(deleteButton)
  buttons.appendChild(editButton)
}

function  refreshNotes() {
  while (notes.firstChild) {
    notes.removeChild(notes.firstChild);
  }

  handleMessage(null, "refresh-sidebar", "")
}

function handleMessage(id, command, text) {
  switch (command) {
    case "delete-note":
      deleteNote(id)
      break;
    case "edit-note":
      text = editNote(id)
      break;
  }

  let querying = browser.tabs.query({
  active: true,
  currentWindow: true,
  });
  querying.then(messageTab)

  // Sends a message to the tab containing the name of the note and command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {type: command, id: id, note: text})
  } 
}

function deleteNote(id) {
  let notes = document.getElementsByClassName("note")
  for (i = 0; i < notes.length; i++) {
    if (notes[i].id == id) {
      notes[i].parentElement.removeChild(notes[i])
    }
  }
}

function editNote(id) {
  let newNote = prompt("Enter Note.")
  let annotations = document.getElementsByClassName("annotation-text")
  for (i = 0; i < annotations.length; i++) {
    if (annotations[i].parentElement.id === id) {
      annotations[i].textContent = newNote
      break;
    }
  }
  return newNote
}

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  refreshNotes();
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