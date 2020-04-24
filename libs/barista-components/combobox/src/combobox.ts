/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  DtAutocomplete,
  DtAutocompleteSelectedEvent,
  DtAutocompleteTrigger,
} from '@dynatrace/barista-components/autocomplete';
import { fromEvent, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
} from 'rxjs/operators';
import {
  CanDisable,
  DtOption,
  ErrorStateMatcher,
  HasTabIndex,
  mixinDisabled,
  mixinErrorState,
  mixinTabIndex,
} from '@dynatrace/barista-components/core';
import { DtFormFieldControl } from '@dynatrace/barista-components/form-field';
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { TemplatePortal } from '@angular/cdk/portal';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

// Note: this is a non-exhaustive list of commonly used keys that don't alter text
// See also: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
const NON_TEXT_ALTERING_KEYS = [
  // modifier keys
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'FnLock',
  'Hyper',
  'Meta',
  'NumLock',
  'ScrollLock',
  'Shift',
  'Super',
  'Symbol',
  'SymbolLock',
  // whitespace keys
  'Enter',
  'Tab',
  // navigation keys
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  // UI keys
  'Escape',
];

export class DtComboboxBase {
  constructor(
    public _elementRef: ElementRef,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    public _parentForm: NgForm,
    public _parentFormGroup: FormGroupDirective,
    public ngControl: NgControl,
  ) {}
}
export const _DtComboboxMixinBase = mixinTabIndex(
  mixinDisabled(mixinErrorState(DtComboboxBase)),
);

@Component({
  selector: 'dt-combobox',
  exportAs: 'dtCombobox',
  templateUrl: 'combobox.html',
  styleUrls: ['combobox.scss'],
  host: {
    class: 'dt-combobox',
    // role: 'listbox', // TODO ChMa: a11y build still fails with "Certain ARIA roles must contain particular children"
    '[class.dt-checkbox-loading]': '_loading',
    '[class.dt-checkbox-disabled]': 'disabled',
    '[class.dt-checkbox-invalid]': 'errorState',
    '[class.dt-checkbox-required]': 'required',
    '[class.dt-checkbox-open]': '_panelOpen',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
    '[attr.aria-label]': 'ariaLabel',
    '[attr.aria-labelledby]': 'ariaLabelledBy',
    '[attr.aria-required]': 'required.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-invalid]': 'errorState',
  },
  inputs: ['disabled', 'tabIndex'],
  providers: [{ provide: DtFormFieldControl, useExisting: DtCombobox }],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtCombobox<T> extends _DtComboboxMixinBase
  implements
    OnInit,
    AfterViewInit,
    OnDestroy,
    CanDisable,
    HasTabIndex,
    DtFormFieldControl<T> {
  /** The ID for the combobox. */
  @Input() id: string;
  /** The currently selected value in the combobox. */
  @Input() value: T | null;

  /** When set to true, a loading indicator is shown to show to the user that data is currently being loaded/filtered. */
  @Input()
  get loading(): boolean {
    return this._loading;
  }
  set loading(value: boolean) {
    const coercedValue = coerceBooleanProperty(value);

    if (coercedValue !== this._loading) {
      this._loading = coercedValue;

      if (this._loading) {
        this._reopenAutocomplete = true;
        this._autocompleteTrigger.closePanel();
      } else if (this._reopenAutocomplete) {
        this._reopenAutocomplete = false;
        this._autocompleteTrigger.openPanel();
      }
      this._changeDetectorRef.markForCheck();
    }
  }
  _loading = false;

  /** Whether the control is required. */
  @Input() required: boolean = false;
  /** An arbitrary class name that is added to the combobox dropdown. */
  @Input() panelClass: string = '';
  /** A placeholder text for the input field. */
  @Input() placeholder: string | undefined;
  /** A function returning a display name for a given object that represents an option from the combobox. */
  @Input() displayWith: (value: T) => string = (value: T) => `${value}`;
  /** Aria label of the select. */
  @Input('aria-label') ariaLabel: string;
  /** Input that can be used to specify the `aria-labelledby` attribute. */
  @Input('aria-labelledby') ariaLabelledBy: string;
  /** Whether the control is focused. (TODO ChMa: implement!) */
  @Input() focused: boolean;

  /** Event emitted when a new value has been selected. */
  @Output() valueChange = new EventEmitter<T>();
  /** Event emitted when the filter changes. */
  @Output() filterChange = new EventEmitter<string>();
  /** Event emitted when the select panel has been toggled. */
  @Output() openedChange = new EventEmitter<boolean>();

  @ViewChild('autocompleteTrigger', { static: true })
  _autocompleteTrigger: DtAutocompleteTrigger<any>;
  @ViewChild('searchInput', { static: true }) _searchInput: ElementRef;
  @ViewChild('autocompleteContent') templatePortalContent: TemplateRef<any>;
  @ViewChild(DtAutocomplete) _autocomplete: DtAutocomplete<T>;

  @ContentChildren(DtOption, { descendants: true })
  _options: QueryList<DtOption<T>>;

  /** @return <code>false</code> if no value is currently selected. */
  get empty(): boolean {
    return this.value === null;
  }

  /** @internal is <code>false</code> if the autocomplete panel is not shown */
  _panelOpen = false;

  private _reopenAutocomplete = false;
  private _filterChangeSubscription: Subscription;

  constructor(
    public _elementRef: ElementRef,
    @Optional() public _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() public _parentForm: NgForm,
    @Optional() public _parentFormGroup: FormGroupDirective,
    @Optional() public ngControl: NgControl,
    private _viewContainerRef: ViewContainerRef,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {
    super(
      _elementRef,
      _defaultErrorStateMatcher,
      _parentForm,
      _parentFormGroup,
      ngControl,
    );
  }

  ngOnInit(): void {
    this._filterChangeSubscription = fromEvent(
      this._searchInput.nativeElement,
      'keyup',
    )
      .pipe(
        filter(
          (event: KeyboardEvent): boolean =>
            !NON_TEXT_ALTERING_KEYS.includes(event.key),
        ),
        map((event: KeyboardEvent): string => {
          event.stopPropagation();
          return this._searchInput.nativeElement.value;
        }),
        distinctUntilChanged(),
        debounceTime(150),
      )
      .subscribe((query) => this.filterChange.emit(query));
  }

  ngAfterViewInit(): void {
    this._autocomplete._additionalPortal = new TemplatePortal(
      this.templatePortalContent,
      this._viewContainerRef,
    );
    this._autocomplete._additionalOptions = this._options.toArray();
  }

  ngOnDestroy(): void {
    this._filterChangeSubscription.unsubscribe();
  }

  /** @internal called when the user selects a different option */
  _optionSelected(event: DtAutocompleteSelectedEvent<T>): void {
    const value = event.option.value;

    this.value = value;
    this._changeDetectorRef.markForCheck();

    this.valueChange.emit(value);
  }

  /** Sets the list of element IDs that currently describe this control. */
  setDescribedByIds(_: string[]): void {
    // TODO ChMa: implement (what does this even do?)
    // console.log(`setDescribedByIds(${ids})`);
  }

  /** Handles a click on the control's container. */
  onContainerClick(_: MouseEvent): void {
    // TODO ChMa: implement (do we even need this handler?)
    // console.log(`onContainerClick(${event})`);
  }

  /** @internal called when user clicks on trigger, opens or closes the autocomplete panel */
  _toggle(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this._panelOpen) {
      this._panelOpen = false;
      this._autocompleteTrigger.closePanel(); // implicitly triggers _closed()
    } else {
      this._panelOpen = true;
      this._autocompleteTrigger.openPanel(); // implicitly triggers _opened()
    }
  }

  /** @internal called when dt-autocomplete emits an open event */
  _opened(): void {
    // console.log(`_opened()`);

    this._panelOpen = true;
    this.openedChange.emit(true);
    this._changeDetectorRef.markForCheck();
  }

  /** @internal called when dt-autocomplete emits a close event */
  _closed(): void {
    // console.log(`_closed()`);

    this._panelOpen = false;
    this.openedChange.emit(false);
    this._changeDetectorRef.markForCheck();
  }
}
