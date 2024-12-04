const vscode = require('vscode');

/**
 * Handle the remove commas command
 * @param {vscode.TextEditor} editor 
 */
async function handleRemoveCommas(editor) {
    if (!editor) return;

    const selection = editor.selection;
    // If no text is selected, try to expand selection using Calva's paredit
    if (selection.isEmpty) {
        try {
            await vscode.commands.executeCommand('paredit.sexpRangeExpansion');
            // Get the new selection after expansion
            const newSelection = editor.selection;
            if (!newSelection.isEmpty) {
                await removeCharactersFromSelection(editor, newSelection, /,/g);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to expand selection. Make sure Calva is installed.');
        }
    } else {
        // If text is already selected, just remove commas
        await removeCharactersFromSelection(editor, selection, /,/g);
    }
}

/**
 * Handle the remove line breaks command
 * @param {vscode.TextEditor} editor 
 */
async function handleRemoveLineBreaks(editor) {
    if (!editor) return;

    const selection = editor.selection;
    if (!selection.isEmpty) {
        await removeCharactersFromSelection(editor, selection, /\r?\n/g);
    }
}

/**
 * Remove specified characters from the given selection
 * @param {vscode.TextEditor} editor
 * @param {vscode.Selection} selection
 * @param {RegExp} pattern - Regular expression pattern for characters to remove
 */
async function removeCharactersFromSelection(editor, selection, pattern) {
    const document = editor.document;
    const text = document.getText(selection);
    const newText = text.replace(pattern, '');

    await editor.edit(editBuilder => {
        editBuilder.replace(selection, newText);
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let removeCommasCommand = vscode.commands.registerCommand(
        'comma-less.removeCommas',
        () => handleRemoveCommas(vscode.window.activeTextEditor)
    );

    let removeLineBreaksCommand = vscode.commands.registerCommand(
        'comma-less.removeLineBreaks',
        () => handleRemoveLineBreaks(vscode.window.activeTextEditor)
    );

    context.subscriptions.push(removeCommasCommand);
    context.subscriptions.push(removeLineBreaksCommand);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
