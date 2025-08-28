import * as vscode from "vscode";

// Define stratagem data structure
interface StratagemData {
  name: string;
  sequence: string;
  description?: string;
  action: () => void;
}

const stratagems: Record<string, StratagemData> = {
  "🡅🡅🡅🡅": {
    name: "Orbital Strike",
    sequence: "🡅🡅🡅🡅",
    description: "Calls down an orbital strike",
    action: () => {
      vscode.window.showInformationMessage("💥 Orbital Strike Deployed!");
      vscode.commands.executeCommand("editor.action.commentLine");
    },
  },
  "🡇🡇🡇🡇": {
    name: "Supply Drop",
    sequence: "🡇🡇🡇🡇",
    description: "Opens a new terminal for supplies",
    action: () =>
      vscode.commands.executeCommand("workbench.action.terminal.new"),
  },
  "🡅🡅🡇🡇": {
    name: "Shield Online",
    sequence: "🡅🡅🡇🡇",
    description: "Activates shield (comment line)",
    action: () => vscode.commands.executeCommand("editor.action.commentLine"),
  },
};

// Tree data provider for stratagems
class StratagemTreeItem extends vscode.TreeItem {
  constructor(
    public readonly stratagem: StratagemData,
    public readonly sequence: string
  ) {
    super(stratagem.name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${stratagem.name}: ${stratagem.sequence}`;
    this.description = stratagem.sequence;
    this.contextValue = "stratagem";
    this.command = {
      command: "helldivers.executeStratagem",
      title: "Execute Stratagem",
      arguments: [sequence],
    };
  }
}

class StratagemTreeDataProvider
  implements vscode.TreeDataProvider<StratagemTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    StratagemTreeItem | undefined | null | void
  > = new vscode.EventEmitter<StratagemTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    StratagemTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  getTreeItem(element: StratagemTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: StratagemTreeItem): Thenable<StratagemTreeItem[]> {
    if (!element) {
      // Return root items (all stratagems)
      const items: StratagemTreeItem[] = [];
      for (const [sequence, stratagem] of Object.entries(stratagems)) {
        items.push(new StratagemTreeItem(stratagem, sequence));
      }
      return Promise.resolve(items);
    }
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

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

  // Register directional commands
  context.subscriptions.push(registerStratagemCommand(context, "🡅"));
  context.subscriptions.push(registerStratagemCommand(context, "🡇"));
  context.subscriptions.push(registerStratagemCommand(context, "🡄"));
  context.subscriptions.push(registerStratagemCommand(context, "🡆"));

  // Create and register the tree data provider
  const stratagemProvider = new StratagemTreeDataProvider();
  const treeView = vscode.window.createTreeView("helldivers.stratagems", {
    treeDataProvider: stratagemProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  // Register tree view commands
  context.subscriptions.push(
    vscode.commands.registerCommand("helldivers.refreshStratagems", () => {
      stratagemProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "helldivers.executeStratagem",
      (sequence: string) => {
        if (stratagems[sequence]) {
          stratagems[sequence].action();
          openStratagemWebview(context, stratagems[sequence].name, sequence);
          vscode.window.showInformationMessage(
            `🎯 Executed: ${stratagems[sequence].name}`
          );
        }
      }
    )
  );
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
  // Create SVG representations as a last resort, while keeping Unicode as primary
  const sequenceWithSVGFallback = sequence
    .split("")
    .map((char) => {
      const svgStyle =
        'width="1em" height="1em" fill="currentColor" style="display: inline-block; vertical-align: middle;"';
      switch (char) {
        case "🡅":
          return `<span class="unicode-char" data-unicode="🡅">🡅</span><svg ${svgStyle} class="svg-fallback" style="display: none;"><path d="M12 4l-8 8h16z"/></svg>`;
        case "🡇":
          return `<span class="unicode-char" data-unicode="🡇">🡇</span><svg ${svgStyle} class="svg-fallback" style="display: none;"><path d="M12 20l8-8H4z"/></svg>`;
        case "🡄":
          return `<span class="unicode-char" data-unicode="🡄">🡄</span><svg ${svgStyle} class="svg-fallback" style="display: none;"><path d="M4 12l8-8v16z"/></svg>`;
        case "🡆":
          return `<span class="unicode-char" data-unicode="🡆">🡆</span><svg ${svgStyle} class="svg-fallback" style="display: none;"><path d="M20 12l-8 8V4z"/></svg>`;
        default:
          return char;
      }
    })
    .join(" ");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <style>
        .unicode-char {
          font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', 'Symbola', system-ui, monospace;
          font-size: 2rem;
        }
        .svg-fallback {
          color: limegreen;
          font-size: 2rem;
        }
      </style>
    </head>
    <body>
      <h1>⚡ Stratagem Activated ⚡</h1>
      <div class="sequence flash">${sequenceWithSVGFallback}</div>
      <h2>${stratagemName}</h2>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Test if Unicode characters are rendering properly
          const unicodeChars = document.querySelectorAll('.unicode-char');
          
          unicodeChars.forEach(char => {
            // Create a test element to measure if Unicode is rendering
            const testEl = document.createElement('div');
            testEl.style.position = 'absolute';
            testEl.style.visibility = 'hidden';
            testEl.style.fontSize = '2rem';
            testEl.style.fontFamily = char.style.fontFamily;
            testEl.textContent = char.getAttribute('data-unicode');
            document.body.appendChild(testEl);
            
            // If the character width is very small, it's probably not rendering
            const rect = testEl.getBoundingClientRect();
            if (rect.width < 10) {
              // Hide Unicode, show SVG fallback
              char.style.display = 'none';
              const svgFallback = char.nextElementSibling;
              if (svgFallback && svgFallback.classList.contains('svg-fallback')) {
                svgFallback.style.display = 'inline-block';
              }
            }
            
            document.body.removeChild(testEl);
          });
        });
      </script>
      <script src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
