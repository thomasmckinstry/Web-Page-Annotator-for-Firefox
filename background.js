// Confirmst that buttons were added correctly
function onCreated() {
    if (browser.runtime.lastError) {
      console.log(`Error: ${browser.runtime.lastError}`);
    } else {
      console.log("Item created successfully");
    }
}

let gettingAllCommands = browser.commands.getAll();
gettingAllCommands.then((commands) => {
  for (let command of commands) {
    // Note that this logs to the Add-on Debugger's console: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging
    // not the regular Web console.
    console.log(command);
  }
});

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
    let executing = browser.tabs.executeScript({
      file: "annotater.js",
    });
    executing.then(onExecuted)
  }

  // Add a function that deals will all the promises outside of each listener so I don't need to duplicate this
  // New function should take info as an argument. Insert content script, then call onExecuted. onExecuted should be nested in the new function.
  function onExecuted() {
    let querying = browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    querying.then(messageTab)
  }

  function messageTab(tabs) {
    browser.tabs.sendMessage(tabs[0].id, info.menuItemId)
  }

  // switch (info.menuItemId) {
  //   case "highlight-selection":
  //     console.log("highlighting");
  //     break;
  //   case "annotate-selection":
  //     console.log("annotating");
  //     break;
  // }
});

browser.commands.onCommand.addListener((command, tab) => {
    switch (command) {
        case "highlight-selection":
            console.log("highlighting")
            break;
        case "annotate-selection":
            console.log("annotating")
            break;
    }
});