/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { Event } from 'vs/base/common/event';
import { SlickGrid } from 'angular2-slickgrid';
import { ISlickRange } from '../../../../../parts/grid/common/interfaces';

/**
 * TODO
 */
export class SaveGridViewState<T> implements Slick.Plugin<T> {
	private angularGrid: SlickGrid;
	private grid: Slick.Grid<T>;
	private handler = new Slick.EventHandler();

	private scrollState: Slick.OnScrollEventArgs<T>;
	private savedScrollState: Slick.OnScrollEventArgs<T>;
	private selection: ISlickRange[];

	constructor(onSaveState: Event<void>, onRestoreState: Event<void>, private getGridComponent: () => SlickGrid) {
		onSaveState(() => this.onSaveState());
		onRestoreState(() => this.onRestoreState());
	}

	public init(grid: Slick.Grid<T>) {
		this.grid = grid;
		this.handler.subscribe(this.grid.onScroll, (e, args) => this.onScroll(e, args));
		this.angularGrid = this.getGridComponent();
	}

	public destroy() {
		this.handler.unsubscribeAll();
	}

	private onScroll(e: any, args: Slick.OnScrollEventArgs<T>): void {
		this.scrollState = args;
	}

	private onSaveState() {
		this.selection = this.getGridComponent().getSelectedRanges();
		this.savedScrollState = this.scrollState;
	}

	private onRestoreState() {
		this.getGridComponent().selection = this.selection;
		this.grid.getCanvasNode().parentElement.scrollTop = this.savedScrollState.scrollTop;
		this.grid.getCanvasNode().parentElement.scrollLeft = this.savedScrollState.scrollLeft;
	}
}
