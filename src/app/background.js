/**
 * Logs to console to indicate if buttons were created and added correctly to the context menu.
 */
function onCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
}

/**
 * Sends the command to the content_scripts for execution.
 * @param command The command inputted by the user.
 */
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

/**
 * Creates the context menu buttons.
 */
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

/**
 * Adds in listeners for commands.
 */
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