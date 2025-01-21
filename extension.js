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

async function toggleCommentBlock(editor) {
    const blockComment = '#_';
    const lineComment = ';';
    let commentLen = blockComment.length;
    const active = editor.selection.active;
    let anchor = editor.selection.anchor;

    // 没有选中内容
    if (active.isEqual(anchor)) {
        const textline = editor.document.lineAt(anchor);
        const lineText = textline.text;
        const index = lineText.indexOf(blockComment);
        const validText = lineText.trimStart();
        const offset = lineText.indexOf(validText);
        if (index == -1) {
            // 判断是否有分号注释
            var codeText = validText;
            while (codeText.startsWith(lineComment)) {
                codeText = codeText.substring(1).trimStart();
            }
            var semicolonLen = 0;
            if (codeText.length > 0 && codeText.length < validText.length) {
                semicolonLen = validText.indexOf(codeText);
            } else if (codeText.length == 0) {
                semicolonLen = validText.length;
            }
            if (semicolonLen > 0) {
                // 有分号时，全部删除
                const start = new vscode.Position(anchor.line, offset);
                const end = new vscode.Position(anchor.line, offset + semicolonLen);
                editor.edit(editBuilder => {
                    editBuilder.replace(new vscode.Range(start, end), '');
                });
            } else {
                // 没有分号时，在选择区域的开始位置接入块注释
                const position = new vscode.Position(anchor.line, offset);
                editor.edit(editBuilder => {
                    editBuilder.insert(position, blockComment);
                });
            }
        }
        else {
            const start = new vscode.Position(anchor.line, index);
            const end = new vscode.Position(anchor.line, index + commentLen);
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(start, end), '');
            });
        }
    }
    else {
        anchor = anchor.isAfter(active) ? active : anchor;
        // 在选择区域的开始位置接入块注释
        const textline = textEditor.document.lineAt(anchor);
        const lineText = textline.text;
        const index = lineText.indexOf(blockComment);
        if (index != -1 && index == anchor.character - commentLen) {
            const start = new vscode.Position(anchor.line, index);
            const end = new vscode.Position(anchor.line, index + commentLen);
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(start, end), '');
            });
        } else {
            editor.edit(editBuilder => {
                editBuilder.insert(anchor, blockComment);
            });
        }
    }
    // 光标移动到下一个 form 的开始
    vscode.commands.executeCommand("paredit.forwardSexp");
    vscode.commands.executeCommand("paredit.forwardSexp");
    vscode.commands.executeCommand("paredit.backwardSexp");
}

function insertNewlineBetweenElements(text) {
    let result = '';
    let depth = 0;
    let lastChar = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 处理字符串
        if (char === '"' && !escape) {
            inString = !inString;
        }
        escape = char === '\\' && !escape;

        if (!inString) {
            if (char === '[') {
                depth++;
            } else if (char === ']') {
                depth--;
            }
        }

        // 在元素之间添加换行
        if (depth > 0 && !inString) {
            if (char === ' ' && lastChar !== '\n' && lastChar !== '[') {
                // 检查下一个非空白字符是否是 ']'
                let nextNonSpace = i + 1;
                while (nextNonSpace < text.length && text[nextNonSpace] === ' ') {
                    nextNonSpace++;
                }
                if (text[nextNonSpace] !== ']') {
                    result += '\n';
                    continue;
                }
            }
        }

        result += char;
        if (char !== ' ') {
            lastChar = char;
        }
    }

    return result;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    registerCommands(context);
}

function registerCommands(context) {
    const removeCommasCommand = vscode.commands.registerCommand(
        'less.edn.removeCommas',
        () => handleRemoveCommas(vscode.window.activeTextEditor)
    );

    const removeLineBreaksCommand = vscode.commands.registerCommand(
        'less.edn.removeLineBreaks',
        () => handleRemoveLineBreaks(vscode.window.activeTextEditor)
    );

    const commentBlockCommand = vscode.commands.registerCommand(
        'less.edn.toggleBlockComment',
        () => toggleCommentBlock(vscode.window.activeTextEditor)
    );

    let insertNewlines = vscode.commands.registerCommand(
        'less.edn.insertNewlines',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;
                const selection = editor.selection;
                const text = document.getText(selection);

                if (text.trim().startsWith('[')) {
                    const newText = insertNewlineBetweenElements(text);
                    editor.edit(editBuilder => {
                        editBuilder.replace(selection, newText);
                    });
                }
            }
        }
    );


    context.subscriptions.push(removeCommasCommand);
    context.subscriptions.push(removeLineBreaksCommand);
    context.subscriptions.push(commentBlockCommand);
    context.subscriptions.push(insertNewlines);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
