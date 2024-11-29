const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('comma-less.removeCommas', async function () {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const selection = editor.selection;

            // If no text is selected, try to expand selection using Calva's paredit
            if (selection.isEmpty) {
                try {
                    await vscode.commands.executeCommand('paredit.sexpRangeExpansion');
                    // Get the new selection after expansion
                    const newSelection = editor.selection;
                    if (!newSelection.isEmpty) {
                        await removeCommasFromSelection(editor, newSelection);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to expand selection. Make sure Calva is installed.');
                }
            } else {
                // If text is already selected, just remove commas
                await removeCommasFromSelection(editor, selection);
            }
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Remove commas from the given selection
 * @param {vscode.TextEditor} editor
 * @param {vscode.Selection} selection
 */
async function removeCommasFromSelection(editor, selection) {
    const document = editor.document;
    const text = document.getText(selection);
    const newText = text.replace(/,/g, '');

    await editor.edit(editBuilder => {
        editBuilder.replace(selection, newText);
    });
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
