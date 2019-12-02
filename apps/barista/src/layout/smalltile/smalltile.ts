/**
 * @license
 * Copyright 2019 Dynatrace LLC
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

import { Component, Input } from '@angular/core';

import { BaIndexPageItem } from '../../shared/page-contents';

@Component({
  selector: 'ba-smalltile',
  templateUrl: 'smalltile.html',
  styleUrls: ['smalltile.scss'],
  host: {
    '[class]': '"ba-theme-" + _theme',
    '[class.ba-smalltile-link-wrapper]': 'data',
  },
})
export class BaSmallTile {
  @Input() data: BaIndexPageItem;

  /** @internal Gets the tile's theme based on its category. */
  get _theme(): string {
    if (this.data) {
      switch (this.data.category) {
        case 'Brand':
          return 'green';
        case 'Resources':
          return 'blue';
        case 'Components':
          return 'royalblue';
        case 'Tools':
          return 'yellow';
      }
    }
    return 'turquoise';
  }

  /** @internal Gets the tile's identifier based on the title. */
  get _identifier(): string {
    if (this.data.title) {
      return this.data.title.slice(0, 2);
    }

    return 'Id';
  }
}