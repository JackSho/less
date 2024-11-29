const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('comma-less.removeCommas', function () {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            // Get the text within the selection
            const text = document.getText(selection);

            // Remove all commas from the selected text
            const newText = text.replace(/,/g, '');

            // Replace the selected text with the new text
            editor.edit(editBuilder => {
                editBuilder.replace(selection, newText);
            });
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
