/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Code } from '../../vscode/code';
import { Commands } from '../workbench/workbench';

const PANEL_SELECTOR = 'div[id="workbench.panel.terminal"]';
const XTERM_SELECTOR = `${PANEL_SELECTOR} .terminal-wrapper`;
const XTERM_TEXTAREA = `${XTERM_SELECTOR} textarea.xterm-helper-textarea`;

export class Terminal {

	constructor(private code: Code, private commands: Commands) { }

	async showTerminal(): Promise<void> {
		await this.commands.runCommand('workbench.action.terminal.toggleTerminal');
		await this.code.waitForActiveElement(XTERM_TEXTAREA);
		await this.code.waitForTerminalBuffer(XTERM_SELECTOR, lines => lines.some(line => line.length > 0));
	}

	async runCommand(commandText: string): Promise<void> {
		await this.code.waitForPaste(XTERM_TEXTAREA, commandText);
		await this.code.dispatchKeybinding('enter');
	}

	async waitForTerminalText(accept: (buffer: string[]) => boolean): Promise<void> {
		await this.code.waitForTerminalBuffer(XTERM_SELECTOR, accept);
	}
}