const editFilepath = "../components/icons/pencil.svg"
const deleteFilepath = "../components/icons/trash.svg"
const linkFilepath = "../components/icons/link-45deg.svg"
const highlightFilepath = "../components/icons/highlighter.svg"
const annotateFilepath = "../components/icons/journal-text.svg"

let highlightColor = "#ffff00";
let annotationColor = "#ff4500";

let myWindowId
let notes = document.querySelector(".notes-window")

/**
 * Creates the link button for the identified note in the sidebar.
 * @param id the id of a note, in the format "annotater${id}/${url}"
 * @returns an html <img> element containing the link icon and a listener that will tell the content_script where to scroll to.
 */
function createLinkButton(id) {
  let linkButton = document.createElement('img')
  linkButton.src = linkFilepath
  linkButton.className = "button"
  linkButton.addEventListener("click", () => {
    handleMessage(id, "scroll-to-note", "")
  })
  return linkButton
}

/**
 * Creates the delete button for the identified note.
 * @param id the id of a note, in the format "annotater${id}/${url}"
 * @returns an html <img> element telling the content script which note to delete.
 */
function createDeleteButton(id) {
  let deleteButton = document.createElement('img')
  deleteButton.src = deleteFilepath
  deleteButton.className = "button"
  deleteButton.addEventListener("click", () => {
    handleMessage(id, "delete-note", "")
    deleteNote(id)
  })
  return deleteButton
}

/**
 * Creates the edit button for the identified annotated note.
 * @param id the id of a note in the format "annotater${id}/${url}"
 * @returns an html <img> element to edit the identified note and modify the localStorage for a page.
 */
function createEditButton(id) {
  let editButton = document.createElement('img')
  editButton.src = editFilepath
  editButton.className = "button"
  editButton.addEventListener("click", () => {
    let value = editNote(id)
    handleMessage(id, "edit-note", value)
  })
  return editButton
}

/**
 * Creates and inserts a <div> element to the sidebar containing the note given in the message.
 * @param message The message sent by the content_script, containing type, id, start/endData, start/endOffset, and content attributes.
 * @returns null
 */
function displayHighlight(message) {
  // Checks to make sure that duplicate notes are not added.
  if (document.getElementById(message.id) != null) {
    return
  }
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
  // Finds the 'last' element of 'buttons' class in the DOM, this will find the one corresponding to the most recent note, as it will be the last one in the DOM.
  let buttons = buttonsArray[buttonsArray.length - 1]
  buttons.appendChild(linkButton)
  buttons.appendChild(deleteButton)
}

/**
 * Creates and inserts a <div> element to the sidebar containing the note given in the message. Includes the text the user gave as an annotation.
 * @param message The message sent by the content_script, containing type, id, start/endData, start/endOffset, annotation, and content attributes.
 * @returns null
 */
function displayAnnotation(message) {
  // Checks to make sure that duplicate notes aren't added.
  if (document.getElementById(message.id) != null) {
    return
  }
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
                        <p class="note-text">${message.content}</p>
                        <hr />
                        <p class="note-text annotation-text">${message.annotation}</p>`
  notes.appendChild(newNote)
  let buttonsArray = document.getElementsByClassName("buttons")
  // Finds the 'last' element of 'buttons' class in the DOM, this will find the one corresponding to the most recent note, as it will be the last one in the DOM.
  let buttons = buttonsArray[buttonsArray.length - 1]
  buttons.appendChild(linkButton)
  buttons.appendChild(deleteButton)
  buttons.appendChild(editButton)
}

/**
 * Queries the content_script for the notes saved on a current page.
 */
function  refreshNotes() {
  // Resets the sidebar, since the sidebar would stay open and retain notes between pages otherwise.
  while (notes.firstChild) {
    notes.removeChild(notes.firstChild);
  }
  // The content_script will receive this message, and send all saved notes. There will be handled as normal by the listeners.
  handleMessage(null, "refresh-sidebar", "")
}

/**
 * This function handles functionality that involves communication with the content_script and avoids repeating code.
 * @param id the id of a note, in the format "annotater${id}/${url}"
 * @param command the command to tell the content_script exactly what to do.
 * @param value The relevant value for the content_script to use to execute the action (ex. the new annotation for a note)
 */
function handleMessage(id, command, value) {
  let querying = browser.tabs.query({
  active: true,
  currentWindow: true,
  });
  querying.then(messageTab)
  // Sends a message to the current (index 0) tab containing the name of the note, command, and relevant value
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {type: command, id: id, note: value})
  } 
}

/**
 * Removes the identified note from the sidebar.
 * @param id the id of a note, in the format "annotater${id}/${url}"
 */
function deleteNote(id) {
  let note = document.getElementById(id)
  note.remove()
}

/**
 * 
 * @param id the id of a note, in the format "annotater${id}/${url}" 
 * @returns null - Accounts for a user exiting without entering a new value.
 * @returns The new annotation, to be sent to the content_script and put in localStorage.
 */
function editNote(id) {
  let newNote = prompt("Enter New Note.") // TODO: Replace this with a custom element for better visuals and preload existing annotation for ease of use.
  if (newNote == null || newNote == "") {
    return
  }
  let note = document.getElementById(id)
  let annotation = note.getElementsByClassName("annotation-text")[0]
  annotation.textContent = newNote
  return newNote
}

/**
 * Adds all listeners to the sidebar.
 */
function addListeners() {
  // Update content when a new tab becomes active.
  browser.tabs.onActivated.addListener(refreshNotes);

  // Update content when a new page is loaded into a tab.
  browser.tabs.onUpdated.addListener(refreshNotes);

  // Notifies content_script when color pickers change, and saves new colors to extension storage .
  let colorPickers = document.getElementsByClassName("color-picker")
  for (i = 0; i < colorPickers.length; i++) {
    colorPickers[i].addEventListener("change", (event) => {
      handleMessage(null, event.target.id, event.target.value)
      saveColor(event.target.id, event.target.value)
    })
  }

  // Add listeners for events from content_scripts
  browser.runtime.onMessage.addListener((message) => {
  switch (message.type){
    case "highlight-text":
      displayHighlight(message)
      break;
    case "annotate-text":
      displayAnnotation(message)
      break;
  }})
}

/**
 * Saves any changes to the color pickers to extension storage.
 * @param type indicates if a color corresponds to highlighted text or annotated text.
 * @param value the hex code for the new color
 */
function saveColor(type, value) {
  switch (type) {
    case "highlight-color-change":
      browser.storage.sync.set({annotaterHighlightColor: value})
      break;
    case "annotate-color-change":
      browser.storage.sync.set({annotaterAnnotationColor: value})
      break;
  }
}

/**
 * Gets colors from extension storage, modifies the colorPickers as needed, and notifies the content_script.
 */
function loadColors() {
  let highlightColor = null
  let annotationColor = null
  highlightPromise = browser.storage.sync.get("annotaterHighlightColor")
  annotationPromise = browser.storage.sync.get("annotaterAnnotationColor")
  highlightPromise.then(setColor)
  annotationPromise.then(setColor)

  function setColor(object) {
    switch (Object.keys(object)[0]) {
      case "annotaterHighlightColor":
        highlightColor = object.annotaterHighlightColor || "#ffff00"
        let highlightPicker = document.getElementById("highlight-color-change")
        highlightPicker.value = highlightColor
        break;
      case "annotaterAnnotationColor":
        annotationColor = object.annotaterAnnotationColor || "#ff4500"
          let annotatePicker = document.getElementById("annotate-color-change")
          annotatePicker.value = annotationColor  
        break;
    }
  }
}

addListeners()
loadColors()
/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  refreshNotes();
})