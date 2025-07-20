let myWindowId

function displayNote(message) {
  notes = document.getElementById("notes")
  console.log("displaying",message, "on", notes)
  var newNote = document.createElement('div')
  newNote.className = "note" 
  newNote.setAttribute("annotaterId", message.id)
  // TODO: Move the HTML out of this file somehow.
  newNote.innerHTML = `<div class="note-header" id="note">
                      <img class="note-icon" src="/icons/notepad.jpeg" alt="annotated text">
                      <div style="margin-left: auto;">
                        <button class="button" type="image"><img class="note-icon" src="/icons/edit.jpeg"></button>
                        <button class="button" type="image"><img class="note-icon" src="/icons/delete.jpeg"></button>     
                        <button class="button" type="image"><a href="http://google.com"><img class="note-icon" src="/icons/hyperlink.jpeg"></a></button>
                      </div>
                      </div>
                        <p class="note-text">${message.content}</p>
                    </div>`
  notes.appendChild(newNote)
  console.log(notes)
}

/*
Update content when a new tab becomes active.
*/
// browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
// browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
});

browser.runtime.onMessage.addListener((message) => {displayNote(message)})