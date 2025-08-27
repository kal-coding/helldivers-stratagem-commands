import * as vscode from "vscode";

const stratagems: Record<string, { name: string; action: () => void }> = {
  "↑↑↑↑": {
    name: "Orbital Strike",
    action: () => {
      vscode.window.showInformationMessage("💥 Orbital Strike Deployed!");
      vscode.commands.executeCommand("editor.action.commentLine");
    },
  },
  "↓↓↓↓": {
    name: "Supply Drop",
    action: () =>
      vscode.commands.executeCommand("workbench.action.terminal.new"),
  },
  "↑↑↓↓": {
    name: "Shield Online",
    action: () => vscode.commands.executeCommand("editor.action.commentLine"),
  },
};

let currentInput: string[] = [];
let statusBar: vscode.StatusBarItem;

function registerStratagemCommand(
  context: vscode.ExtensionContext,
  direction: string
) {
  return vscode.commands.registerCommand(`helldivers.${direction}`, () => {
    currentInput.push(direction); // U, D, L, R
    if (currentInput.length > 4) {
      currentInput.shift();
    }

    // Update status bar
    statusBar.text = `🔺 ${currentInput.join(" ")}`;
    statusBar.show();

    const inputStr = currentInput.join("");
    if (stratagems[inputStr]) {
      stratagems[inputStr].action();
      openStratagemWebview(context, stratagems[inputStr].name, inputStr);
      currentInput = [];
      statusBar.text = "🎮 Stratagem Ready";
    }
  });
}

export function activate(context: vscode.ExtensionContext) {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.text = "🎮 Stratagem Console";
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(registerStratagemCommand(context, "↑"));
  context.subscriptions.push(registerStratagemCommand(context, "↓"));
  context.subscriptions.push(registerStratagemCommand(context, "←"));
  context.subscriptions.push(registerStratagemCommand(context, "→"));
}

export function deactivate() {
  statusBar.dispose();
}

function openStratagemWebview(
  context: vscode.ExtensionContext,
  stratagemName: string,
  sequence: string
) {
  const panel = vscode.window.createWebviewPanel(
    "helldiversStratagem",
    "Helldivers Stratagem Console",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const mediaUri = vscode.Uri.joinPath(context.extensionUri, "dist", "media");
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(mediaUri, "style.css")
  );
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(mediaUri, "script.js")
  );

  panel.webview.html = getWebviewContent(
    stratagemName,
    sequence,
    styleUri,
    scriptUri
  );
}

function getWebviewContent(
  stratagemName: string,
  sequence: string,
  styleUri: vscode.Uri,
  scriptUri: vscode.Uri
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
      <h1>⚡ Stratagem Activated ⚡</h1>
      <div class="sequence flash">${sequence.split("").join(" ")}</div>
      <h2>${stratagemName}</h2>
      <script src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
