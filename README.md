<h1 align="center">
Web Page Annotator
</h1>

Web Page Annotater is a browser extension for firefox that allows the users to take notes on any HTML web page by highlighting text and making annotations. Any notes are displayed in the sidebar on the page they were made in.

<h2> Features </h2>

- Highlight text.
- Annotate text.
- Edit existing annotations.
- Display notes in the sidebar.
- Display notes on subsequent visits to the same page.
- Scroll to annotated text in page from sidebar.
- Remove notes.

<h2>Installation</h2>

<h3>addons.mozilla.org (AMO)</h3>

1. [Click Here](https://addons.mozilla.org/en-US/firefox/) (Pending being submitted to AMO)

<h3> Building from source </h3>

1. Clone repository
2. Download web-ext [here](https://github.com/mozilla/web-ext)
3. Run `web-ext build` in the cloned Web Page Annotater repository
4. Go to about:addons in your browser
5.  Click the setting icon, and then "Install add-on from file"
6. Select the zip file generated in the web-ext-artifacts folder

<h2> Usage </h2>

<h3> Making Notes </h3>

***

The user should select the desired text and then can highlight text with the shortcut `Ctrl + Alt + h` or annotate text with the shortcut `Ctrl + Alt + n`. Alternatively, when text is selected, the user can right-click and there will be a sub-menu corresponding to the extension that will have buttons for each note type. If the user chooses to annotate text, a pop-up will appear to input the note.

The note made on annotated text can be viewed by hovering over the text, causing a pop-up to appear. Annotated text will have a text-shadow to indicate that it was annotated.

***

<h3> Sidebar </h3>

***

The sidebar automatically displays all notes on the current page.

The sidebar has two color selectors at the top, which will change the color of highlighted text, and the color of annotated text. Icons indicate which selector controls the color of each note type.

Each note has a button to delete the note. Deleting the note will not immediately remove it from the web page, but it will not display after a refresh. Another button exists to scroll to the note on the web page. Annotations have a button to edit the note, a pop-up will appear when this button is clicked to create a new annotation.

***

<h2> Technologies Used </h2>

- Javascript
- HTML
- CSS
- web-ext

<h2> Issues and Requests </h2>

Feel free to notify me of any feature requests or problems via the Issues tab in this repository.

<h2> About </h2>

GPLv3 License

- Used icons from [https://icons.getbootstrap.com/](Bootstrap) for buttons as well as icon and logo designs.

Free and Open-source. No data about the user is collected.
