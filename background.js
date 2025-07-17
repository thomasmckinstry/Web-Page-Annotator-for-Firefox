let executed = false
let executingContent
let executingSidebar

// Confirms that buttons were added correctly
function onCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
}

// Is called when a background listener hears something. Is passed the command (either info.menuItemId or command depending on input source.)
function handleMessage(command) {console.log("handleMessage")
  // Injects content script to the web page
  if (!executed) {
    executingContent = browser.tabs.executeScript({
      file: "content_scripts/annotater.js"
    });
    executingSidebar = browser.tabs.executeScript({
      file: "sidebar/notes-sidebar.js"
    });
    executed = true
  }

  executingContent.then(onExecuted)

  // Gets an array of active tabs to determine which one to modify.
  function onExecuted() {
    let querying = browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    querying.then(messageTab)
  }

  // Sends a message to the tab containing the name of the command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, command)
  }
}

// Creates the context menu buttons for interaction
browser.menus.create({
    id: "highlight-selection",
    title: browser.i18n.getMessage("selectedTextHighlight"),
    contexts: ["selection"],
}, onCreated);

browser.menus.create({
    id: "annotate-selection",
    title: browser.i18n.getMessage("selectedTextAnnotation"),
    contexts: ["selection"],
}, onCreated);

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlight-selection" || info.menuItemId === "annotate-selection") {
    handleMessage(info.menuItemId)
  }
});

browser.commands.onCommand.addListener((command, tab) => {
    if (command === "highlight-selection" || command === "annotate-selection") {
      handleMessage(command)
    }
});