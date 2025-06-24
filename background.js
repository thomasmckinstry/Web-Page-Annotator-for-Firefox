// Creates the context menu buttons for interaction

browser.menus.create({
    id: "highlight-selection",
    title: browser.i18n.getMessage("selectedTextHighlight"),
    contexts: ["selection"],
}, onCreated);
  
browser.menus.create({
    id: "separator-1",
    type: "separator",
    contexts: ["all"]
}, onCreated);

browser.menus.create({
    id: "annotate-selection",
    title: browser.i18n.getMessage("selectedTextAnnotation"),
    contexts: ["selection"],
}, onCreated);
