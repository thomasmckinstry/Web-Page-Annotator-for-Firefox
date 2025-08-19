// Confirms that buttons were added correctly
function onCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
}

// Is called when a background listener hears something. Is passed the command (either info.menuItemId or command depending on input source.)
function handleMessage(command) {
  let querying = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  querying.then(messageTab)

  // Sends a message to the tab containing the name of the command
  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {type: command})
  } 
}

// Creates the context menu buttons for interaction
function createButtons() {
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
}

function addListeners() {
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
}

createButtons()
addListeners()