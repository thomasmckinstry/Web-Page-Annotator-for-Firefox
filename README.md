# Concept
A browser extension primarily for Firefox that allows users to highlight text and add notes on pages. This should be focused on being functional for news articles, and essay. Large blocks of text that communicate information. It should keep a list of pages that have been annotated, maybe allow for organization into folders. It should also be able to export a page into a PDF containing the page contents along with any notes or highlights that the user added.

This takes out the step of having to download a document or open another application to take notes on it.
# Features
- Note Taking (Reference Kindle's PDF Note Taking):
	- Highlight text in a browser tab.
	- Take notes on text in a browser tab. Notes should be in the form of a "pop-up" that is visually associated with a given section of text, and can be minimized.
- Organization:
	- "Home" Page which links to annotated pages.
	- Sidebar on a given page which lists out highlighted sections.
- Export:
	- Export a single page to a PDF containing highlighted text and notes.
	- Export a list of annotated pages along with annotations and notes as a json.
# Potential Issues
- A lot of notes and highlighted sections could lead to long load times as the extension will have to read through the page to find where to display certain elements.
	- Displaying the notes and highlighted sections should be efficient. 
- Pages can be edited and a highlighted section could be removed.
	- The information on the highlighted section should be displayed in the sidebar, but it should be crossed out to indicate that the page has removed or edited that section.
# Expected Workflow
## Creating Notes
1. Highlight a section of a page as normal.
2. Right click selected section.
3. Click on "Annotate" drop-down.
4. Select intended use case.
	- Highlight
		1. Section will be highlighted in default color. 
		2. An option should be given for different colors.
	- Notes
		1. Pop-up will appear for text to be entered.
		2. A confirm button should exist.
## Viewing Notes in Page
1. The user should click the extension icon in the toolbar to activate it for a given page.
2. The extension will check to see if there are existing notes and highlights.
3. The extension will modify the HTML and CSS to match the notes.
4.  A note can be clicked on to be deleted.
## Viewing Notes in Sidebar
1. When the extension is enabled in a page, a sidebar will appear.
2. The sidebar will contain all highlighted sections.
3. A user can click on a highlighted section in the sidebar to jump to the given section.
4. The sidebar should be able to be minimized.
5. A note should be able to be deleted from the sidebar.
6. The sidebar will contain a "trash" section where it will retain a deleted note for some time.
# Resources
- https://extensionworkshop.com/documentation/develop/firefox-workflow-overview/
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- Similar Project: https://addons.mozilla.org/en-US/firefox/addon/diigo-web-collector/