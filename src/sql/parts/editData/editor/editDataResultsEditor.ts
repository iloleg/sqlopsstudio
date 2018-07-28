/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the Source EULA. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as DOM from 'vs/base/browser/dom';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { Builder } from 'vs/base/browser/builder';
import { EditorOptions } from 'vs/workbench/common/editor';
import { TPromise } from 'vs/base/common/winjs.base';
import { getZoomLevel } from 'vs/base/browser/browser';
import { Event } from 'vs/base/common/event';
import { Configuration } from 'vs/editor/browser/config/configuration';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import * as types from 'vs/base/common/types';

import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { bootstrapAngular } from 'sql/services/bootstrap/bootstrapService';
import { BareResultsGridInfo } from 'sql/parts/query/editor/queryResultsEditor';
import { IEditDataComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { EditDataModule } from 'sql/parts/grid/views/editData/editData.module';
import { EDITDATA_SELECTOR } from 'sql/parts/grid/views/editData/editData.component';
import { EditDataResultsInput } from 'sql/parts/editData/common/editDataResultsInput';

export class EditDataResultsEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.editDataResultsEditor';
	public static AngularSelectorString: string = 'slickgrid-container.slickgridContainer';
	protected _input: EditDataResultsInput;
	protected _rawOptions: BareResultsGridInfo;
	private _saveViewStateEvent: Event<void>;
	private _restoreViewStateEvent: Event<void>;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConfigurationService private _configurationService: IConfigurationService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(EditDataResultsEditor.ID, telemetryService, themeService);
		this._rawOptions = BareResultsGridInfo.createFromRawSettings(this._configurationService.getValue('resultsGrid'), getZoomLevel());
		this._configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('resultsGrid')) {
				this._rawOptions = BareResultsGridInfo.createFromRawSettings(this._configurationService.getValue('resultsGrid'), getZoomLevel());
				this._applySettings();
			}
		});
	}

	public get input(): EditDataResultsInput {
		return this._input;
	}

	public createEditor(parent: HTMLElement): void {
	}

	public dispose(): void {
		super.dispose();
	}

	public layout(dimension: DOM.Dimension): void {
	}

	public setInput(input: EditDataResultsInput, options: EditorOptions): TPromise<void> {
		super.setInput(input, options);
		this._applySettings();
		if (!input.hasBootstrapped) {
			this._bootstrapAngular();
		}
		return TPromise.wrap<void>(null);
	}

	public setViewStateChangeEvents(onRestoreViewStateEvent: Event<void>, onSaveViewStateEvent: Event<void>) {
		this._restoreViewStateEvent = onRestoreViewStateEvent;
		this._saveViewStateEvent = onSaveViewStateEvent;
	}

	private _applySettings() {
		if (this.input && this.input.container) {
			Configuration.applyFontInfoSlow(this.getContainer(), this._rawOptions);
			if (!this.input.css) {
				this.input.css = DOM.createStyleSheet(this.input.container);
			}
			let cssRuleText = '';
			if (types.isNumber(this._rawOptions.cellPadding)) {
				cssRuleText = this._rawOptions.cellPadding + 'px';
			} else {
				cssRuleText = this._rawOptions.cellPadding.join('px ') + 'px;';
			}
			let content = `.grid .slick-cell { padding: ${cssRuleText}; }`;
			this.input.css.innerHTML = content;
		}
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private _bootstrapAngular(): void {
		let input = <EditDataResultsInput>this.input;
		let uri = input.uri;

		// Pass the correct DataService to the new angular component
		let dataService = this._queryModelService.getDataService(uri);
		if (!dataService) {
			throw new Error('DataService not found for URI: ' + uri);
		}

		// Mark that we have bootstrapped
		input.setBootstrappedTrue();

		// Get the bootstrap params and perform the bootstrap
		// Note: pass in input so on disposal this is cleaned up.
		// Otherwise many components will be left around and be subscribed
		// to events from the backing data service
		const parent = input.container;
		let params: IEditDataComponentParams = {
			dataService: dataService,
			onRestoreViewState: this._restoreViewStateEvent,
			onSaveViewState: this._saveViewStateEvent
		};
		bootstrapAngular(this._instantiationService,
			EditDataModule,
			parent,
			EDITDATA_SELECTOR,
			params,
			input);
	}
}